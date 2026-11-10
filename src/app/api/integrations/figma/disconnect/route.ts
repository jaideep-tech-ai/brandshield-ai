import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { db } from "@/lib/db";
import { appendAuditLog } from "@/lib/brandshield/server/engine";
import { FIGMA_NONCE_COOKIE } from "@/lib/brandshield/server/figma";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const connection = await db.figmaOAuthConnection.findUnique({
      where: { userId: user.id },
    });

    if (connection) {
      // Delete connection record from database
      await db.figmaOAuthConnection.deleteMany({
        where: { userId: user.id },
      });

      // Record tamper-evident cryptographic audit log
      await appendAuditLog({
        orgId: user.orgId,
        submissionId: null,
        actorId: user.id,
        action: "INTEGRATION_DISCONNECT",
        details: {
          provider: "figma",
          figmaUserId: connection.figmaUserId,
          figmaEmail: connection.figmaEmail,
          figmaHandle: connection.figmaHandle,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const res = NextResponse.json({
      success: true,
      message: "Figma account disconnected successfully.",
    });

    // Clear connection cookies
    res.cookies.delete("brandshield_figma_token");
    res.cookies.delete(FIGMA_NONCE_COOKIE);

    return res;
  } catch (err: unknown) {
    console.error("[FigmaDisconnect] Error disconnecting Figma integration:", err);
    return NextResponse.json(
      { error: "Failed to disconnect Figma integration" },
      { status: 500 }
    );
  }
}
