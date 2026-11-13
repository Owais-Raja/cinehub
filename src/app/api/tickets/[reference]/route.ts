import { NextRequest, NextResponse } from "next/server";
import { TicketService } from "@/services/ticket.service";
import { getCurrentUser, handleApiError } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { reference } = await params;

    const ticket = await TicketService.getTicketByReference(
      reference,
      user?.id,
      user?.role
    );

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

