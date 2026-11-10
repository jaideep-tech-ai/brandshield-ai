import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/?auth=error&reason=unauthenticated", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/?integrations=google&status=error&error=${encodeURIComponent(error || "missing_code")}`, req.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.nextUrl.origin}/api/integrations/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/?integrations=google&status=error&error=server_unconfigured", req.url)
    );
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
      return NextResponse.redirect(
        new URL(`/?integrations=google&status=error&error=token_exchange_failed&details=${encodeURIComponent(errText)}`, req.url)
      );
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    // Store in cookie or redirect with success
    const res = NextResponse.redirect(new URL("/?integrations=google&status=connected", req.url));
    res.cookies.set("brandshield_gdoc_token", tokens.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expires_in || 3600,
    });

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Exchange failed";
    return NextResponse.redirect(
      new URL(`/?integrations=google&status=error&error=${encodeURIComponent(msg)}`, req.url)
    );
  }
}

