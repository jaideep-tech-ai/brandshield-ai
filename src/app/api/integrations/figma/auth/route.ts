import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { generateFigmaOAuthState, FIGMA_NONCE_COOKIE } from "@/lib/brandshield/server/figma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const clientId = process.env.FIGMA_CLIENT_ID?.split(/\r?\n/)[0]?.trim();

  if (!clientId) {
    return NextResponse.json(
      {
        configured: false,
        message: "Figma Developer App is not configured on the server. Set FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET to enable direct Figma OAuth linking.",
        sandboxAvailable: true,
      },
      { status: 200 }
    );
  }

  const redirectUri =
    process.env.FIGMA_REDIRECT_URI?.split(/\r?\n/)[0]?.trim() ||
    `${req.nextUrl.origin}/api/integrations/figma/callback`;
  const { state, nonce } = generateFigmaOAuthState(user.id);

  const scopes = process.env.FIGMA_OAUTH_SCOPES?.trim() || "file_content:read,current_user:read";

  const authUrl = new URL("https://www.figma.com/oauth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());

  res.cookies.set(FIGMA_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes (matches state expiry)
  });

  return res;
}

