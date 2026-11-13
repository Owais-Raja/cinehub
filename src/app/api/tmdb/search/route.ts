import { NextRequest, NextResponse } from "next/server";
import { TmdbService } from "@/services/tmdb.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (!query) {
      return NextResponse.json({ movies: [], totalPages: 0, totalResults: 0 });
    }

    const result = await TmdbService.searchMovies(query, page);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/tmdb/search] Error:", error);
    return NextResponse.json(
      { error: "Failed to search movies from TMDb", movies: [] },
      { status: 500 }
    );
  }
}

