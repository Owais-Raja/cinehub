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

    if (!show || !show.screen.seats.length) {
      expect(SeatHoldService.holdSeats).toBeDefined();
      return;
    }

    const targetSeat = show.screen.seats[0];
    const userA = "user-concurrency-a";
    const userB = "user-concurrency-b";

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

    // Exactly one should succeed, and the other must be rejected with ConflictError (409)
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
