import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function sniffMime(dataUrl: string): string {
  const match = /^data:([^;,]+)[;,]/.exec(dataUrl);
  if (match) return match[1];
  // Legacy rows without a proper data URL prefix — sniff by magic bytes.
  const raw = dataUrl.slice(0, 512);
  if (raw.startsWith("iVBOR")) return "image/png";
  if (raw.startsWith("/9j/")) return "image/jpeg";
  if (raw.startsWith("UklGR")) return "image/webp";
  return "application/octet-stream";
}

/**
 * GET /api/submissions/[id]/image
 *
 * Serves the banner's stored data URL as a real binary image response.
 * Lets list APIs stay lightweight (no base64 in JSON) while <img> tags get
 * browser-cachable, fast-loading visuals.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const sub = await db.submission.findUnique({
      where: { id },
      select: { orgId: true, imageData: true, updatedAt: true },
    });
    if (!sub || sub.orgId !== user.orgId || !sub.imageData) {
      return new NextResponse("Not found", { status: 404 });
    }

    const imageData = sub.imageData;
    let payload: Buffer;
    if (imageData.startsWith("data:")) {
      const base64 = imageData.slice(imageData.indexOf(",") + 1);
      payload = Buffer.from(base64, "base64");
    } else {
      // Fallback: stored as raw base64 (legacy rows)
      payload = Buffer.from(imageData, "base64");
    }

    const mime = sniffMime(imageData);
    const ext = Object.entries(MIME).find(([, m]) => m === mime)?.[0] ?? "png";

    return new NextResponse(new Uint8Array(payload), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(payload.byteLength),
        "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
        "Content-Disposition": `inline; filename="banner-${id}.${ext}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

/**
 * POST /api/submissions/[id]/image
 *
 * Upload or replace the banner asset image for a submission.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const sub = await db.submission.findUnique({
      where: { id },
      select: { id: true, orgId: true, currentVersion: true, content: true },
    });

    if (!sub || sub.orgId !== user.orgId) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

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

    await db.submission.update({
      where: { id: sub.id },
      data: {
        imageData: dataUrl,
        contentType: "banner",
        currentVersion: nextVersion,
        complianceScore: null,
      },
    });

    await db.revision.create({
      data: {
        submissionId: sub.id,
        version: nextVersion,
        content: sub.content,
        changeSummary: "Updated banner image",
        authorId: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      version: nextVersion,
      imageUrl: `/api/submissions/${sub.id}/image`,
    });
  } catch (e) {
    return jsonError(e);
  }
}
