import { NextRequest, NextResponse } from "next/server";
import { TmdbService } from "@/services/tmdb.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tmdbId = parseInt(id, 10);
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid TMDb ID" }, { status: 400 });
    }

    const details = await TmdbService.getMovieDetails(tmdbId);
    if (!details) {
      return NextResponse.json({ error: "Movie not found on TMDb" }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error("[GET /api/tmdb/movie/[id]] Error:", error);
    return NextResponse.json({ error: "Failed to fetch movie details" }, { status: 500 });
  }
}

