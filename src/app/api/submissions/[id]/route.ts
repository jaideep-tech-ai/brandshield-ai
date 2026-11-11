import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const sub = await db.submission.findUnique({
      where: { id },
      include: {
        author: { select: { name: true, role: true } },
        findings: { orderBy: { createdAt: "asc" } },
        revisions: { orderBy: { version: "asc" }, include: { author: { select: { name: true } } } },
        inspections: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!sub || sub.orgId !== user.orgId) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...sub,
      imagePalette: sub.imagePalette ? (JSON.parse(sub.imagePalette) as string[]) : [],
      authorName: sub.author.name,
      authorRole: sub.author.role,
      inspections: sub.inspections.map((i) => ({
        ...i,
        stageA: safeParse(i.stageA),
        stageB: safeParse(i.stageB),
      })),
    });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const sub = await db.submission.findUnique({ where: { id } });
    if (!sub || sub.orgId !== user.orgId) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (sub.authorId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Only the author can edit this draft" }, { status: 403 });
    }
    const body = (await req.json()) as { title?: string; content?: string; imageData?: string; imagePalette?: string[] };

    const contentChanged = typeof body.content === "string" && body.content !== sub.content;
    const nextVersion = contentChanged ? sub.currentVersion + 1 : sub.currentVersion;

    const updated = await db.submission.update({
      where: { id },
      data: {
        title: body.title?.trim() || sub.title,
        content: body.content ?? sub.content,
        imageData: body.imageData ?? sub.imageData,
        imagePalette: body.imagePalette ? JSON.stringify(body.imagePalette) : sub.imagePalette,
        currentVersion: nextVersion,
      },
    });
    if (contentChanged) {
      await db.revision.create({
        data: {
          submissionId: id,
          version: nextVersion,
          content: body.content!,
          changeSummary: "Edited draft",
          authorId: user.id,
        },
      });
    }
    return NextResponse.json({ ...updated, imagePalette: body.imagePalette ?? [] });
  } catch (e) {
    return jsonError(e);
  }
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
