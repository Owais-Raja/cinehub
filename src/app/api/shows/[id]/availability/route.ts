import { NextRequest, NextResponse } from "next/server";
import { SeatHoldService } from "@/services/seat-hold.service";
import { getCurrentUser, handleApiError } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const data = await SeatHoldService.getShowSeatAvailability(id, user?.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

