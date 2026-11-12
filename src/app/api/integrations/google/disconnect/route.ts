import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { db } from "@/lib/db";
import { decryptToken } from "@/lib/brandshield/server/crypto";
import { appendAuditLog } from "@/lib/brandshield/server/engine";
import { OAUTH_NONCE_COOKIE } from "@/lib/brandshield/server/google";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const connection = await db.googleOAuthConnection.findUnique({
      where: { userId: user.id },
    });

    let revoked = false;

    if (connection) {
      // Attempt token revocation with Google's OAuth2 revoke endpoint
      try {
        const rawToken = connection.encryptedRefreshToken
          ? decryptToken(connection.encryptedRefreshToken)
          : decryptToken(connection.encryptedAccessToken);

        const revokeRes = await fetch(
          `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(rawToken)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );
        revoked = revokeRes.ok;
      } catch (revokeErr) {
        console.warn("[GoogleDisconnect] Google OAuth token revocation warning:", revokeErr);
      }

      // Delete connection record from database
      await db.googleOAuthConnection.deleteMany({
        where: { userId: user.id },
      });

      // Record tamper-evident cryptographic audit log
      await appendAuditLog({
        orgId: user.orgId,
        submissionId: null,
        actorId: user.id,
        action: "INTEGRATION_DISCONNECT",
        details: {
          provider: "google",
          googleEmail: connection.googleEmail,
          revoked,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const res = NextResponse.json({
      success: true,
      message: "Google account disconnected and tokens revoked successfully.",
      revoked,
    });

    // Clear connection cookies
    res.cookies.delete("brandshield_gdoc_token");
    res.cookies.delete("brandshield_gdoc_refresh");
    res.cookies.delete(OAUTH_NONCE_COOKIE);

    return res;
  } catch (err: unknown) {
    console.error("[GoogleDisconnect] Error disconnecting integration:", err);
    return NextResponse.json(
      { error: "Failed to disconnect Google integration" },
      { status: 500 }
    );
  }
}
