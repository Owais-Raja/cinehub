import { NextResponse } from "next/server";
import { TheatreService } from "@/services/theatre.service";
import { handleApiError } from "@/lib/rbac";

export async function GET() {
  try {
    const cities = await TheatreService.getCities();
    return NextResponse.json({
      success: true,
      data: cities,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

