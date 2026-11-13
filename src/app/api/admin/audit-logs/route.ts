import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/services/audit.service";
import { requireRole, handleApiError } from "@/lib/rbac";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireRole([Role.ADMIN]);
    const { searchParams } = new URL(req.url);

    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const limit = Number(searchParams.get("limit") || 50);

    const logs = await AuditService.getLogs({
      entityType,
      entityId,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

