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
