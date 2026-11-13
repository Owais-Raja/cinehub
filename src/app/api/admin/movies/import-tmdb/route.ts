import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { TmdbService } from "@/services/tmdb.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole([Role.ADMIN]);
    const body = await request.json();
    const tmdbId = parseInt(body.tmdbId, 10);

    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Valid tmdbId is required" }, { status: 400 });
    }

    const result = await TmdbService.importMovieToDatabase(tmdbId, admin.id);

    return NextResponse.json(
      {
        message: `Movie "${result.movie.title}" successfully imported from TMDb.`,
        movie: result.movie,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

