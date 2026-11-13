import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireRole([Role.ADMIN]);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Limit file size to 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
    }

    // Convert to base64 Data URL so it is fully self-contained and works on Vercel/localhost without external storage
    const mimeType = file.type || "image/jpeg";
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Also attempt writing to public/uploads for local filesystem access
    try {
      const ext = path.extname(file.name) || ".jpg";
      const safeName = `movie-${Date.now()}${ext}`;
      const uploadPath = path.join(process.cwd(), "public", "uploads", safeName);
      await writeFile(uploadPath, buffer);
    } catch {
      // In serverless / read-only filesystem, fallback silently to dataUrl
    }

    return NextResponse.json({
      success: true,
      url: dataUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
