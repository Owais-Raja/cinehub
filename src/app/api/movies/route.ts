import { NextRequest, NextResponse } from "next/server";
import { MovieService } from "@/services/movie.service";
import { handleApiError, requireRole } from "@/lib/rbac";
import { Role, MovieStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const citySlug = searchParams.get("city") || undefined;
    const genreSlug = searchParams.get("genre") || undefined;
    const languageCode = searchParams.get("language") || undefined;
    const status = (searchParams.get("status") as MovieStatus) || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 12);

    const result = await MovieService.getMovies({
      citySlug,
      genreSlug,
      languageCode,
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.movies,
      meta: result.pagination,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole([Role.ADMIN]);
    const body = await req.json();

    const movie = await MovieService.createMovie({
      ...body,
      releaseDate: new Date(body.releaseDate),
      adminUserId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: movie,
        message: "Movie added to catalog successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

