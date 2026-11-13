import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking.service";
import { requireAuth, handleApiError } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const booking = await BookingService.getBookingById(id, user.id);

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
