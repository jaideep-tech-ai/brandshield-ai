import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import { queueDocumentIngestion } from "@/lib/brandshield/server/document-queue";

export const maxDuration = 60;

const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    requireRole(user, "admin");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = (formData.get("docType") as string) || "guideline";
    const userTitle = (formData.get("title") as string)?.trim();

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds the 50 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate PDF magic bytes: '%PDF-'
    if (buffer.length < 5 || buffer.toString("ascii", 0, 5) !== "%PDF-") {
      return NextResponse.json(
        { error: "Invalid file signature. Only authentic PDF documents (%PDF-) are accepted." },
        { status: 400 }
      );
    }

    const title = userTitle || file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ").trim();

    const doc = await db.guidelineDocument.create({
      data: {
        orgId: user.orgId,
        title,
        docType,
        content: `Indexing ${file.name}... (extraction in progress)`,
        sourceName: file.name,
        fileSize: buffer.length,
        mimeType: "application/pdf",
        status: "uploaded",
        chunkCount: 0,
        pageCount: 0,
      },
    });

    // Enqueue decoupled background extraction and embedding generation
    queueDocumentIngestion(doc.id, buffer);

    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}

