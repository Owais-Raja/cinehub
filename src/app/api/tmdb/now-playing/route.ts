import { NextRequest, NextResponse } from "next/server";
import { TmdbService } from "@/services/tmdb.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const region = searchParams.get("region") || "IN";

    const result = await TmdbService.getNowPlaying(page, region);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/tmdb/now-playing] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch now playing movies from TMDb", movies: [] },
      { status: 500 }
    );
  }
}

