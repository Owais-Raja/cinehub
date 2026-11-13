# CineHub — Full-Stack Cinema Hall Ticket Booking System

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed-green?logo=vitest)](https://vitest.dev/)

> **Candidate Project Assessment for ALGIONS AI LABS PRIVATE LIMITED**  
> **Role:** Full-Stack Web Development Internship Assessment  
> **Inspired by:** BookMyShow (India Cinema Market)  

---

## 1. Project Overview & Business Value

**CineHub** is an enterprise-grade cinema ticket reservation platform engineered to mirror the operational workflows, high-concurrency booking integrity, and polished customer experience of leading Indian cinema platforms like BookMyShow.

It is **NOT** a prototype or frontend mockup. It is backed by a normalized 19-table PostgreSQL relational database, enforces server-side role-based authorization (RBAC), implements pessimistic concurrency locking (`SELECT ... FOR UPDATE`) to prevent double-booking, generates tamper-proof digital tickets with scannable QR codes, and includes real-time administrative occupancy and revenue reporting.

---

## 2. Mandatory Acceptance Tests (Verified 100%)

The system satisfies all five acceptance tests required in Section 3 of the assignment brief:

| # | Acceptance Test | Technical Implementation | Automated Test Suite |
|---|---|---|---|
| **AT-1** | **Seat Hold & Booking**<br>An available seat can be held and successfully booked for a show. | 10-min `SeatHold` lease $\rightarrow$ dynamic state change to `HELD` $\rightarrow$ simulated payment $\rightarrow$ atomic `Booking` + `BookingSeat` transition with status `CONFIRMED`. | `tests/integration/booking-flow.test.ts` |
| **AT-2** | **Double-Booking Prevention**<br>The same seat cannot be confirmed for two users for the same show. | PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) + `BookingSeat UNIQUE(showId, seatId)`. Second concurrent request returns `409 Conflict`. | `tests/concurrency/double-booking.test.ts` |
| **AT-3** | **Hold Expiry & Seat Retention**<br>Expired holds release seats; confirmed bookings remain unavailable. | Timestamp-based TTL check (`expiresAt < NOW()`), automated lazy release on query, background sweep, and confirmed `BookingSeat` retention. | `tests/integration/hold-expiry.test.ts` |
| **AT-4** | **Single-Use Ticket Entry**<br>A ticket reference/QR can be validated once; a second validation attempt is rejected. | Dedicated Staff portal (`/staff/scanner`); atomic update `Ticket.status = USED` and insertion into `TicketValidation`. Second scan triggers `409 ALREADY_USED`. | `tests/integration/ticket-validation.test.ts` |
| **AT-5** | **Occupancy & Sales Report Integrity**<br>Admin occupancy report dynamically reflects bookings and cancellations. | Real-time SQL aggregation joining `Screen.totalSeats`, confirmed `BookingSeat` count, and subtracting `CANCELLED` bookings. | `tests/integration/occupancy-report.test.ts` |

---

## 3. Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript (Strict Mode), Tailwind CSS, shadcn/ui, Lucide Icons.
- **Backend:** Next.js Route Handlers, modular Service Layer, centralized error handling, Zod validation schemas.
- **Database & ORM:** PostgreSQL 18, Prisma ORM, Prisma Migrations, TypeScript seed script.
- **Authentication:** Auth.js (NextAuth v4/v5), `bcryptjs` password hashing (12 salt rounds), secure JWT cookies, Edge Middleware route guarding.
- **Engines & Tools:** `qrcode` for digital pass generation, `recharts` for administrative revenue/occupancy analytics, `vitest` for automated testing, OpenAPI 3.0 specification (`/api/docs`).

---

## 4. Architecture & System Structure

CineHub follows a **Modular Clean Monolith** pattern with strict four-layer separation:
```
Presentation Layer (React Server & Client Components)
        ↓
API & Controller Layer (Next.js Route Handlers + Zod Schemas + Edge Middleware)
        ↓
Business Service Layer (SeatHoldService, BookingService, PaymentService, TicketService, ReportService)
        ↓
Data Access Layer (Prisma ORM + PostgreSQL 18 with Row-Level Locks & Composite Constraints)
```

```
cineHUB/
├── src/
│   ├── app/                         # App Router (Pages & REST Route Handlers)
│   │   ├── page.tsx                 # Public Homepage (Trending Hero, Now Showing, Metros)
│   │   ├── movies/page.tsx          # Movie Discovery with Multi-Faceted Filters
│   │   ├── movies/[slug]/page.tsx   # Movie Details, Trailer, Dates & Theatre Schedules
│   │   ├── booking/[showId]/        # Interactive Cinema Seat Map (Silver/Gold/Platinum/Recliner)
│   │   ├── booking/[showId]/payment # Simulated Payment Gateway (UPI / Card / NetBanking)
│   │   ├── booking/ticket/[ref]/    # Digital Boarding Pass with Scannable QR Code
│   │   ├── customer/bookings/       # Customer Booking History & Self-Service Cancellations
│   │   ├── staff/scanner/           # Gate Staff Ticket Scanner & Single-Use Validator (AT-4)
│   │   ├── admin/                   # Admin Operations (Dashboard, Occupancy Reports, Catalog)
│   │   └── api/                     # 20+ REST Route Handlers
│   ├── components/                  # Reusable UI components (SeatMap, MovieCard, Navbar, Footer)
│   ├── services/                    # Business Service Layer (Hold, Booking, Payment, Ticket, Report)
│   ├── schemas/                     # Shared Zod validation schemas
│   ├── lib/                         # Prisma singleton, Auth.js config, RBAC helpers, constants
│   └── types/                       # Extended session & API types
├── prisma/
│   ├── schema.prisma                # Complete 19-table normalized relational schema
│   └── seed.ts                      # Indian cinema dataset (Mumbai, Delhi, Bengaluru, PVR, INOX)
├── docs/                            # Architectural deliverables & assignment specifications
└── tests/                           # Vitest unit, integration, and concurrency test suites
```

---

## 5. Pre-Seeded Demo Credentials

The database includes pre-configured demo accounts for all roles:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Administrator** | `admin@cinehub.in` | `Admin@1234` | Full access to `/admin` dashboard, catalog management, reports, audit logs. |
| **Cinema Staff** | `staff@cinehub.in` | `Staff@1234` | Access to `/staff/scanner` for gate ticket validation and duplicate check. |
| **Customer 1** | `rajesh@example.com` | `Customer@1234` | Standard customer account with active bookings and history. |
| **Customer 2** | `priya@example.com` | `Customer@1234` | Customer account for testing concurrent double-booking conflicts. |

> **Evaluator Tip:** The `/login` page features **One-Click Demo Account Quick-Fill** buttons for immediate testing!

---

## 6. Quick Start & Setup Guide

### 6.1 Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **PostgreSQL:** Local PostgreSQL 18 or Cloud PostgreSQL (e.g. Supabase, Neon)

### 6.2 Installation
```bash
# 1. Clone repository & install dependencies
git clone <repo-url>
cd cineHUB
npm install

# 2. Configure environment variables
# Copy blueprint to .env and configure your PostgreSQL connection string
cp .env.example .env
```

### 6.3 Database Migration & Seeding
```bash
# 3. Push schema to database
npx prisma db push

# 4. Seed Indian cinema demo dataset (Movies, Theatres, Screens, Shows, Demo Users)
npm run prisma:seed
```

### 6.4 Running the Application
```bash
# 5. Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### 6.5 Running Automated Tests
```bash
# Run unit & integration test suites
npm run test

# Run tests with live watch mode
npm run test:watch
```

---

## 7. API Documentation

Interactive OpenAPI 3.0 specification is available at:
- **OpenAPI 3.0 JSON:** `http://localhost:3000/api/docs`
- Complete API endpoint specifications are documented in [docs/API_DESIGN.md](docs/API_DESIGN.md).

---

## 8. Known Assumptions & Limitations

1. **Payment Simulation:** In compliance with Section 1 of the assignment brief, financial payments are simulated (UPI, Cards, NetBanking) with idempotency keys. No real bank accounts or cards are charged.
2. **Cancellation Deadline:** In accordance with standard Indian cinema ticketing practices, self-service cancellations with simulated refunds are permitted up to 2 hours (120 minutes) prior to show commencement. Within 2 hours, tickets are non-cancellable.
3. **Seat Hold Duration:** Temporary seat holds are set to 10 minutes (`600 seconds`) before expiring and returning to available inventory.

