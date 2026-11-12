import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const configured = Boolean(
    process.env.FIGMA_CLIENT_ID?.trim() && process.env.FIGMA_CLIENT_SECRET?.trim()
  );

  try {
    const connection = await db.figmaOAuthConnection.findUnique({
      where: { userId: user.id },
      select: {
        figmaUserId: true,
        figmaEmail: true,
        figmaHandle: true,
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
        figmaEmail: null,
        figmaHandle: null,
        expiresAt: null,
        provider: "figma",
        status: "disconnected",
      });
    }

    const isExpired = connection.tokenExpiry.getTime() <= Date.now();
    const hasRefreshToken = Boolean(connection.encryptedRefreshToken);

    return NextResponse.json({
      configured,
      connected: true,
      figmaUserId: connection.figmaUserId,
      figmaEmail: connection.figmaEmail,
      figmaHandle: connection.figmaHandle,
      expiresAt: connection.tokenExpiry.toISOString(),
      scope: connection.scope,
      provider: "figma",
      status: isExpired ? (hasRefreshToken ? "active_auto_refresh" : "expired") : "active",
      hasRefreshToken,
      lastSyncedAt: connection.updatedAt.toISOString(),
    });
  } catch (err: unknown) {
    console.error("[FigmaStatusAPI] Error querying connection status:", err);
    return NextResponse.json(
      {
        configured,
        connected: false,
        provider: "figma",
        status: "error",
        error: "Failed to query Figma connection status",
      },
      { status: 500 }
    );
  }
}

