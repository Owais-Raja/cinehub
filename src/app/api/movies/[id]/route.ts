import { NextRequest, NextResponse } from "next/server";
import { MovieService } from "@/services/movie.service";
import { handleApiError, requireRole } from "@/lib/rbac";
import { Role } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movie = await MovieService.getMovieBySlug(id);
    return NextResponse.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.ADMIN]);
    const { id } = await params;
    const body = await req.json();

    const movie = await MovieService.updateMovie(id, body, user.id);
    return NextResponse.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

