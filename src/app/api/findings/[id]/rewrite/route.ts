import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { generateRewrite } from "@/lib/brandshield/server/engine";
import { jsonError } from "@/lib/brandshield/server/json";

export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const finding = await db.finding.findUnique({ where: { id }, include: { submission: true } });
    if (!finding || finding.submission.orgId !== user.orgId) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }
    const suggestion = await generateRewrite(
      {
        flaggedText: finding.flaggedText,
        rationale: finding.rationale,
        ruleCitation: finding.ruleCitation,
        category: finding.category,
      },
      finding.submission.content
    );
    return NextResponse.json({ suggestion });
  } catch (e) {
    return jsonError(e);
  }
}
