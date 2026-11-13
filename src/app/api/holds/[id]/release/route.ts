import { NextRequest, NextResponse } from "next/server";
import { SeatHoldService } from "@/services/seat-hold.service";
import { requireAuth, handleApiError } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: holdId } = await params;

    const result = await SeatHoldService.releaseHold({
      holdId,
      userId: user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

