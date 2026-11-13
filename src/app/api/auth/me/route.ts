import { NextResponse } from "next/server";
import { getCurrentUser, handleApiError, UnauthorizedError } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError("Not authenticated");
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

