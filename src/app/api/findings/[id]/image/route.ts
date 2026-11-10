import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/brandshield/server/auth";
import { appendAuditLog } from "@/lib/brandshield/server/engine";
import { jsonError } from "@/lib/brandshield/server/json";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

/**
 * POST /api/findings/[id]/image
 *
 * Attaches a remediated / replacement image to resolve a visual brand finding.
 * Automatically updates the parent submission's banner image, increments version,
 * and sets finding status to resolved with an immutable audit chain entry.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const finding = await db.finding.findUnique({
      where: { id },
      include: { submission: true },
    });

    if (!finding || finding.submission.orgId !== user.orgId) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    const sub = finding.submission;

    let dataUrl: string | null = null;
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No image file provided" }, { status: 400 });
      }

      const blob = file as Blob;
      if (blob.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Image exceeds 5MB maximum size" }, { status: 400 });
      }

      const mime = blob.type || "image/png";
      if (!ALLOWED_MIME.has(mime)) {
        return NextResponse.json({ error: `Unsupported image format: ${mime}` }, { status: 400 });
      }

      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      dataUrl = `data:${mime};base64,${base64}`;
    } else {
      const json = await req.json().catch(() => ({}));
      if (typeof json.imageData === "string" && json.imageData.startsWith("data:image/")) {
        dataUrl = json.imageData;
      } else {
        return NextResponse.json({ error: "A valid image data URL is required" }, { status: 400 });
      }
    }

    const nextVersion = sub.currentVersion + 1;

    // Update parent submission image & reset score for rescan
    await db.submission.update({
      where: { id: sub.id },
      data: {
        imageData: dataUrl,
        currentVersion: nextVersion,
        complianceScore: null,
      },
    });

    // Mark finding as resolved
    const updatedFinding = await db.finding.update({
      where: { id },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
        suggestion: "Remediated via replacement image upload",
      },
    });

    // Create revision snapshot
    await db.revision.create({
      data: {
        submissionId: sub.id,
        version: nextVersion,
        content: sub.content,
        changeSummary: `Remediated visual finding #${id.slice(-6)} with new asset image`,
        authorId: user.id,
      },
    });

    // Cryptographic audit chain log
    await appendAuditLog({
      orgId: user.orgId,
      submissionId: sub.id,
      actorId: user.id,
      action: "FINDING_RESOLVED",
      details: {
        findingId: id,
        remediationType: "image_upload",
        flagged: finding.flaggedText.slice(0, 80),
        newVersion: nextVersion,
      },
    });

    return NextResponse.json({
      ok: true,
      finding: updatedFinding,
      version: nextVersion,
      imageUrl: `/api/submissions/${sub.id}/image`,
    });
  } catch (e) {
    return jsonError(e);
  }
}
