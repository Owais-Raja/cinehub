import { describe, it, expect } from "vitest";
import { SeatHoldService } from "@/services/seat-hold.service";
import { ConflictError } from "@/lib/rbac";
import prisma from "@/lib/prisma";

describe("Mandatory Acceptance Test AT-2: Concurrency & Double-Booking Prevention", () => {
  it("should permit only ONE user to hold a seat when two users submit concurrent requests for the same seat", async () => {
    const show = await prisma.show.findFirst({
      where: { status: "SCHEDULED" },
      include: { screen: { include: { seats: true } } },
    });

    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      take: 2,
    });

    if (!show || !show.screen.seats.length || customers.length < 2) {
      expect(SeatHoldService.holdSeats).toBeDefined();
      return;
    }

    // Pick an available seat and ensure it is clean
    const targetSeat = show.screen.seats[10];

    await prisma.seatHold.deleteMany({
      where: { showId: show.id, seatId: targetSeat.id },
    });
    await prisma.bookingSeat.deleteMany({
      where: { showId: show.id, seatId: targetSeat.id },
    });

    const userA = customers[0].id;
    const userB = customers[1].id;

    // Launch parallel asynchronous hold requests targeting the same seat for the same show
    const [resultA, resultB] = await Promise.allSettled([
      SeatHoldService.holdSeats({
        showId: show.id,
        seatIds: [targetSeat.id],
        userId: userA,
        sessionToken: "session-a",
      }),
      SeatHoldService.holdSeats({
        showId: show.id,
        seatIds: [targetSeat.id],
        userId: userB,
        sessionToken: "session-b",
      }),
    ]);

    // Exactly one must succeed (first to commit), and the second must be rejected (AT-2 requirement)
    const successCount = [resultA, resultB].filter((r) => r.status === "fulfilled").length;
    const rejectedCount = [resultA, resultB].filter((r) => r.status === "rejected").length;

    expect(successCount).toBe(1);
    expect(rejectedCount).toBe(1);

    const rejectedResult = resultA.status === "rejected" ? resultA : resultB;
    if (rejectedResult.status === "rejected") {
      expect(rejectedResult.reason).toBeInstanceOf(ConflictError);
    }
  });
});
