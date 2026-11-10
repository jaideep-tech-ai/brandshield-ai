import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/brandshield/server/crypto";
import { appendAuditLog } from "@/lib/brandshield/server/engine";
import {
  verifyGitLabOAuthState,
  exchangeGitLabOAuthCode,
  fetchGitLabUserProfile,
  GITLAB_NONCE_COOKIE,
} from "@/lib/brandshield/server/gitlab";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/?auth=error&reason=unauthenticated", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const errorDesc = req.nextUrl.searchParams.get("error_description");

  if (error || !code) {
    const errorMsg = errorDesc || error || "Authorization cancelled or missing code.";
    const res = NextResponse.redirect(
      new URL(
        `/?view=integrations&tab=webhooks&status=error&error=${encodeURIComponent(errorMsg)}`,
        req.url
      )
    );
    res.cookies.delete(GITLAB_NONCE_COOKIE);
    return res;
  }

  // 1. Cryptographically verify anti-CSRF OAuth state bound to user and session nonce cookie
  // and atomically consume the nonce from the database to prevent replay attacks.
  const cookieNonce = req.cookies.get(GITLAB_NONCE_COOKIE)?.value;
  const stateCheck = await verifyGitLabOAuthState(state, user.id, cookieNonce);

  if (!stateCheck.valid) {
    const res = NextResponse.redirect(
      new URL(
        `/?view=integrations&tab=webhooks&status=error&error=invalid_state&details=${encodeURIComponent(
          stateCheck.reason || "State verification or anti-replay check failed."
        )}`,
        req.url
      )
    );
    res.cookies.delete(GITLAB_NONCE_COOKIE);
    return res;
  }

  const clientId = process.env.GITLAB_CLIENT_ID?.split(/\r?\n/)[0]?.trim();
  const clientSecret = process.env.GITLAB_CLIENT_SECRET?.split(/\r?\n/)[0]?.trim();
  const redirectUri =
    process.env.GITLAB_REDIRECT_URI?.split(/\r?\n/)[0]?.trim() ||
    `${req.nextUrl.origin}/api/integrations/gitlab/callback`;

  if (!clientId || !clientSecret) {
    const res = NextResponse.redirect(
      new URL(
        "/?view=integrations&tab=webhooks&status=error&error=server_unconfigured&details=Missing+GitLab+OAuth+credentials",
        req.url
      )
    );
    res.cookies.delete(GITLAB_NONCE_COOKIE);
    return res;
  }

  try {
    // 2. Exchange authorization code for access and refresh tokens
    const tokens = await exchangeGitLabOAuthCode(code, redirectUri);

    // 3. Fetch authenticated user profile from GitLab API
    const profile = await fetchGitLabUserProfile(tokens.accessToken);

    // 4. Encrypt tokens at rest using AES-256-GCM
    const encryptedAccessToken = encryptToken(tokens.accessToken);
    const encryptedRefreshToken = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;
    const tokenExpiry = tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null;

    // 5. Store connection metadata bound to the organization and user
    const existingConn = await db.gitLabConnection.findFirst({
      where: { orgId: user.orgId },
    });

    if (existingConn) {
      await db.gitLabConnection.update({
        where: { id: existingConn.id },
        data: {
          userId: user.id,
          gitlabUserId: String(profile.id),
          gitlabUsername: profile.username,
          encryptedAccessToken,
          encryptedRefreshToken,
          tokenExpiry,
          scope: tokens.scope || "api,read_user",
          status: existingConn.projectId ? "connected" : "connecting",
        },
      });
    } else {
      await db.gitLabConnection.create({
        data: {
          orgId: user.orgId,
          userId: user.id,
          gitlabUserId: String(profile.id),
          gitlabUsername: profile.username,
          encryptedAccessToken,
          encryptedRefreshToken,
          tokenExpiry,
          scope: tokens.scope || "api,read_user",
          status: "connecting",
        },
      });
    }

    // 6. Record tamper-evident cryptographic audit log
    await appendAuditLog({
      orgId: user.orgId,
      submissionId: null,
      actorId: user.id,
      action: "INTEGRATION_CONNECT_GITLAB",
      details: {
        provider: "gitlab",
        gitlabUserId: profile.id,
        gitlabUsername: profile.username,
        timestamp: new Date().toISOString(),
      },
    });

    const res = NextResponse.redirect(
      new URL("/?view=integrations&tab=webhooks&gitlab=authorized", req.url)
    );
    res.cookies.delete(GITLAB_NONCE_COOKIE);
    return res;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Token exchange error";
    console.error("[GitLab Callback] OAuth exchange error:", errorMsg);
    const res = NextResponse.redirect(
      new URL(
        `/?view=integrations&tab=webhooks&status=error&error=token_exchange_failed&details=${encodeURIComponent(
          errorMsg
        )}`,
        req.url
      )
    );
    res.cookies.delete(GITLAB_NONCE_COOKIE);
    return res;
  }
}

