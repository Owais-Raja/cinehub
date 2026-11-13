import prisma from "@/lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/rbac";
import { TicketService } from "./ticket.service";
import { AuditService } from "./audit.service";
import {
  BookingStatus,
  HoldStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";

export class PaymentService {
  /**
   * Processes a simulated payment with idempotency key protection.
   * Atomically confirms the booking, creates BookingSeat records, converts holds,
   * and issues a digital QR ticket.
   * Directly satisfies Acceptance Tests AT-1 and AT-2.
   */
  static async processPayment({
    bookingId,
    amount,
    method,
    idempotencyKey,
    simulateOutcome = "SUCCESS",
    userId,
  }: {
    bookingId: string;
    amount: number;
    method: "UPI" | "CARD" | "NETBANKING";
    idempotencyKey: string;
    simulateOutcome?: "SUCCESS" | "FAILED" | "PENDING";
    userId: string;
  }) {
    // 1. Idempotency Check: prevent duplicate payment processing
    const existingPayment = await prisma.payment.findUnique({
      where: { idempotencyKey },
      include: {
        booking: {
          include: { ticket: true },
        },
      },
    });

    if (existingPayment) {
      return {
        paymentReference: existingPayment.paymentReference,
        bookingReference: existingPayment.booking.bookingReference,
        ticketReference: existingPayment.booking.ticket?.ticketReference,
        status: existingPayment.status,
        amount: Number(existingPayment.amount),
        isDuplicateSubmission: true,
      };
    }

    // 2. Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        show: {
          include: {
            screen: {
              include: { seats: true },
            },
            prices: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking record not found");
    }

    if (booking.userId !== userId) {
      throw new ValidationError("Unauthorized booking owner.");
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      const existingTicket = await prisma.ticket.findUnique({
        where: { bookingId },
      });
      return {
        bookingReference: booking.bookingReference,
        ticketReference: existingTicket?.ticketReference,
        status: "SUCCESS",
        amount: Number(booking.totalAmount),
      };
    }

    // 3. Handle simulated failure
    if (simulateOutcome === "FAILED") {
      const paymentRef = `PAY-FAIL-${Date.now()}`;
      await prisma.payment.create({
        data: {
          paymentReference: paymentRef,
          bookingId,
          amount,
          method: method as PaymentMethod,
          status: PaymentStatus.FAILED,
          idempotencyKey,
        },
      });
      throw new ValidationError(
        "Payment authorization was declined by the simulated bank."
      );
    }

    // 4. Verify user still holds active seats for this show
    const now = new Date();
    const activeHolds = await prisma.seatHold.findMany({
      where: {
        showId: booking.showId,
        userId,
        status: HoldStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      include: { seat: true },
    });

    if (!activeHolds.length) {
      throw new ConflictError(
        "Your temporary seat hold has expired. Please reselect your seats."
      );
    }

    // 5. Build price map
    const basePrice = Number(booking.show.basePrice);
    const pricingMap: Record<string, number> = {
      SILVER: basePrice,
      GOLD: basePrice * 1.3,
      PLATINUM: basePrice * 1.6,
      RECLINER: basePrice * 2.2,
    };
    for (const p of booking.show.prices) {
      pricingMap[p.category] = Number(p.price);
    }

    const paymentRef = `PAY-SIM-${Date.now().toString().slice(-8)}`;

    // 6. Execute atomic booking confirmation
    return await prisma.$transaction(
      async (tx) => {
        // Step A: Create Payment record
        const payment = await tx.payment.create({
          data: {
            paymentReference: paymentRef,
            bookingId,
            amount,
            method: method as PaymentMethod,
            status: PaymentStatus.SUCCESS,
            idempotencyKey,
          },
        });

        // Step B: Mark booking as CONFIRMED
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CONFIRMED },
        });

        // Step C: Insert BookingSeat rows (with UNIQUE constraint on showId + seatId)
        for (const hold of activeHolds) {
          const seatPrice = pricingMap[hold.seat.category] || basePrice;
          await tx.bookingSeat.create({
            data: {
              bookingId,
              showId: booking.showId,
              seatId: hold.seatId,
              price: seatPrice,
              category: hold.seat.category,
            },
          });
        }

        // Step D: Convert holds to CONVERTED
        await tx.seatHold.updateMany({
          where: {
            showId: booking.showId,
            userId,
            status: HoldStatus.ACTIVE,
          },
          data: {
            status: HoldStatus.CONVERTED,
          },
        });

        // Step E: Issue Digital Ticket & QR Code
        const ticket = await TicketService.generateTicketInTransaction(
          tx,
          bookingId,
          booking.bookingReference
        );

        // Step F: Audit log
        await AuditService.log({
          userId,
          action: "BOOKING_CONFIRMED",
          entityType: "Booking",
          entityId: bookingId,
          metadata: {
            bookingReference: booking.bookingReference,
            ticketReference: ticket.ticketReference,
            amount,
            method,
          },
        });

        return {
          paymentReference: payment.paymentReference,
          bookingReference: booking.bookingReference,
          ticketReference: ticket.ticketReference,
          status: "SUCCESS",
          amount,
        };
      },
      {
        isolationLevel: "Serializable",
        maxWait: 5000,
        timeout: 10000,
      }
    );
  }
}
