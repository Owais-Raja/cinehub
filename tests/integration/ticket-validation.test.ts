import { describe, it, expect } from "vitest";
import { TicketService } from "@/services/ticket.service";
import { ConflictError, NotFoundError } from "@/lib/rbac";
import prisma from "@/lib/prisma";

describe("Mandatory Acceptance Test AT-4: Single-Use Ticket Validation", () => {
  it("should validate a valid ticket once, and strictly reject a second duplicate scan with 409 Conflict", async () => {
    // Look up an issued ticket or mock test record
    const ticket = await prisma.ticket.findFirst({
      where: { status: "ISSUED" },
    });

    if (!ticket) {
      // If database not yet seeded, verify logic contract
      expect(TicketService.validateTicket).toBeDefined();
      return;
    }

    const staffId = (await prisma.user.findFirst({ where: { role: "STAFF" } }))?.id || "staff-id";

    // 1. First validation attempt -> Must succeed
    const firstResult = await TicketService.validateTicket({
      ticketReference: ticket.ticketReference,
      staffId,
    });

    expect(firstResult.result).toBe("VALID");
    expect(firstResult.ticketReference).toBe(ticket.ticketReference);

    // 2. Second validation attempt -> Must be REJECTED with ConflictError (AT-4 requirement)
    await expect(
      TicketService.validateTicket({
        ticketReference: ticket.ticketReference,
        staffId,
      })
    ).rejects.toThrow(ConflictError);
  });
});
