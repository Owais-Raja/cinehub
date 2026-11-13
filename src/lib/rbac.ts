import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError("You must be signed in to perform this action.");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as Role)) {
    throw new ForbiddenError(
      `Access denied. This action requires one of the following roles: ${allowedRoles.join(
        ", "
      )}.`
    );
  }
  return user;
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = "UNAUTHORIZED";
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = "FORBIDDEN";
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = "CONFLICT";
  conflictingData?: unknown;
  constructor(message = "Conflict", conflictingData?: unknown) {
    super(message);
    this.name = "ConflictError";
    this.conflictingData = conflictingData;
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = "NOT_FOUND";
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  statusCode = 400;
  code = "VALIDATION_ERROR";
  details?: unknown;
  constructor(message = "Validation failed", details?: unknown) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error encountered:", error);

  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: 401 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: 403 }
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          conflictingData: error.conflictingData,
        },
      },
      { status: 409 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: 404 }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : "Internal Server Error";
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message,
      },
    },
    { status: 500 }
  );
}

