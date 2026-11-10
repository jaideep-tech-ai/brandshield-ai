import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import {
  verifyFigmaOAuthState,
  saveFigmaOAuthConnection,
  markFigmaNonceConsumed,
  fetchFigmaUserProfile,
  FIGMA_NONCE_COOKIE,
  FigmaOAuthTokens,
} from "@/lib/brandshield/server/figma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/?auth=error&reason=unauthenticated", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    const res = NextResponse.redirect(
      new URL(
        `/?view=integrations&tab=figma&integrations=figma&status=error&error=${encodeURIComponent(error || "missing_code")}`,
        req.url
      )
    );
    res.cookies.delete(FIGMA_NONCE_COOKIE);
    return res;
  }

  // 1. Cryptographically verify anti-CSRF OAuth state bound to user and session nonce cookie
  const cookieNonce = req.cookies.get(FIGMA_NONCE_COOKIE)?.value;
  const stateCheck = verifyFigmaOAuthState(state, user.id, cookieNonce);

  if (!stateCheck.valid) {
    const res = NextResponse.redirect(
      new URL(
        `/?view=integrations&tab=figma&integrations=figma&status=error&error=invalid_state&details=${encodeURIComponent(
          stateCheck.reason || "CSRF failure"
        )}`,
        req.url
      )
    );
    res.cookies.delete(FIGMA_NONCE_COOKIE);
    return res;
  }

  // Mark nonce consumed to enforce one-time usage and prevent replay
  if (stateCheck.nonce) {
    markFigmaNonceConsumed(stateCheck.nonce);
  }

  const clientId = process.env.FIGMA_CLIENT_ID?.trim();
  const clientSecret = process.env.FIGMA_CLIENT_SECRET?.trim();
  const redirectUri = process.env.FIGMA_REDIRECT_URI || `${req.nextUrl.origin}/api/integrations/figma/callback`;

  if (!clientId || !clientSecret) {
    const res = NextResponse.redirect(
      new URL("/?view=integrations&tab=figma&integrations=figma&status=error&error=server_unconfigured", req.url)
    );
    res.cookies.delete(FIGMA_NONCE_COOKIE);
    return res;
  }

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://api.figma.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      const res = NextResponse.redirect(
        new URL(
          `/?view=integrations&tab=figma&integrations=figma&status=error&error=token_exchange_failed&details=${encodeURIComponent(
            errText
          )}`,
          req.url
        )
      );
      res.cookies.delete(FIGMA_NONCE_COOKIE);
      return res;
    }

    const tokens = (await tokenRes.json()) as FigmaOAuthTokens;

    // Fetch user profile from /v1/me if token permits
    let figmaEmail: string | undefined = undefined;
    let figmaHandle: string | undefined = undefined;
    let figmaUserId: string | undefined = tokens.user_id_string || tokens.user_id;

    const profile = await fetchFigmaUserProfile(tokens.access_token);
    if (profile) {
      if (profile.email) figmaEmail = profile.email;
      if (profile.handle || profile.name) figmaHandle = profile.handle || profile.name;
      if (profile.id) figmaUserId = profile.id;
    }

    // Persist encrypted tokens securely in database
    await saveFigmaOAuthConnection({
      userId: user.id,
      orgId: user.orgId,
      tokens,
      figmaUserId,
      figmaEmail,
      figmaHandle,
    });

    const res = NextResponse.redirect(
      new URL("/?view=integrations&tab=figma&integrations=figma&status=connected", req.url)
    );

    // Delete one-time nonce cookie
    res.cookies.delete(FIGMA_NONCE_COOKIE);

    // Set short-lived access token cookie (never expose refresh token in cookies)
    res.cookies.set("brandshield_figma_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.min(tokens.expires_in || 7776000, 86400), // Max 1 day in cookie, DB handles 90 days
    });

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Exchange failed";
    const res = NextResponse.redirect(
      new URL(
        `/?view=integrations&tab=figma&integrations=figma&status=error&error=${encodeURIComponent(msg)}`,
        req.url
      )
    );
    res.cookies.delete(FIGMA_NONCE_COOKIE);
    return res;
  }
}
