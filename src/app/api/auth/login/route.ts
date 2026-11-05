import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken } from "@/lib/brandshield/server/auth";
import { ensureSeed } from "@/lib/brandshield/server/seed";
import { jsonError } from "@/lib/brandshield/server/json";

export async function POST(req: NextRequest) {
  try {
    await ensureSeed();
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() }, include: { organization: true } });
    if (!user) {
      return NextResponse.json({ error: "No account found for this email. Try a demo persona." }, { status: 401 });
    }
    if (user.password !== password) {
      return NextResponse.json({ error: "Incorrect password. Demo accounts use “demo1234”." }, { status: 401 });
    }
    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      avatarColor: user.avatarColor,
      orgId: user.orgId,
      orgName: user.organization.name,
      orgSlug: user.organization.slug,
      zeroDataRetention: user.organization.zeroDataRetention,
    });
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    return jsonError(e);
  }
}
