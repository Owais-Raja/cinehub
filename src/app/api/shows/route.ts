import { NextRequest, NextResponse } from "next/server";
import { ShowService } from "@/services/show.service";
import { handleApiError, requireRole } from "@/lib/rbac";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get("movieId");
    const citySlug = searchParams.get("citySlug") || undefined;
    const cityId = searchParams.get("cityId") || undefined;
    const dateStr = searchParams.get("date") || new Date().toISOString();

    if (!movieId) {
      return NextResponse.json(
        { success: false, error: { message: "movieId parameter is required." } },
        { status: 400 }
      );
    }

    const showsGrouped = await ShowService.getShowsForMovieAndCity({
      movieId,
      citySlug,
      cityId,
      date: new Date(dateStr),
    });

    return NextResponse.json({
      success: true,
      data: showsGrouped,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole([Role.ADMIN]);
    const body = await req.json();

    const show = await ShowService.createShow({
      ...body,
      startTime: new Date(body.startTime),
      adminUserId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: show,
        message: "Show scheduled successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

