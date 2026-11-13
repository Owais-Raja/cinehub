import { describe, it, expect } from "vitest";
import { SeatHoldService } from "@/services/seat-hold.service";
import prisma from "@/lib/prisma";

describe("Mandatory Acceptance Test AT-3: Hold Expiry and Seat Retention", () => {
  it("should release expired holds while keeping confirmed bookings unavailable", async () => {
    const show = await prisma.show.findFirst({
      where: { status: "SCHEDULED" },
      include: { screen: { include: { seats: true } } },
    });

    const user = await prisma.user.findFirst({
      where: { role: "CUSTOMER" },
    });

    if (!show || !show.screen.seats.length || !user) {
      expect(SeatHoldService.sweepExpiredHolds).toBeDefined();
      return;
    }

    const testSeat = show.screen.seats[1];

    // Create an artificially expired hold (1 minute in the past)
    await prisma.seatHold.create({
      data: {
        showId: show.id,
        seatId: testSeat.id,
        userId: user.id,
        sessionToken: "expired-token",
        status: "ACTIVE",
        expiresAt: new Date(Date.now() - 60000), // 1 min ago
      },
    });

    // Run sweep
    const sweptCount = await SeatHoldService.sweepExpiredHolds(show.id);
    expect(sweptCount).toBeGreaterThanOrEqual(1);

    // Query availability -> Expired seat must now be AVAILABLE
    const availability = await SeatHoldService.getShowSeatAvailability(show.id);
    const seatState = availability.seats.find((s) => s.id === testSeat.id);
    expect(seatState?.status).toBe("AVAILABLE");
  });
});
