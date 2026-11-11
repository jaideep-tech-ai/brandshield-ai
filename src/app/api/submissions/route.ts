import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole, requireUser } from "@/lib/brandshield/server/auth";
import { appendAuditLog } from "@/lib/brandshield/server/engine";
import { jsonError } from "@/lib/brandshield/server/json";
import { seedStarterSubmissionsForOrg } from "@/lib/brandshield/server/seed";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    // Auto-seed sample compliance submissions if org is newly provisioned / empty
    let subs = await db.submission.findMany({
      where: { orgId: user.orgId },
      orderBy: { updatedAt: "desc" },
      omit: { imageData: true },
      include: {
        author: { select: { name: true, role: true } },
        findings: { orderBy: { createdAt: "asc" } },
        revisions: { orderBy: { version: "asc" }, include: { author: { select: { name: true } } } },
        inspections: { orderBy: { createdAt: "desc" } },
      },
    });

    if (subs.length === 0) {
      await seedStarterSubmissionsForOrg(user.orgId, user.id);
      subs = await db.submission.findMany({
        where: { orgId: user.orgId },
        orderBy: { updatedAt: "desc" },
        omit: { imageData: true },
        include: {
          author: { select: { name: true, role: true } },
          findings: { orderBy: { createdAt: "asc" } },
          revisions: { orderBy: { version: "asc" }, include: { author: { select: { name: true } } } },
          inspections: { orderBy: { createdAt: "desc" } },
        },
      });
    }
    return NextResponse.json(
      subs.map((s) => ({
        ...s,
        imagePalette: s.imagePalette ? (JSON.parse(s.imagePalette) as string[]) : [],
        authorName: s.author.name,
        authorRole: s.author.role,
        inspections: s.inspections.map((i) => ({
          ...i,
          stageA: safeParse(i.stageA),
          stageB: safeParse(i.stageB),
        })),
      }))
    );
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    requireRole(user, "creator", "contractor", "admin");
    const body = (await req.json()) as {
      title?: string;
      contentType?: string;
      content?: string;
      imageData?: string;
      imagePalette?: string[];
      department?: string;
      creatorNote?: string;
    };
    const contentType = body.contentType === "banner" ? "banner" : "text";
    if (!body.title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (contentType === "text" && !body.content?.trim()) {
      return NextResponse.json({ error: "Copy content is required for text submissions" }, { status: 400 });
    }
    if (contentType === "banner" && !body.imageData) {
      return NextResponse.json({ error: "A banner image is required for banner submissions" }, { status: 400 });
    }
    const sub = await db.submission.create({
      data: {
        orgId: user.orgId,
        authorId: user.id,
        title: body.title.trim(),
        contentType,
        content: body.content ?? "",
        imageData: body.imageData ?? null,
        imagePalette: body.imagePalette ? JSON.stringify(body.imagePalette) : null,
        department: body.department ?? user.department,
        creatorNote: body.creatorNote ?? null,
      },
    });
    await db.revision.create({
      data: {
        submissionId: sub.id,
        version: 1,
        content: body.content ?? "",
        changeSummary: "Initial draft",
        authorId: user.id,
      },
    });
    await appendAuditLog({
      orgId: user.orgId,
      submissionId: sub.id,
      actorId: user.id,
      action: "SUBMITTED",
      details: { title: sub.title, contentType, version: 1 },
    });
    return NextResponse.json({ ...sub, imagePalette: body.imagePalette ?? [] });
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
