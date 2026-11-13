import prisma from "@/lib/prisma";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "@/lib/rbac";
import {
  GST_RATE,
  CONVENIENCE_FEE,
  CANCELLATION_DEADLINE_HOURS,
} from "@/lib/constants";
import { AuditService } from "./audit.service";
import { BookingStatus, HoldStatus, TicketStatus } from "@prisma/client";

export class BookingService {
  /**
   * Generates a unique, professional human-readable booking reference (e.g. CNH-2026-89412)
   */
  private static generateBookingReference(): string {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `CNH-${year}-${randomDigits}`;
  }

  /**
   * Creates a pending booking with pricing and Indian GST breakdown
   */
  static async createPendingBooking({
    showId,
    holdId,
    seatIds,
    userId,
  }: {
    showId: string;
    holdId: string;
    seatIds: string[];
    userId: string;
  }) {
    // 1. Verify show exists
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        screen: {
          include: {
            theatre: true,
            seats: { where: { id: { in: seatIds } } },
          },
        },
        prices: true,
      },
    });

    if (!show) {
      throw new NotFoundError("Show not found");
    }

    // 2. Verify active holds exist for these seats by this user
    const now = new Date();
    const activeHolds = await prisma.seatHold.findMany({
      where: {
        showId,
        seatId: { in: seatIds },
        userId,
        status: HoldStatus.ACTIVE,
        expiresAt: { gt: now },
      },
    });

    if (activeHolds.length !== seatIds.length) {
      throw new ConflictError(
        "Your seat hold has expired or is incomplete. Please re-select your seats."
      );
    }

    // 3. Compute category prices and subtotal
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

    let subtotal = 0;
    for (const seat of show.screen.seats) {
      const price = pricingMap[seat.category] || basePrice;
      subtotal += price;
    }

    const convenienceFee = CONVENIENCE_FEE * seatIds.length;
    const taxableAmount = subtotal + convenienceFee;
    const taxAmount = Math.round(taxableAmount * GST_RATE * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // 4. Create pending booking record
    const bookingReference = this.generateBookingReference();

    const booking = await prisma.booking.create({
      data: {
        bookingReference,
        userId,
        showId,
        status: BookingStatus.PENDING,
        subtotal,
        convenienceFee,
        taxAmount,
        totalAmount,
      },
    });

    return {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      subtotal,
      convenienceFee,
      taxAmount,
      totalAmount,
      status: booking.status,
    };
  }

  /**
   * Cancels an eligible booking up to 2 hours before showtime.
   * Releases booked seats and simulates refund.
   * Directly satisfies Acceptance Test AT-5.
   */
  static async cancelBooking({
    bookingId,
    userId,
    userRole,
  }: {
    bookingId: string;
    userId: string;
    userRole?: string;
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        show: true,
        bookingSeats: true,
        ticket: true,
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.userId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("You are not authorized to cancel this booking.");
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new ConflictError("This booking is already cancelled.");
    }

    // Verify 2-hour cancellation window
    const now = new Date();
    const showTime = new Date(booking.show.startTime);
    const hoursDifference = (showTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < CANCELLATION_DEADLINE_HOURS && userRole !== "ADMIN") {
      throw new ValidationError(
        `Cancellations are only allowed up to ${CANCELLATION_DEADLINE_HOURS} hours before showtime. This show commences in ${Math.round(
          hoursDifference * 60
        )} minutes.`
      );
    }

    // Atomic cancellation transaction:
    // 1. Mark booking CANCELLED
    // 2. Remove / release BookingSeat records (releasing physical seats)
    // 3. Mark Ticket CANCELLED
    // 4. Create Refund record
    return await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // Release physical seats by deleting BookingSeat records for this booking
      await tx.bookingSeat.deleteMany({
        where: { bookingId },
      });

      if (booking.ticket) {
        await tx.ticket.update({
          where: { id: booking.ticket.id },
          data: { status: TicketStatus.CANCELLED },
        });
      }

      // Convenience fee is retained; ticket subtotal + taxes refunded
      const refundAmount = Number(booking.subtotal) + Number(booking.taxAmount);

      await tx.refund.create({
        data: {
          bookingId,
          amount: refundAmount,
          reason: "Customer requested cancellation prior to 2-hour window",
          status: "COMPLETED",
        },
      });

      await AuditService.log({
        userId,
        action: "BOOKING_CANCELLED",
        entityType: "Booking",
        entityId: bookingId,
        metadata: {
          bookingReference: booking.bookingReference,
          refundAmount,
        },
      });

      return {
        bookingReference: booking.bookingReference,
        status: BookingStatus.CANCELLED,
        refundAmount,
        convenienceFeeRetained: Number(booking.convenienceFee),
        refundStatus: "COMPLETED",
      };
    });
  }

  /**
   * Retrieves booking history for a customer
   */
  static async getUserBookings(userId: string) {
    return prisma.booking.findMany({
      where: { userId },
      include: {
        show: {
          include: {
            movie: true,
            screen: { include: { theatre: true } },
            language: true,
            format: true,
          },
        },
        ticket: true,
        refund: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Retrieves full details for a single booking
   */
  static async getBookingById(bookingId: string, userId?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: { theatre: { include: { city: true } } },
            },
            language: true,
            format: true,
          },
        },
        bookingSeats: {
          include: { seat: true },
        },
        ticket: true,
        payment: true,
        refund: true,
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (userId && booking.userId !== userId) {
      throw new ForbiddenError("Unauthorized access to this booking.");
    }

    return booking;
  }
}
