import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    return jsonError(e);
  }
}
