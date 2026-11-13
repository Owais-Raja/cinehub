import { describe, it, expect } from "vitest";
import { RegisterSchema } from "@/schemas/auth.schema";
import { HoldSeatsSchema, ProcessPaymentSchema } from "@/schemas/booking.schema";

describe("Validation Schemas & Negative Edge Cases", () => {
  it("should reject registration with invalid email", () => {
    const result = RegisterSchema.safeParse({
      fullName: "Rajesh Kumar",
      email: "invalid-email-format",
      password: "Password@123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject weak password missing uppercase or numbers", () => {
    const result = RegisterSchema.safeParse({
      fullName: "Rajesh Kumar",
      email: "rajesh@example.com",
      password: "weakpassword",
    });
    expect(result.success).toBe(false);
  });

  it("should reject hold requests with 0 seats", () => {
    const result = HoldSeatsSchema.safeParse({
      seatIds: [],
      sessionToken: "sess-123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject hold requests with more than 10 seats (booking abuse protection)", () => {
    const seatIds = Array.from({ length: 11 }).map(
      (_, i) => `00000000-0000-0000-0000-00000000000${i}`
    );
    const result = HoldSeatsSchema.safeParse({
      seatIds,
      sessionToken: "sess-123",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid hold request with 1 to 10 valid UUIDs", () => {
    const result = HoldSeatsSchema.safeParse({
      seatIds: [
        "123e4567-e89b-12d3-a456-426614174000",
        "123e4567-e89b-12d3-a456-426614174001",
      ],
      sessionToken: "sess-123",
    });
    expect(result.success).toBe(true);
  });

  it("should require an idempotency key for payment processing", () => {
    const result = ProcessPaymentSchema.safeParse({
      bookingId: "123e4567-e89b-12d3-a456-426614174000",
      amount: 500,
      method: "UPI",
      // idempotencyKey omitted
    });
    expect(result.success).toBe(false);
  });
});

