import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import {
  verifyGoogleOAuthState,
  saveGoogleOAuthConnection,
  markNonceConsumed,
  OAUTH_NONCE_COOKIE,
} from "@/lib/brandshield/server/google";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.redirect(new URL("/?auth=error&reason=unauthenticated", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    const res = NextResponse.redirect(
      new URL(
        `/?view=integrations&integrations=google&status=error&error=${encodeURIComponent(error || "missing_code")}`,
        req.url
      )
    );
    res.cookies.delete(OAUTH_NONCE_COOKIE);
    return res;
  }

  // 1. Cryptographically verify anti-CSRF OAuth state bound to user and session nonce cookie
  const cookieNonce = req.cookies.get(OAUTH_NONCE_COOKIE)?.value;
  const stateCheck = verifyGoogleOAuthState(state, user.id, cookieNonce);

  if (!stateCheck.valid) {
    const res = NextResponse.redirect(
      new URL(
        `/?view=integrations&integrations=google&status=error&error=invalid_state&details=${encodeURIComponent(
          stateCheck.reason || "CSRF failure"
        )}`,
        req.url
      )
    );
    res.cookies.delete(OAUTH_NONCE_COOKIE);
    return res;
  }

  // Mark nonce consumed to enforce one-time usage and prevent replay
  if (stateCheck.nonce) {
    markNonceConsumed(stateCheck.nonce);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.nextUrl.origin}/api/integrations/google/callback`;

  if (!clientId || !clientSecret) {
    const res = NextResponse.redirect(
      new URL("/?view=integrations&integrations=google&status=error&error=server_unconfigured", req.url)
    );
    res.cookies.delete(OAUTH_NONCE_COOKIE);
    return res;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      const res = NextResponse.redirect(
        new URL(
          `/?view=integrations&integrations=google&status=error&error=token_exchange_failed&details=${encodeURIComponent(
            errText
          )}`,
          req.url
        )
      );
      res.cookies.delete(OAUTH_NONCE_COOKIE);
      return res;
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
      id_token?: string;
    };

    // Extract user email from id_token if provided
    let googleEmail: string | undefined = undefined;
    if (tokens.id_token) {
      try {
        const base64Url = tokens.id_token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
        const parsed = JSON.parse(jsonPayload);
        if (parsed.email) googleEmail = parsed.email;
      } catch {
        // Fallback or ignore unparseable id_token
      }
    }

    // Persist encrypted tokens securely to database
    await saveGoogleOAuthConnection({
      userId: user.id,
      orgId: user.orgId,
      tokens,
      googleEmail,
    });

    // Redirect to the integrations tab with verified connected status
    const res = NextResponse.redirect(new URL("/?view=integrations&integrations=google&status=connected", req.url));

    // Clear one-time nonce cookie
    res.cookies.delete(OAUTH_NONCE_COOKIE);

    // Set short-lived access token cookie (never expose refresh token in cookies)
    res.cookies.set("brandshield_gdoc_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expires_in || 3600,
    });

    // Explicitly delete any legacy refresh cookie
    res.cookies.delete("brandshield_gdoc_refresh");

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Exchange failed";
    const res = NextResponse.redirect(
      new URL(`/?view=integrations&integrations=google&status=error&error=${encodeURIComponent(msg)}`, req.url)
    );
    res.cookies.delete(OAUTH_NONCE_COOKIE);
    return res;
  }
}
