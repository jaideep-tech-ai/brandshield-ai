import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    return NextResponse.json(user);
  } catch (e) {
    return jsonError(e);
  }
}
