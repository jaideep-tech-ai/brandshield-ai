import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { getSessionUser } from "@/lib/brandshield/server/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.SESSION_SECRET || "brandshield_session_secret_32bytes_min";

  if (!clientId) {
    return NextResponse.json(
      {
        configured: false,
        message: "Google Cloud OAuth is not configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable direct OAuth linking.",
        sandboxAvailable: true,
      },
      { status: 200 }
    );
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.nextUrl.origin}/api/integrations/google/callback`;
  const stateToken = createHmac("sha256", secret).update(`${user.id}:${Date.now()}`).digest("hex");

  const scopes = [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "email",
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", `${user.id}:${stateToken}`);

  return NextResponse.redirect(authUrl.toString());
}

