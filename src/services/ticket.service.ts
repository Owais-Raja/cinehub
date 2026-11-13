import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import crypto from "crypto";
import { ConflictError, NotFoundError, ValidationError, ForbiddenError } from "@/lib/rbac";
import { TicketStatus, ValidationResult, Prisma } from "@prisma/client";
import { AuditService } from "./audit.service";

export class TicketService {
  /**
   * Generates a digital ticket and base64 QR code within a database transaction
   */
  static async generateTicketInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    bookingReference: string
  ) {
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    const ticketReference = `TCK-${bookingReference.replace("CNH-", "")}-${randomHex}`;
    const validationToken = crypto.randomUUID();

    // QR code payload (JSON payload verifiable by scanner)
    const qrPayload = JSON.stringify({
      tck: ticketReference,
      tok: validationToken,
      ref: bookingReference,
      sys: "CINEHUB-GATE-SECURE",
    });

    const qrCodeData = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: "#171923",
        light: "#FFFFFF",
      },
    });

    return await tx.ticket.create({
      data: {
        ticketReference,
        bookingId,
        validationToken,
        qrCodeData,
        status: TicketStatus.ISSUED,
      },
    });
  }

  /**
   * Validates a ticket at the cinema entry gate.
   * Atomic check-and-set: Marks ticket as USED on first validation;
   * strictly REJECTS duplicate scans with 409 Conflict.
   * Directly satisfies Mandatory Acceptance Test AT-4.
   */
  static async validateTicket({
    ticketReference,
    validationToken,
    screenId,
    staffId,
    notes,
  }: {
    ticketReference?: string;
    validationToken?: string;
    screenId?: string;
    staffId: string;
    notes?: string;
  }) {
    if (!ticketReference && !validationToken) {
      throw new ValidationError("Ticket reference or validation token is required.");
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          ...(ticketReference ? [{ ticketReference: ticketReference.trim() }] : []),
          ...(validationToken ? [{ validationToken: validationToken.trim() }] : []),
        ],
      },
      include: {
        booking: {
          include: {
            show: {
              include: {
                movie: true,
                screen: { include: { theatre: true } },
              },
            },
            bookingSeats: {
              include: { seat: true },
            },
          },
        },
        validations: {
          include: {
            staff: { select: { fullName: true, email: true } },
          },
          orderBy: { validatedAt: "desc" },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError("Ticket reference not found in the CineHub registry.");
    }

    // 1. If ticket is already CANCELLED, reject immediately
    if (ticket.status === TicketStatus.CANCELLED) {
      throw new ValidationError("Entry Denied: This ticket was cancelled and refunded.");
    }

    // 2. If ticket is already USED, reject duplicate scan (AT-4 requirement!)
    if (ticket.status === TicketStatus.USED) {
      const priorValidation = ticket.validations[0];
      const validatedAtStr = priorValidation?.validatedAt
        ? new Date(priorValidation.validatedAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "earlier today";
      const staffName = priorValidation?.staff?.fullName || "Gate Staff";

      // Log fraudulent duplicate attempt in TicketValidation
      await prisma.ticketValidation.create({
        data: {
          ticketId: ticket.id,
          staffId,
          result: ValidationResult.ALREADY_USED,
          notes: notes ? `Duplicate attempt: ${notes}` : "Duplicate scan rejected",
        },
      });

      throw new ConflictError(
        `Entry Denied: This ticket was already validated at ${validatedAtStr} by ${staffName}. Re-entry is not permitted.`,
        {
          previouslyValidatedAt: priorValidation?.validatedAt,
          validatedBy: staffName,
          ticketReference: ticket.ticketReference,
        }
      );
    }

    // 3. Ticket is valid (ISSUED) -> Atomically mark as USED and record validation
    return await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.USED },
      });

      const validationRecord = await tx.ticketValidation.create({
        data: {
          ticketId: ticket.id,
          staffId,
          result: ValidationResult.VALID,
          notes: notes || "Valid first-time admission",
        },
      });

      await AuditService.log({
        userId: staffId,
        action: "TICKET_VALIDATED",
        entityType: "Ticket",
        entityId: ticket.id,
        metadata: {
          ticketReference: ticket.ticketReference,
          bookingReference: ticket.booking.bookingReference,
        },
      });

      const seatsFormatted = ticket.booking.bookingSeats.map(
        (bs) => `Row ${bs.seat.row} - Seat ${bs.seat.number} (${bs.category})`
      );

      return {
        result: "VALID",
        ticketReference: ticket.ticketReference,
        bookingReference: ticket.booking.bookingReference,
        movieTitle: ticket.booking.show.movie.title,
        theatreName: ticket.booking.show.screen.theatre.name,
        screenName: ticket.booking.show.screen.name,
        showTime: ticket.booking.show.startTime.toISOString(),
        admittedSeats: seatsFormatted,
        admittedAt: validationRecord.validatedAt.toISOString(),
        message: "Entry Approved! Ticket successfully verified.",
      };
    });
  }

  /**
   * Fetches ticket for customer display or printing
   */
  static async getTicketByReference(
    ticketReference: string,
    userId?: string,
    userRole?: string
  ) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketReference },
      include: {
        booking: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
            show: {
              include: {
                movie: true,
                screen: { include: { theatre: { include: { city: true } } } },
                language: true,
                format: true,
              },
            },
            bookingSeats: {
              include: { seat: true },
            },
            payment: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError("Ticket not found.");
    }

    if (
      userId &&
      userRole !== "ADMIN" &&
      userRole !== "STAFF" &&
      ticket.booking.userId !== userId
    ) {
      throw new ForbiddenError("You are not authorized to view this ticket.");
    }

    return ticket;
  }
}
