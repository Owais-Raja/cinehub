import { NextRequest, NextResponse } from "next/server";
import { SeatHoldService } from "@/services/seat-hold.service";
import { HoldSeatsSchema } from "@/schemas/booking.schema";
import { requireAuth, handleApiError } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: showId } = await params;
    const body = await req.json();

    const validatedData = HoldSeatsSchema.parse(body);

    const holdResult = await SeatHoldService.holdSeats({
      showId,
      seatIds: validatedData.seatIds,
      userId: user.id,
      sessionToken: validatedData.sessionToken,
    });

    return NextResponse.json(
      {
        success: true,
        data: holdResult,
        message: "Seats temporarily locked for 10 minutes.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
