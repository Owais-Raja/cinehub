import { describe, it, expect } from "vitest";
import { SeatHoldService } from "@/services/seat-hold.service";
import { BookingService } from "@/services/booking.service";
import { PaymentService } from "@/services/payment.service";
import prisma from "@/lib/prisma";

describe("Mandatory Acceptance Test AT-1: End-to-End Seat Hold & Booking Flow", () => {
  it("should successfully hold an available seat, compute taxes, process simulated payment, and issue a digital ticket", async () => {
    // 1. Fetch scheduled show and available customer
    const show = await prisma.show.findFirst({
      where: { status: "SCHEDULED" },
      include: { screen: { include: { seats: true } } },
    });

    const customer = await prisma.user.findFirst({
      where: { email: "rajesh@example.com" },
    });

    expect(show).toBeDefined();
    expect(customer).toBeDefined();

    // Select an unheld seat (e.g. seat index 6)
    const targetSeat = show!.screen.seats[6];

    // Clean prior holds / bookings for this test seat
    await prisma.bookingSeat.deleteMany({ where: { showId: show!.id, seatId: targetSeat.id } });
    await prisma.seatHold.deleteMany({ where: { showId: show!.id, seatId: targetSeat.id } });

    const sessionToken = `test-sess-${Date.now()}`;

    // Step A: Hold seat (10-minute hold lock)
    const holdResult = await SeatHoldService.holdSeats({
      showId: show!.id,
      seatIds: [targetSeat.id],
      userId: customer!.id,
      sessionToken,
    });

    expect(holdResult.holdId).toBeDefined();
    expect(holdResult.seatIds).toContain(targetSeat.id);
    expect(holdResult.remainingSeconds).toBe(600);

    // Step B: Create Pending Booking with Indian GST breakdown
    const bookingResult = await BookingService.createPendingBooking({
      showId: show!.id,
      holdId: holdResult.holdId,
      seatIds: [targetSeat.id],
      userId: customer!.id,
    });

    expect(bookingResult.bookingId).toBeDefined();
    expect(bookingResult.bookingReference).toMatch(/^CNH-\d{4}-\d{5}$/);
    expect(bookingResult.taxAmount).toBeGreaterThan(0);
    expect(bookingResult.status).toBe("PENDING");

    // Step C: Process simulated payment with idempotency key
    const idempotencyKey = `test-idemp-${Date.now()}`;
    const paymentResult = await PaymentService.processPayment({
      bookingId: bookingResult.bookingId,
      amount: bookingResult.totalAmount,
      method: "UPI",
      idempotencyKey,
      simulateOutcome: "SUCCESS",
      userId: customer!.id,
    });

    expect(paymentResult.status).toBe("SUCCESS");
    expect(paymentResult.ticketReference).toBeDefined();
    expect(paymentResult.bookingReference).toBe(bookingResult.bookingReference);

    // Step D: Verify Database State
    const confirmedBooking = await prisma.booking.findUnique({
      where: { id: bookingResult.bookingId },
      include: { ticket: true, bookingSeats: true },
    });

    expect(confirmedBooking?.status).toBe("CONFIRMED");
    expect(confirmedBooking?.ticket?.status).toBe("ISSUED");
    expect(confirmedBooking?.bookingSeats.length).toBe(1);
    expect(confirmedBooking?.bookingSeats[0].seatId).toBe(targetSeat.id);
  });
});
