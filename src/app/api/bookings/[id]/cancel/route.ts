import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking.service";
import { requireAuth, handleApiError } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: bookingId } = await params;

    const result = await BookingService.cancelBooking({
      bookingId,
      userId: user.id,
      userRole: user.role,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Booking successfully cancelled and refund initiated.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
