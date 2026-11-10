import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import {
  generateGitLabOAuthState,
  persistGitLabOAuthNonce,
  GITLAB_NONCE_COOKIE,
} from "@/lib/brandshield/server/gitlab";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const clientId = process.env.GITLAB_CLIENT_ID?.split(/\r?\n/)[0]?.trim();

  if (!clientId) {
    return NextResponse.json(
      {
        configured: false,
        message:
          "GitLab OAuth Application is not configured on the server. Please configure GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET to enable one-click customer onboarding.",
        patAvailable: Boolean(process.env.GITLAB_ACCESS_TOKEN?.trim()),
      },
      { status: 200 }
    );
  }

  const redirectUri =
    process.env.GITLAB_REDIRECT_URI?.split(/\r?\n/)[0]?.trim() ||
    `${req.nextUrl.origin}/api/integrations/gitlab/callback`;

  const { state, nonce } = generateGitLabOAuthState(user.id);

  // Persist nonce to database BEFORE redirecting to GitLab for atomic anti-replay
  await persistGitLabOAuthNonce(nonce, user.id);

  const scopes = process.env.GITLAB_OAUTH_SCOPES?.trim() || "api read_user";

  const authUrl = new URL("https://gitlab.com/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());

  res.cookies.set(GITLAB_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return res;
}

