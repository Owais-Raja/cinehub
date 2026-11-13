import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking.service";
import { CreateBookingSchema } from "@/schemas/booking.schema";
import { requireAuth, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const validatedData = CreateBookingSchema.parse(body);

    const booking = await BookingService.createPendingBooking({
      showId: validatedData.showId,
      holdId: validatedData.holdId,
      seatIds: validatedData.seatIds,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: booking,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const user = await requireAuth();
    const bookings = await BookingService.getUserBookings(user.id);

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
