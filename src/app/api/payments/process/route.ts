import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";
import { ProcessPaymentSchema } from "@/schemas/booking.schema";
import { requireAuth, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const validatedData = ProcessPaymentSchema.parse(body);

    const result = await PaymentService.processPayment({
      bookingId: validatedData.bookingId,
      amount: validatedData.amount,
      method: validatedData.method,
      idempotencyKey: validatedData.idempotencyKey,
      simulateOutcome: validatedData.simulateOutcome,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Payment processed and booking confirmed.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
