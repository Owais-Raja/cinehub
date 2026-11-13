import { z } from "zod";

export const HoldSeatsSchema = z.object({
  seatIds: z
    .array(z.string().uuid("Invalid seat identifier"))
    .min(1, "Please select at least 1 seat")
    .max(10, "You can select a maximum of 10 seats per booking"),
  sessionToken: z.string().min(1, "Session token is required for hold concurrency tracking"),
});

export const CreateBookingSchema = z.object({
  showId: z.string().uuid("Invalid show ID"),
  holdId: z.string().uuid("Invalid hold ID"),
  seatIds: z
    .array(z.string().uuid())
    .min(1, "At least 1 seat is required")
    .max(10, "Maximum 10 seats allowed"),
});

export const ProcessPaymentSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
  amount: z.number().positive("Payment amount must be greater than zero"),
  method: z.enum(["UPI", "CARD", "NETBANKING"]),
  simulateOutcome: z.enum(["SUCCESS", "FAILED", "PENDING"]).default("SUCCESS"),
  idempotencyKey: z.string().min(10, "Idempotency key required"),
  upiId: z.string().optional(),
  cardNumber: z.string().optional(),
  bankName: z.string().optional(),
});

export const ValidateTicketSchema = z.object({
  ticketReference: z.string().min(5, "Ticket reference is required"),
  validationToken: z.string().min(5).optional(),
  screenId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type HoldSeatsInput = z.infer<typeof HoldSeatsSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;
export type ValidateTicketInput = z.infer<typeof ValidateTicketSchema>;

