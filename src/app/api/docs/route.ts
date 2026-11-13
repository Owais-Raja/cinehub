import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "CineHub Cinema Ticket Booking API",
      version: "1.0.0",
      description:
        "Complete REST API specification for CineHub — an India-focused, BookMyShow-inspired cinema ticket booking engine.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    paths: {
      "/api/auth/register": {
        post: {
          summary: "Register new customer",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "fullName"],
                  properties: {
                    fullName: { type: "string", example: "Amit Kumar" },
                    email: { type: "string", example: "amit@example.com" },
                    password: { type: "string", example: "Secure@123" },
                    phone: { type: "string", example: "+919876543210" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Registered successfully" },
            "409": { description: "Email already registered" },
          },
        },
      },
      "/api/movies": {
        get: {
          summary: "Browse and filter movies",
          parameters: [
            { name: "city", in: "query", schema: { type: "string" } },
            { name: "genre", in: "query", schema: { type: "string" } },
            { name: "language", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "List of movies" },
          },
        },
      },
      "/api/shows/{id}/availability": {
        get: {
          summary: "Get real-time seat map and availability",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Seat layout with statuses: AVAILABLE, HELD, BOOKED" },
          },
        },
      },
      "/api/shows/{id}/hold-seats": {
        post: {
          summary: "Lock seats for 10 minutes with concurrency control (AT-1 & AT-2)",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["seatIds", "sessionToken"],
                  properties: {
                    seatIds: { type: "array", items: { type: "string" } },
                    sessionToken: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Hold confirmed with 10-minute lease" },
            "409": { description: "Double-booking conflict: Seat held or booked by another user" },
          },
        },
      },
      "/api/payments/process": {
        post: {
          summary: "Process simulated payment and confirm booking atomically",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["bookingId", "amount", "method", "idempotencyKey"],
                  properties: {
                    bookingId: { type: "string" },
                    amount: { type: "number" },
                    method: { type: "string", enum: ["UPI", "CARD", "NETBANKING"] },
                    idempotencyKey: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Booking confirmed and ticket issued" },
          },
        },
      },
      "/api/staff/validate-ticket": {
        post: {
          summary: "Validate ticket QR / reference at gate (AT-4)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ticketReference"],
                  properties: {
                    ticketReference: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Entry approved; ticket marked USED" },
            "409": { description: "Duplicate entry rejected: Ticket already used" },
          },
        },
      },
      "/api/admin/reports/occupancy": {
        get: {
          summary: "Real-time theatre occupancy report reflecting bookings and cancellations (AT-5)",
          responses: {
            "200": { description: "Calculated occupancy percentages and statistics" },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
