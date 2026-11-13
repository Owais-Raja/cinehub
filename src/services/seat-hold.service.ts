import prisma from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/rbac";
import { SEAT_HOLD_DURATION_MINUTES } from "@/lib/constants";
import { AuditService } from "./audit.service";
import { HoldStatus, Prisma } from "@prisma/client";

export interface SeatAvailabilityDto {
  id: string;
  row: string;
  number: number;
  category: "SILVER" | "GOLD" | "PLATINUM" | "RECLINER";
  price: number;
  status: "AVAILABLE" | "HELD" | "BOOKED";
  heldUntil?: string;
  isHeldByCurrentUser?: boolean;
}

export class SeatHoldService {
  /**
   * Lazily marks expired active holds as EXPIRED
   */
  static async sweepExpiredHolds(showId?: string): Promise<number> {
    const now = new Date();
    const result = await prisma.seatHold.updateMany({
      where: {
        ...(showId ? { showId } : {}),
        status: HoldStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      data: {
        status: HoldStatus.EXPIRED,
      },
    });
    return result.count;
  }

  /**
   * High-concurrency seat holding with pessimistic locking & transaction isolation.
   * Satisfies Acceptance Tests AT-1, AT-2, and AT-3.
   */
  static async holdSeats({
    showId,
    seatIds,
    userId,
    sessionToken,
  }: {
    showId: string;
    seatIds: string[];
    userId: string;
    sessionToken: string;
  }) {
    if (!seatIds.length) {
      throw new Error("No seats specified for reservation.");
    }

    // 1. Verify show exists and is active
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        screen: { include: { theatre: true } },
        movie: true,
      },
    });

    if (!show) {
      throw new NotFoundError("Requested show was not found.");
    }

    if (show.status === "CANCELLED" || show.status === "COMPLETED") {
      throw new ConflictError("This show is no longer accepting reservations.");
    }

    // 2. Execute within an ACID Prisma transaction with pessimistic lock logic
    try {
      return await prisma.$transaction(
        async (tx) => {
          // Step 0: Acquire pessimistic row lock on the requested physical seats
          await tx.$queryRaw`SELECT id FROM "Seat" WHERE id IN (${Prisma.join(seatIds)}) FOR UPDATE`;

          const now = new Date();

          // Step A: Expire stale holds in real-time
          await tx.seatHold.updateMany({
            where: {
              showId,
              seatId: { in: seatIds },
              status: HoldStatus.ACTIVE,
              expiresAt: { lte: now },
            },
            data: {
              status: HoldStatus.EXPIRED,
            },
          });

          // Step B: Check if any requested seat is already CONFIRMED booked
          const confirmedBooking = await tx.bookingSeat.findFirst({
            where: {
              showId,
              seatId: { in: seatIds },
              booking: { status: "CONFIRMED" },
            },
            include: { seat: true },
          });

          if (confirmedBooking) {
            throw new ConflictError(
              `Seat Row ${confirmedBooking.seat.row} Number ${confirmedBooking.seat.number} is already booked.`,
              { conflictingSeatId: confirmedBooking.seatId }
            );
          }

          // Step C: Check if any seat is currently HELD by a different user with active TTL
          const activeHoldConflict = await tx.seatHold.findFirst({
            where: {
              showId,
              seatId: { in: seatIds },
              status: HoldStatus.ACTIVE,
              expiresAt: { gt: now },
              userId: { not: userId },
            },
            include: { seat: true },
          });

          if (activeHoldConflict) {
            throw new ConflictError(
              `Seat Row ${activeHoldConflict.seat.row} Number ${activeHoldConflict.seat.number} is currently held by another user.`,
              {
                conflictingSeatId: activeHoldConflict.seatId,
                heldUntil: activeHoldConflict.expiresAt.toISOString(),
              }
            );
          }

          // Step D: Calculate new expiration timestamp (10 minutes lease)
          const expiresAt = new Date(now.getTime() + SEAT_HOLD_DURATION_MINUTES * 60 * 1000);

          // Step E: Release previous active holds by this user for other seats in this show
          await tx.seatHold.updateMany({
            where: {
              showId,
              userId,
              status: HoldStatus.ACTIVE,
              seatId: { notIn: seatIds },
            },
            data: {
              status: HoldStatus.RELEASED,
            },
          });

          // Step F: Create or update hold records for all requested seats
          const holdRecords = [];
          for (const seatId of seatIds) {
            // Release any existing hold for this seat by this user first
            await tx.seatHold.updateMany({
              where: { showId, seatId, userId, status: HoldStatus.ACTIVE },
              data: { status: HoldStatus.RELEASED },
            });

            const hold = await tx.seatHold.create({
              data: {
                showId,
                seatId,
                userId,
                sessionToken,
                status: HoldStatus.ACTIVE,
                expiresAt,
              },
            });
            holdRecords.push(hold);
          }

          // Log audit event
          await AuditService.log({
            userId,
            action: "SEATS_HELD",
            entityType: "Show",
            entityId: showId,
            metadata: { seatIds, expiresAt: expiresAt.toISOString() },
          });

          return {
            holdId: holdRecords[0].id,
            showId,
            seatIds,
            expiresAt: expiresAt.toISOString(),
            remainingSeconds: SEAT_HOLD_DURATION_MINUTES * 60,
          };
        },
        {
          maxWait: 10000,
          timeout: 20000,
        }
      );
    } catch (err: any) {
      if (err instanceof ConflictError) {
        throw err;
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2034" || err.code === "P2002")
      ) {
        throw new ConflictError(
          "One or more requested seats are currently being locked by a concurrent reservation request. Please try again in a few moments."
        );
      }
      if (err.message && (err.message.includes("could not serialize access") || err.message.includes("conflict"))) {
        throw new ConflictError(
          "Concurrent reservation conflict detected. Seat is already reserved by another user."
        );
      }
      throw err;
    }
  }

  /**
   * Explicitly releases a user's active seat hold
   */
  static async releaseHold({
    holdId,
    userId,
  }: {
    holdId: string;
    userId: string;
  }) {
    const hold = await prisma.seatHold.findUnique({
      where: { id: holdId },
    });

    if (!hold || hold.userId !== userId) {
      throw new NotFoundError("Hold record not found or unauthorized.");
    }

    await prisma.seatHold.update({
      where: { id: holdId },
      data: { status: HoldStatus.RELEASED },
    });

    return { success: true, message: "Seats released successfully." };
  }

  /**
   * Retrieves real-time screen seat map with calculated states: AVAILABLE, HELD, BOOKED
   */
  static async getShowSeatAvailability(
    showId: string,
    currentUserId?: string
  ): Promise<{
    show: {
      id: string;
      movieTitle: string;
      screenName: string;
      theatreName: string;
      startTime: string;
      format: string;
      language: string;
    };
    pricing: Record<string, number>;
    seats: SeatAvailabilityDto[];
  }> {
    // 1. Run lazy sweep
    await this.sweepExpiredHolds(showId);

    // 2. Fetch show with screen, seats, tier pricing, and active holds/bookings
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        movie: true,
        language: true,
        format: true,
        screen: {
          include: {
            theatre: true,
            seats: {
              where: { isActive: true },
              orderBy: [{ row: "asc" }, { number: "asc" }],
            },
          },
        },
        prices: true,
      },
    });

    if (!show) {
      throw new NotFoundError("Show not found");
    }

    // 3. Build price map by category
    const basePrice = Number(show.basePrice);
    const pricingMap: Record<string, number> = {
      SILVER: basePrice,
      GOLD: basePrice * 1.3,
      PLATINUM: basePrice * 1.6,
      RECLINER: basePrice * 2.2,
    };

    for (const p of show.prices) {
      pricingMap[p.category] = Number(p.price);
    }

    const now = new Date();

    // 4. Fetch confirmed bookings for this show
    const confirmedSeats = await prisma.bookingSeat.findMany({
      where: {
        showId,
        booking: { status: "CONFIRMED" },
      },
      select: { seatId: true },
    });
    const bookedSeatIds = new Set(confirmedSeats.map((b) => b.seatId));

    // 5. Fetch active holds
    const activeHolds = await prisma.seatHold.findMany({
      where: {
        showId,
        status: HoldStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      select: { seatId: true, userId: true, expiresAt: true },
    });

    const holdMap = new Map<string, { userId: string; expiresAt: Date }>();
    for (const h of activeHolds) {
      holdMap.set(h.seatId, { userId: h.userId, expiresAt: h.expiresAt });
    }

    // 6. Map seats
    const seats: SeatAvailabilityDto[] = show.screen.seats.map((seat) => {
      let status: "AVAILABLE" | "HELD" | "BOOKED" = "AVAILABLE";
      let heldUntil: string | undefined = undefined;
      let isHeldByCurrentUser = false;

      if (bookedSeatIds.has(seat.id)) {
        status = "BOOKED";
      } else if (holdMap.has(seat.id)) {
        const holdInfo = holdMap.get(seat.id)!;
        status = "HELD";
        heldUntil = holdInfo.expiresAt.toISOString();
        if (currentUserId && holdInfo.userId === currentUserId) {
          isHeldByCurrentUser = true;
        }
      }

      return {
        id: seat.id,
        row: seat.row,
        number: seat.number,
        category: seat.category,
        price: pricingMap[seat.category] || basePrice,
        status,
        heldUntil,
        isHeldByCurrentUser,
      };
    });

    return {
      show: {
        id: show.id,
        movieTitle: show.movie.title,
        screenName: show.screen.name,
        theatreName: show.screen.theatre.name,
        startTime: show.startTime.toISOString(),
        format: show.format.name,
        language: show.language.name,
      },
      pricing: pricingMap,
      seats,
    };
  }
}
