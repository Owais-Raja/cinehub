# CineHub — 3–5 Minute Demonstration Video Script & Walkthrough Checklist

**Assessment:** ALGIONS AI LABS PRIVATE LIMITED Advanced Project Assessment  
**System:** CineHub Full-Stack Cinema Hall Ticket Booking Platform  
**Target Video Duration:** 3 Minutes 30 Seconds to 4 Minutes 30 Seconds  

---

## 1. Video Recording Preparation Checklist

Before recording your screen and microphone:
- [ ] Ensure local server is running (`npm run dev`) at `http://localhost:3000`.
- [ ] Database is seeded (`npm run prisma:seed`).
- [ ] Clear browser cookies/cache or open an Incognito window.
- [ ] Have the following URLs bookmarked:
  - Homepage: `http://localhost:3000`
  - Login Page: `http://localhost:3000/login`
  - Staff Scanner: `http://localhost:3000/staff/scanner`
  - Admin Reports: `http://localhost:3000/admin/reports`
  - OpenAPI Specification: `http://localhost:3000/api/docs`

---

## 2. Timed Demonstration Script

### Part 1: Introduction & Architecture (0:00 – 0:45)
- **Spoken Audio:**
  > *"Hello, my name is [Your Name], and this is my individual internship assessment submission for ALGIONS AI LABS PRIVATE LIMITED: **CineHub**, an India-focused, production-grade cinema ticket booking platform inspired by BookMyShow.*  
  > *CineHub is built as a Modular Clean Monolith on Next.js 15 App Router, TypeScript in strict mode, PostgreSQL 18, and Prisma ORM. It implements real relational database persistence, server-side RBAC, pessimistic row-level locking for concurrency, and cryptographically verified digital passes.*  
  > *Let me walk you through the end-to-end customer and staff journeys."*
- **Visual Action:**
  - Show the CineHub homepage with the trending *Kalki 2898 AD* hero banner, city selector (Mumbai, Delhi-NCR, Bengaluru), and the feature trust cards.

---

### Part 2: Customer Discovery & Seat Reservation Engine (0:45 – 1:45)
- **Spoken Audio:**
  > *"On the homepage, users can select Indian metros, filter by genres, and select movies. Let's select 'Kalki 2898 AD'.*  
  > *Here is the rich movie detail page with censor certification, runtime, synopsis, and showtimes grouped by multiplexes like PVR INOX Palladium.*  
  > *Let's pick the 2:30 PM IMAX 2D screening.*  
  > *This opens our interactive cinema seat map. Notice the curved screen indicator and the distinct tiers: Silver, Gold, Platinum, and Recliner armchairs in Warm Gold.*  
  > *Let's select two Recliner seats: Row M, Seats 5 and 6. The bottom bar immediately computes the subtotal.*  
  > *When I click 'Lock Seats & Proceed', the system executes a PostgreSQL pessimistic lock transaction, starting a 10-minute countdown lease that prevents any competing user from booking these exact seats."*
- **Visual Action:**
  - Click on *Kalki 2898 AD*.
  - Pick a showtime.
  - On the seat map, select Row M Seats 5 & 6.
  - Click "Lock Seats & Proceed". Show the summary modal with 18% GST and convenience fee calculation.

---

### Part 3: Simulated Payment & Digital QR Pass Issuance (1:45 – 2:30)
- **Spoken Audio:**
  > *"The booking summary dynamically breaks down ticket pricing, convenience fees, and 18% GST (9% CGST + 9% SGST). Let's proceed to payment.*  
  > *The payment gateway supports simulated UPI, Cards, and NetBanking with idempotency key protection.*  
  > *Let's simulate a successful UPI transaction.*  
  > *Upon confirmation, an atomic database transaction converts the hold into a confirmed booking, creates the BookingSeat records, and issues a tamper-proof digital boarding pass with a scannable QR code and unique reference."*
- **Visual Action:**
  - Click "Proceed to Payment".
  - Show UPI handle and click "Pay".
  - Instantly load the Digital Ticket pass screen showing the generated QR code, ticket reference (e.g. `TCK-XXXX`), and reserved seats.

---

### Part 4: Mandatory Acceptance Test AT-4 — Staff Turnstile Validation (2:30 – 3:15)
- **Spoken Audio:**
  > *"Now let's demonstrate Acceptance Test AT-4: Gate Staff single-use ticket validation.*  
  > *Let's copy our ticket reference and navigate to the Staff Scanner portal at `/staff/scanner`.*  
  > *We paste the reference and submit.*  
  > *On the first scan, the system checks the ticket status, marks it as USED in an atomic transaction, and approves entry with green confirmation displaying movie, screen, and seat numbers.*  
  > *Now watch what happens when someone attempts to scan the exact same ticket a second time.*  
  > *The system immediately rejects the duplicate scan with a 409 Conflict alert, notifying gate staff of the exact timestamp and operator who admitted the ticket earlier. Replay fraud is completely prevented."*
- **Visual Action:**
  - Copy ticket reference from ticket page.
  - Go to `/staff/scanner`.
  - Paste reference and click "Validate & Admit". Show Green "ENTRY APPROVED" card.
  - Click "Validate & Admit" again with the same reference. Show Red "ENTRY REJECTED: TICKET_ALREADY_USED" card!

---

### Part 5: Mandatory Acceptance Test AT-5 — Admin Occupancy & Sales Report (3:15 – 3:45)
- **Spoken Audio:**
  > *"Finally, let's look at Acceptance Test AT-5: Admin Occupancy Reporting.*  
  > *In the Admin dashboard, all metrics are aggregated in real time from SQL records.*  
  > *The occupancy report shows screen capacities, booked seats, and overall occupancy rate. When bookings are confirmed, occupancy increases; when a customer cancels an eligible booking before the 2-hour window, the seats are freed and occupancy decreases dynamically.*  
  > *Furthermore, our automated Vitest test suite verifies all five acceptance criteria, and our OpenAPI 3.0 specification is available at `/api/docs`.*  
  > *Thank you."*
- **Visual Action:**
  - Navigate to `/admin/reports`.
  - Show the real-time Occupancy overview table with booked seats, screen capacities, and percentages.
  - Show terminal with `npm run test` showing all passing tests.
  - Conclude.

