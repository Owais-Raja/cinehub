import { NextRequest, NextResponse } from "next/server";
import { TicketService } from "@/services/ticket.service";
import { ValidateTicketSchema } from "@/schemas/booking.schema";
import { requireRole, handleApiError } from "@/lib/rbac";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const staff = await requireRole([Role.STAFF, Role.ADMIN]);
    const body = await req.json();

    const validatedData = ValidateTicketSchema.parse(body);

    const result = await TicketService.validateTicket({
      ticketReference: validatedData.ticketReference,
      validationToken: validatedData.validationToken,
      screenId: validatedData.screenId,
      staffId: staff.id,
      notes: validatedData.notes,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
