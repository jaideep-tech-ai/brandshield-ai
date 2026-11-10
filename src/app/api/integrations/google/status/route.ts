import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const configured = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );

  try {
    const connection = await db.googleOAuthConnection.findUnique({
      where: { userId: user.id },
      select: {
        googleEmail: true,
        tokenExpiry: true,
        scope: true,
        updatedAt: true,
        encryptedRefreshToken: true,
      },
    });

    if (!connection) {
      return NextResponse.json({
        configured,
        connected: false,
        googleEmail: null,
        expiresAt: null,
        provider: "google",
        status: "disconnected",
      });
    }

    const isExpired = connection.tokenExpiry.getTime() <= Date.now();
    const hasRefreshToken = Boolean(connection.encryptedRefreshToken);

    return NextResponse.json({
      configured,
      connected: true,
      googleEmail: connection.googleEmail,
      expiresAt: connection.tokenExpiry.toISOString(),
      scope: connection.scope,
      provider: "google",
      status: isExpired ? (hasRefreshToken ? "active_auto_refresh" : "expired") : "active",
      hasRefreshToken,
      lastSyncedAt: connection.updatedAt.toISOString(),
    });
  } catch (err: unknown) {
    console.error("[GoogleStatusAPI] Error querying connection status:", err);
    return NextResponse.json(
      {
        configured,
        connected: false,
        provider: "google",
        status: "error",
        error: "Failed to query connection status",
      },
      { status: 500 }
    );
  }
}
