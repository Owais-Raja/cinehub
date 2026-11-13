# CineHub — REST API Specifications & OpenAPI Design

**Document Version:** 1.0.0 (Stage A — Planning & Architecture)  
**API Protocol:** REST over HTTPS  
**Specification Standard:** OpenAPI 3.0 / Swagger Compatible  
**Payload Format:** `application/json`  
**Authentication Scheme:** Bearer JWT / Secure HttpOnly Session Cookies (Auth.js)  

---

## 1. REST API Conventions & Global Contract

### 1.1 Uniform Response Envelope

All API endpoints follow a standardized JSON envelope to guarantee predictable client-side consumption:

#### Standard Success Response (`200 OK`, `201 Created`):
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-13T14:30:00.000Z",
    "page": 1,
    "limit": 20,
    "totalCount": 100
  }
}
```

#### Standard Error Response (`400`, `401`, `403`, `404`, `409`, `422`, `500`):
```json
{
  "success": false,
  "error": {
    "code": "SEAT_ALREADY_HELD",
    "message": "One or more requested seats are currently held by another user.",
    "details": [
      {
        "field": "seatIds",
        "message": "Seat Row E Number 8 is held until 14:40:00"
      }
    ]
  }
}
```

### 1.2 HTTP Status Code Matrix

| Status Code | Meaning | Typical CineHub Usage |
|---|---|---|
| `200 OK` | Request succeeded | Retrieval of movies, show availability, reports |
| `201 Created` | Resource created | Registration, Seat hold placed, Booking confirmed |
| `400 Bad Request` | Malformed syntax / validation error | Zod parsing failure, invalid date parameter |
| `401 Unauthorized` | Missing or invalid authentication token | Unauthenticated user accessing private endpoints |
| `403 Forbidden` | Authenticated but insufficient permission | Customer attempting to access `/api/admin/*` |
| `404 Not Found` | Target resource does not exist | Movie ID, Show ID, or Ticket reference not found |
| `409 Conflict` | Concurrency or state collision | **Double-booking collision**, duplicate ticket scan |
| `422 Unprocessable`| Syntactically valid but breaks business rule | Cancelling a booking after the 2-hour window |
| `500 Internal Error`| Unhandled server-side exception | Database connection drop, internal runtime bug |

---

## 2. API Endpoint Catalog

```
+---------------------------------------------------------------------------------------------------------+
|                                        CINEHUB REST API MODULES                                         |
+--------------------------+------------------------------------+------------------+----------------------+
| Module                   | Route Path                         | Method           | Authorization        |
+--------------------------+------------------------------------+------------------+----------------------+
| 1. Authentication        | /api/auth/register                 | POST             | Public               |
|                          | /api/auth/me                       | GET              | Authenticated        |
| 2. Master Data           | /api/cities                        | GET              | Public               |
|                          | /api/genres                        | GET              | Public               |
|                          | /api/languages                     | GET              | Public               |
| 3. Movies & Discovery    | /api/movies                        | GET              | Public               |
|                          | /api/movies/[id]                   | GET              | Public               |
| 4. Theatres & Shows      | /api/theatres                      | GET              | Public               |
|                          | /api/shows                         | GET              | Public               |
|                          | /api/shows/[id]                    | GET              | Public               |
|                          | /api/shows/[id]/availability       | GET              | Public               |
| 5. Seat Concurrency      | /api/shows/[id]/hold-seats         | POST             | Authenticated (Cust) |
|                          | /api/holds/[id]/release            | POST             | Authenticated (Cust) |
| 6. Bookings & Orders     | /api/bookings                      | POST             | Authenticated (Cust) |
|                          | /api/bookings/[id]                 | GET              | Authenticated (Owner)|
|                          | /api/bookings/[id]/cancel          | POST             | Authenticated (Owner)|
| 7. Simulated Payments    | /api/payments/process              | POST             | Authenticated (Cust) |
|                          | /api/payments/[id]/status          | GET              | Authenticated (Cust) |
| 8. Tickets & Staff Scan  | /api/tickets/[reference]           | GET              | Authenticated (Owner)|
|                          | /api/staff/validate-ticket         | POST             | STAFF / ADMIN        |
| 9. Admin Operations      | /api/admin/movies                  | POST / PUT / DEL | ADMIN                |
|                          | /api/admin/theatres                | POST / PUT       | ADMIN                |
|                          | /api/admin/shows                   | POST / PUT / DEL | ADMIN                |
|                          | /api/admin/reports/occupancy       | GET              | ADMIN                |
|                          | /api/admin/reports/sales           | GET              | ADMIN                |
|                          | /api/admin/audit-logs              | GET              | ADMIN                |
| 10. API Specification    | /api/docs                          | GET              | Public               |
+--------------------------+------------------------------------+------------------+----------------------+
```

---

## 3. Detailed Endpoint Specifications

### 3.1 Authentication & Profile

#### `POST /api/auth/register`
- **Description:** Registers a new Customer account with bcrypt-hashed credentials.
- **Access:** Public.
- **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "password": "StrongPassword@123",
    "fullName": "Amit Kumar",
    "phone": "+919876543210"
  }
  ```
- **Responses:**
  - `201 Created`: Returns user profile without password hash.
  - `400 Bad Request`: Zod validation failure.
  - `409 Conflict`: Email already registered.

#### `GET /api/auth/me`
- **Description:** Returns the authenticated user's profile and active session role.
- **Access:** Any authenticated session.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "usr-10293-uuid",
      "email": "customer@example.com",
      "fullName": "Amit Kumar",
      "role": "CUSTOMER"
    }
  }
  ```

---

### 3.2 Movies & Show Discovery

#### `GET /api/movies`
- **Description:** Search and filter the movie catalog.
- **Access:** Public.
- **Query Parameters:**
  - `city` (string, optional): City slug (e.g., `mumbai`).
  - `status` (`NOW_SHOWING` | `COMING_SOON`, optional).
  - `genre` (string, optional): Genre slug (e.g., `action`).
  - `language` (string, optional): Language code (e.g., `hi`, `en`).
  - `search` (string, optional): Title search query.
  - `page` (number, default: 1).
  - `limit` (number, default: 12).
- **Response `200 OK`:** Returns paginated movie cards with duration, rating, and poster URL.

#### `GET /api/shows`
- **Description:** Retrieves showtimes grouped by theatre for a given movie, city, and date.
- **Access:** Public.
- **Query Parameters:**
  - `movieId` (string, required).
  - `cityId` (string, required).
  - `date` (YYYY-MM-DD, required).
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "theatre": {
          "id": "th-mumbai-phoenix",
          "name": "PVR INOX Palladium",
          "address": "Lower Parel, Mumbai"
        },
        "shows": [
          {
            "id": "sh-9812",
            "screenName": "Audi 3 (Dolby Atmos)",
            "format": "IMAX 2D",
            "language": "Hindi",
            "startTime": "2026-11-14T14:30:00.000Z",
            "basePrice": 350.00,
            "availableSeats": 142
          }
        ]
      }
    ]
  }
  ```

#### `GET /api/shows/[id]/availability`
- **Description:** Returns the full physical seat grid of the screen with real-time availability states.
- **Access:** Public.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "showId": "sh-9812",
      "movieTitle": "Kalki 2898 AD",
      "screenName": "Audi 3",
      "seatTiers": [
        { "category": "SILVER", "price": 250.00 },
        { "category": "GOLD", "price": 350.00 },
        { "category": "PLATINUM", "price": 450.00 },
        { "category": "RECLINER", "price": 750.00 }
      ],
      "seats": [
        {
          "id": "st-A1",
          "row": "A",
          "number": 1,
          "category": "SILVER",
          "status": "AVAILABLE"
        },
        {
          "id": "st-E5",
          "row": "E",
          "number": 5,
          "category": "GOLD",
          "status": "HELD",
          "heldUntil": "2026-11-13T14:40:00.000Z"
        },
        {
          "id": "st-M1",
          "row": "M",
          "number": 1,
          "category": "RECLINER",
          "status": "BOOKED"
        }
      ]
    }
  }
  ```

---

### 3.3 High-Concurrency Seat Locking & Booking Engine

#### `POST /api/shows/[id]/hold-seats` *(Core Concurrency Endpoint — AT-1 & AT-2)*
- **Description:** Places a temporary 10-minute hold on selected seats using a PostgreSQL row-level lock.
- **Access:** Authenticated Customer.
- **Request Body:**
  ```json
  {
    "seatIds": ["st-D5", "st-D6"],
    "sessionToken": "sess-uuid-client-token"
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    {
      "success": true,
      "data": {
        "holdId": "hld-90124",
        "showId": "sh-9812",
        "seats": ["st-D5", "st-D6"],
        "expiresAt": "2026-11-13T14:40:00.000Z",
        "remainingSeconds": 600
      }
    }
    ```
  - `409 Conflict` *(Double-Booking Prevention Triggered)*:
    ```json
    {
      "success": false,
      "error": {
        "code": "SEAT_UNAVAILABLE",
        "message": "Seat D5 has already been held or booked by another user.",
        "conflictingSeats": ["st-D5"]
      }
    }
    ```

#### `POST /api/holds/[id]/release`
- **Description:** Manually releases an active seat hold prior to TTL expiry.
- **Access:** Customer owning the hold.
- **Response `200 OK`:** `{ "success": true, "message": "Seats released successfully." }`

#### `POST /api/bookings`
- **Description:** Creates a pending booking based on an active seat hold and calculates exact taxes (18% GST) and convenience fees.
- **Access:** Authenticated Customer.
- **Request Body:**
  ```json
  {
    "showId": "sh-9812",
    "holdId": "hld-90124",
    "seatIds": ["st-D5", "st-D6"]
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "bookingId": "bk-8912",
      "bookingReference": "CNH-2026-8912",
      "subtotal": 700.00,
      "convenienceFee": 60.00,
      "taxAmount": 136.80,
      "totalAmount": 896.80,
      "status": "PENDING"
    }
  }
  ```

---

### 3.4 Payment Simulation & Digital Ticket Generation

#### `POST /api/payments/process` *(Idempotent Payment Engine)*
- **Description:** Processes a simulated payment for a pending booking. Atomically marks the booking `CONFIRMED`, creates `BookingSeat` records, converts `SeatHold` to `CONVERTED`, and issues a digital `Ticket`.
- **Access:** Authenticated Customer.
- **Headers:** `Idempotency-Key: <UUID>`
- **Request Body:**
  ```json
  {
    "bookingId": "bk-8912",
    "amount": 896.80,
    "method": "UPI",
    "simulateOutcome": "SUCCESS"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "paymentReference": "PAY-SIM-98123",
        "bookingReference": "CNH-2026-8912",
        "ticketReference": "TCK-8912-X1",
        "status": "SUCCESS",
        "amount": 896.80
      }
    }
    ```
  - `400 Bad Request`: Payment simulation failed / hold expired.
  - `409 Conflict`: Payment already completed for this idempotency key.

#### `GET /api/tickets/[reference]`
- **Description:** Retrieves the digital ticket containing movie, screen, seats, and the verification QR code.
- **Access:** Authenticated ticket owner, Staff, or Admin.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "ticketReference": "TCK-8912-X1",
      "bookingReference": "CNH-2026-8912",
      "movie": { "title": "Kalki 2898 AD", "language": "Hindi", "format": "IMAX 2D" },
      "theatre": { "name": "PVR INOX Palladium", "screen": "Audi 3" },
      "showtime": "2026-11-14T14:30:00.000Z",
      "seats": ["Row D Seat 5", "Row D Seat 6"],
      "qrCodeData": "data:image/png;base64,iVBORw0KGgo...",
      "status": "ISSUED"
    }
  }
  ```

---

### 3.5 Staff Verification & Single-Use Gate Validation

#### `POST /api/staff/validate-ticket` *(Mandatory Acceptance Test AT-4)*
- **Description:** Verifies ticket validity and marks it `USED`. Rejects any subsequent validation attempt.
- **Access:** Roles: `STAFF` or `ADMIN`.
- **Request Body:**
  ```json
  {
    "ticketReference": "TCK-8912-X1",
    "validationToken": "sec-token-98123-uuid",
    "screenId": "sc-mumbai-audi3"
  }
  ```
- **Responses:**
  - `200 OK` *(First Scan — Ticket Approved)*:
    ```json
    {
      "success": true,
      "data": {
        "result": "VALID",
        "ticketReference": "TCK-8912-X1",
        "movieTitle": "Kalki 2898 AD",
        "seats": ["D5", "D6"],
        "admittedAt": "2026-11-14T14:15:30.000Z",
        "message": "Entry approved. Enjoy the show!"
      }
    }
    ```
  - `409 Conflict` *(Second Scan — Replay / Fraud Rejection)*:
    ```json
    {
      "success": false,
      "error": {
        "code": "TICKET_ALREADY_USED",
        "message": "Security Alert: This ticket was already validated at 14:15:30 by Staff Member staff@cinehub.in.",
        "previouslyValidatedAt": "2026-11-14T14:15:30.000Z"
      }
    }
    ```

---

### 3.6 Customer History & Cancellations

#### `GET /api/user/bookings`
- **Description:** Returns all bookings associated with the logged-in customer.
- **Access:** Authenticated Customer.
- **Query Parameters:** `status` (`CONFIRMED`, `CANCELLED`, `ALL`).

#### `POST /api/bookings/[id]/cancel`
- **Description:** Cancels an eligible booking up to 2 hours before showtime. Releases physical seats and creates a simulated refund record.
- **Access:** Authenticated booking owner.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "bookingReference": "CNH-2026-8912",
      "status": "CANCELLED",
      "refundAmount": 700.00,
      "cancellationFee": 60.00,
      "refundStatus": "COMPLETED"
    }
  }
  ```

---

### 3.7 Administrative Reporting & Audit Trail

#### `GET /api/admin/reports/occupancy` *(Acceptance Test AT-5)*
- **Description:** Aggregates real-time occupancy percentages per show, screen, and cinema. Reflects dynamic bookings and cancellations.
- **Access:** Role: `ADMIN`.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "overallOccupancyRate": 74.5,
      "totalCapacity": 1200,
      "totalBookedSeats": 894,
      "totalCancelledSeats": 36,
      "shows": [
        {
          "showId": "sh-9812",
          "movieTitle": "Kalki 2898 AD",
          "screenName": "Audi 3",
          "totalSeats": 200,
          "bookedSeats": 164,
          "occupancyRate": 82.0
        }
      ]
    }
  }
  ```

#### `GET /api/admin/reports/sales`
- **Description:** Financial analytics report showing gross revenue, GST collected, convenience fees, and refunds.
- **Access:** Role: `ADMIN`.

#### `GET /api/admin/audit-logs`
- **Description:** Filterable immutable system audit trail.
- **Access:** Role: `ADMIN`.

---

## 4. Zod Validation Schemas (Source of Truth)

```typescript
// src/schemas/booking.schema.ts
import { z } from 'zod';

export const HoldSeatsSchema = z.object({
  seatIds: z.array(z.string().uuid()).min(1, 'At least one seat must be selected.').max(10, 'Maximum 10 seats per booking.'),
  sessionToken: z.string().min(1, 'Session token required for hold concurrency tracking.')
});

export const CreateBookingSchema = z.object({
  showId: z.string().uuid(),
  holdId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1).max(10)
});

export const ProcessPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['UPI', 'CARD', 'NETBANKING']),
  simulateOutcome: z.enum(['SUCCESS', 'FAILED', 'PENDING']).default('SUCCESS')
});

export const ValidateTicketSchema = z.object({
  ticketReference: z.string().min(5),
  validationToken: z.string().min(10).optional(),
  screenId: z.string().uuid().optional()
});
```

