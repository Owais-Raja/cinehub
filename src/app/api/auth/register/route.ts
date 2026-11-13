import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RegisterSchema } from "@/schemas/auth.schema";
import { handleApiError, ConflictError } from "@/lib/rbac";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = RegisterSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictError("An account with this email address already exists.");
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase().trim(),
        passwordHash,
        fullName: validatedData.fullName.trim(),
        phone: validatedData.phone || null,
        role: Role.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: "Customer account registered successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
