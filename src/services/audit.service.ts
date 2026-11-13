import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class AuditService {
  static async log({
    userId,
    action,
    entityType,
    entityId,
    metadata,
    ipAddress,
  }: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown> | Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: userId || null,
          action,
          entityType,
          entityId,
          metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          ipAddress: ipAddress || null,
        },
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
      // Non-blocking: audit failure should not break customer checkout
      return null;
    }
  }

  static async getLogs({
    entityType,
    entityId,
    limit = 50,
  }: {
    entityType?: string;
    entityId?: string;
    limit?: number;
  }) {
    return prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

