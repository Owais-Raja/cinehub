import { describe, it, expect } from "vitest";
import { GST_RATE, CONVENIENCE_FEE, CANCELLATION_DEADLINE_HOURS } from "@/lib/constants";

describe("CineHub Pricing & Tax Engine (India Specific)", () => {
  it("should apply exactly 18% GST on ticket subtotal and convenience fees", () => {
    const seatCount = 2;
    const ticketPrices = [350, 450]; // 1 Gold + 1 Platinum
    const subtotal = ticketPrices.reduce((a, b) => a + b, 0); // 800
    const convenienceFee = CONVENIENCE_FEE * seatCount; // 30 * 2 = 60
    const taxableAmount = subtotal + convenienceFee; // 860
    const taxAmount = Math.round(taxableAmount * GST_RATE * 100) / 100; // 860 * 0.18 = 154.80
    const totalPayable = Math.round((taxableAmount + taxAmount) * 100) / 100; // 1014.80

    expect(GST_RATE).toBe(0.18);
    expect(subtotal).toBe(800);
    expect(convenienceFee).toBe(60);
    expect(taxAmount).toBe(154.8);
    expect(totalPayable).toBe(1014.8);
  });

  it("should calculate correct cancellation eligibility window", () => {
    const now = new Date();

    // Show in 3 hours -> Eligible for cancellation
    const showIn3Hours = new Date(now.getTime() + 3 * 3600 * 1000);
    const hoursLeft3 = (showIn3Hours.getTime() - now.getTime()) / (1000 * 3600);
    expect(hoursLeft3 >= CANCELLATION_DEADLINE_HOURS).toBe(true);

    // Show in 1 hour -> Ineligible (within 2-hour window)
    const showIn1Hour = new Date(now.getTime() + 1 * 3600 * 1000);
    const hoursLeft1 = (showIn1Hour.getTime() - now.getTime()) / (1000 * 3600);
    expect(hoursLeft1 >= CANCELLATION_DEADLINE_HOURS).toBe(false);
  });
});

