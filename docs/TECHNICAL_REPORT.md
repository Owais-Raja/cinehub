# CineHub — Technical Architecture & Engineering Report

**Candidate Name:** Full-Stack Web Development Candidate  
**Assigned Project:** Cinema Hall Ticket Booking System (CineHub)  
**Evaluator Organization:** ALGIONS AI LABS PRIVATE LIMITED  
**Submission Component:** Technical Walkthrough & Live Debugging Preparation Report  
**Date:** November 2026  

---

## 1. Executive Summary & Problem Formulation

CineHub was built to solve the complex engineering challenges inherent in high-demand cinema ticket reservation platforms:
1. **Concurrency & Race Conditions:** Preventing two concurrent users from confirming the same physical seat for the same show (double-booking).
2. **Temporary Hold Leases:** Managing transient locks (10-minute hold window) that expire reliably without blocking inventory indefinitely.
3. **Financial & Tax Compliance:** Calculating 18% GST (9% CGST + 9% SGST) and convenience fees according to Indian cinema standards.
4. **Single-Use Physical Turnstile Verification:** Guaranteeing that admission passes with cryptographically signed tokens can be validated only once, rejecting counterfeit or replay entries.
5. **Auditing & Dynamic Reporting:** Providing real-time operational insights (occupancy percentages and gross/net revenue) that accurately reflect dynamic cancellations and refunds.

---

## 2. Architectural Design & Pattern Justification

### 2.1 Why a Modular Clean Monolith?
Rather than fragmenting into distributed microservices—which introduce network latency, eventual consistency issues, distributed lock failures, and operational fragility—CineHub adopts a **Modular Clean Monolith** on Next.js 15:
- **Presentation Layer:** React Server Components for near-instant movie discovery, Client Components for interactive SVG seat selection maps and timers.
- **Controller Layer:** Next.js Route Handlers (`/api/*`) executing Zod request schema validation and centralized error handling.
- **Service Layer:** Pure, decoupled TypeScript domain services (`SeatHoldService`, `BookingService`, `PaymentService`, `TicketService`, `ReportService`).
- **Data Access Layer:** PostgreSQL 18 managed through Prisma ORM, utilizing row-level locks and composite database constraints.

---

## 3. Concurrency Architecture & Double-Booking Elimination

### 3.1 The Race Condition Threat Model
In blockbuster ticket sales, hundreds of users may click "Book Seat" for the same high-demand seat (e.g. Recliner Row M, Seat 5) at the exact same millisecond. In a naive read-then-write architecture:
```
Thread A: Reads Seat M5 -> Status is AVAILABLE
Thread B: Reads Seat M5 -> Status is AVAILABLE
Thread A: Writes Booking for Seat M5 -> Status is BOOKED
Thread B: Writes Booking for Seat M5 -> Status is BOOKED (DOUBLE BOOKING BUG!)
```

### 3.2 CineHub Multi-Tier Defense
CineHub eliminates this vulnerability using a three-tier defensive barrier:

1. **Row-Level Pessimistic Locking (`SELECT ... FOR UPDATE`):**
   When a hold request arrives at `SeatHoldService.holdSeats()`, a database transaction locks the target physical seat row. Competing transactions attempting to reserve the same seat are queued until the lock releases.
2. **Active TTL Lease Check:**
   The transaction checks if any active hold exists with `expiresAt > NOW()`. If found for another user, the transaction rolls back immediately and returns a `409 Conflict` response with conflicting seat details.
3. **Database Engine Unique Constraint (`BookingSeat UNIQUE(showId, seatId)`):**
   Even under catastrophic network latency or connection drops, the PostgreSQL relational engine enforces that two rows with the same `(showId, seatId)` cannot physically exist in `BookingSeat`. Any conflicting insert throws an engine-level unique violation error.

---

## 4. Single-Use Admission Token Architecture (AT-4)

The ticket validation engine ensures that digital passes cannot be re-used, shared, or forged:
1. **High-Entropy Validation Token:** Each ticket is assigned a cryptographically random UUID token (`validationToken`) and a human-readable reference (e.g. `TCK-2026-8912-X1`).
2. **Server-Generated Base64 QR Code:** The QR code encodes a verification payload verified exclusively by the server.
3. **Atomic Gate Validation:**
   ```typescript
   // In TicketService.validateTicket:
   if (ticket.status === TicketStatus.USED) {
     throw new ConflictError("Ticket was already validated. Re-entry rejected!");
   }
   await tx.ticket.update({
     where: { id: ticket.id },
     data: { status: TicketStatus.USED }
   });
   await tx.ticketValidation.create({ ... });
   ```
4. **Replay Rejection:** The second scan is rejected with `409 Conflict`, displaying the exact prior timestamp and the name of the staff member who conducted the initial admission.

---

## 5. Technical Interview & Live Debugging Preparation Guide

### 5.1 Common 15-Minute Interview Questions & How to Answer

**Q1: How do you handle expired holds without running an infinite cron job?**  
*Answer:* "CineHub employs an opportunistic **lazy sweep** model. Every time `/api/shows/[id]/availability` is queried, the query executes `SeatHold.updateMany({ where: { status: 'ACTIVE', expiresAt: { lte: now } }, data: { status: 'EXPIRED' } })`. This ensures that whenever a user loads the seat map, stale holds are cleared in real time without background queue overhead."

**Q2: How is Indian GST calculated?**  
*Answer:* "In accordance with Indian cinema tax regulations, GST is 18% (split into 9% CGST and 9% SGST). In `BookingService`, taxes are computed on the ticket subtotal plus the platform convenience fee (₹30/seat): `taxAmount = Math.round((subtotal + convenienceFee) * 0.18 * 100) / 100`."

**Q3: How are cancellations and refunds handled?**  
*Answer:* "Self-service cancellations are allowed up to 2 hours before showtime. `BookingService.cancelBooking` checks `(show.startTime - now) >= 2 hours`. Upon cancellation, `BookingSeat` records are deleted to instantly restore seat availability, `Ticket.status` is set to `CANCELLED`, and a `Refund` record is generated with ticket subtotal and GST refunded while retaining the convenience fee."

---

## 6. Verification of Acceptance Tests

All five mandatory acceptance tests are verified:
- **AT-1 (Seat Hold & Booking):** Verified in `tests/integration/booking-flow.test.ts`.
- **AT-2 (Double-Booking Race Condition):** Verified in `tests/concurrency/double-booking.test.ts`.
- **AT-3 (Hold Expiry vs Confirmed Retention):** Verified in `tests/integration/hold-expiry.test.ts`.
- **AT-4 (Single-Use Gate Validation):** Verified in `tests/integration/ticket-validation.test.ts`.
- **AT-5 (Admin Occupancy & Sales Report):** Verified in `tests/integration/occupancy-report.test.ts`.
