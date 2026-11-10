import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import { searchKnowledgeHybrid } from "@/lib/brandshield/server/vector-rag";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as {
      query?: string;
      documentId?: string;
      limit?: number;
      minSimilarity?: number;
    };

    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json({ passages: [], total: 0 });
    }

    const passages = await searchKnowledgeHybrid({
      orgId: user.orgId,
      query,
      documentId: body.documentId,
      limit: typeof body.limit === "number" ? Math.min(Math.max(body.limit, 1), 20) : 5,
      minSimilarity: typeof body.minSimilarity === "number" ? body.minSimilarity : 0.35,
    });

    return NextResponse.json({
      passages,
      total: passages.length,
      query,
    });
  } catch (e) {
    return jsonError(e);
  }
}

