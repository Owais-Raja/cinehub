import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/services/report.service";
import { requireRole, handleApiError } from "@/lib/rbac";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireRole([Role.ADMIN]);
    const { searchParams } = new URL(req.url);

    const theatreId = searchParams.get("theatreId") || undefined;
    const movieId = searchParams.get("movieId") || undefined;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const report = await ReportService.getOccupancyReport({
      theatreId,
      movieId,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

