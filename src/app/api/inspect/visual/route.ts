import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import { processImageForColorClusters, validateImageBuffer } from "@/lib/brandshield/server/kmeans";
import { computeWcagMatrix } from "@/lib/brandshield/server/wcag";

export const maxDuration = 60;

/**
 * POST /api/inspect/visual
 *
 * Standalone multi-modal visual asset and WCAG 2.1 inspector.
 * Supports multipart/form-data (file upload) and application/json (base64 Data URL).
 * Enforces organization boundary, validates image headers, runs K-Means++ clustering
 * in CIELAB perceptual space, computes WCAG contrast ratios, and records the inspection.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    requireRole(user, "creator", "reviewer", "contractor", "admin");

    let buffer: Buffer;
    let assetName = "uploaded-asset";
    let mimeType = "image/png";
    let submissionId: string | null = null;
    let clusterCount = 5;

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No image file provided in 'file' field." }, { status: 400 });
      }

      assetName = file.name || "banner-graphic.png";
      mimeType = file.type || "image/png";
      const subIdForm = formData.get("submissionId");
      if (typeof subIdForm === "string" && subIdForm.trim()) {
        submissionId = subIdForm.trim();
      }
      const kParam = formData.get("k");
      if (kParam) clusterCount = parseInt(String(kParam), 10) || 5;

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes("application/json")) {
      const body = (await req.json()) as {
        imageData?: string;
        assetName?: string;
        submissionId?: string;
        k?: number;
      };

      if (!body.imageData || typeof body.imageData !== "string") {
        return NextResponse.json({ error: "A valid base64 'imageData' string or Data URL is required." }, { status: 400 });
      }

      assetName = body.assetName || "banner-graphic.png";
      if (body.submissionId) submissionId = body.submissionId;
      if (body.k) clusterCount = body.k;

      // Extract mime and buffer from data URL
      const match = /^data:([^;,]+)[;,]/.exec(body.imageData);
      if (match) mimeType = match[1];

      const base64Index = body.imageData.indexOf(",");
      const rawBase64 = base64Index !== -1 ? body.imageData.slice(base64Index + 1) : body.imageData;
      buffer = Buffer.from(rawBase64, "base64");
    } else {
      return NextResponse.json(
        { error: "Content-Type must be 'multipart/form-data' or 'application/json'." },
        { status: 415 }
      );
    }

    // 1. Signature & size validation
    const { format } = validateImageBuffer(buffer);
    if (!mimeType.includes("/")) mimeType = `image/${format}`;

    // 2. Organization isolation check on linked submission (if provided)
    if (submissionId) {
      const existingSub = await db.submission.findUnique({
        where: { id: submissionId },
        select: { id: true, orgId: true },
      });
      if (!existingSub || existingSub.orgId !== user.orgId) {
        return NextResponse.json({ error: "Linked submission not found in this organization." }, { status: 404 });
      }
    }

    // 3. Load approved brand visual tokens for current tenant
    const tokens = await db.visualToken.findMany({
      where: { orgId: user.orgId, tokenType: "color" },
      select: { name: true, value: true },
    });
    const approvedTokens = tokens.map((t) => ({ name: t.name, hex: t.value }));

    // 4. Execute Sharp preprocessing & K-Means++ clustering
    const kmeansResult = await processImageForColorClusters(buffer, approvedTokens, clusterCount);

    // 5. Execute WCAG 2.1 contrast evaluation
    const wcagResult = computeWcagMatrix(kmeansResult.palette);

    // 6. Build storage reference (data URL representation)
    const assetUrl = buffer.byteLength <= 1.5 * 1024 * 1024
      ? `data:${mimeType};base64,${buffer.toString("base64")}`
      : `asset://${user.orgId}/${assetName}`;

    // 7. Persist visual inspection to database
    const record = await db.visualInspection.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        submissionId: submissionId ?? null,
        assetName,
        assetUrl,
        fileSize: buffer.byteLength,
        mimeType,
        width: kmeansResult.metadata.width,
        height: kmeansResult.metadata.height,
        status: "completed",
        dominantPalette: JSON.stringify(kmeansResult.palette),
        colorFindings: JSON.stringify(kmeansResult.colorFindings),
        wcagResults: JSON.stringify(wcagResult.wcagMatrix),
        accessibilityScore: wcagResult.accessibilityScore,
        overallLevel: wcagResult.overallLevel,
        passed: wcagResult.passed,
        summary: `${kmeansResult.colorFindings.length} color deviation(s) · ${wcagResult.contrastViolations} WCAG contrast issue(s). ${wcagResult.summary}`,
        durationMs: kmeansResult.durationMs,
      },
    });

    return NextResponse.json({
      id: record.id,
      status: record.status,
      assetName: record.assetName,
      metadata: kmeansResult.metadata,
      palette: kmeansResult.palette,
      colorFindings: kmeansResult.colorFindings,
      wcagMatrix: wcagResult.wcagMatrix,
      accessibilityScore: wcagResult.accessibilityScore,
      overallLevel: wcagResult.overallLevel,
      passed: wcagResult.passed,
      summary: record.summary,
      disclaimer: wcagResult.disclaimer,
      durationMs: record.durationMs,
      createdAt: record.createdAt,
    });
  } catch (e) {
    return jsonError(e);
  }
}

/**
 * GET /api/inspect/visual
 *
 * Lists recent visual inspections for the current tenant or fetches by ?id=
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const inspection = await db.visualInspection.findUnique({
        where: { id },
      });
      if (!inspection || inspection.orgId !== user.orgId) {
        return NextResponse.json({ error: "Visual inspection not found." }, { status: 404 });
      }

      return NextResponse.json({
        ...inspection,
        dominantPalette: JSON.parse(inspection.dominantPalette),
        colorFindings: JSON.parse(inspection.colorFindings),
        wcagResults: JSON.parse(inspection.wcagResults),
      });
    }

    const inspections = await db.visualInspection.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(
      inspections.map((i) => ({
        ...i,
        dominantPalette: JSON.parse(i.dominantPalette),
        colorFindings: JSON.parse(i.colorFindings),
        wcagResults: JSON.parse(i.wcagResults),
      }))
    );
  } catch (e) {
    return jsonError(e);
  }
}

