import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { encryptToken, decryptToken } from "./crypto";

const STATE_MAX_AGE_SECONDS = 600; // 10 minutes maximum state age
const REFRESH_BUFFER_SECONDS = 300; // Refresh 5 minutes before expiration

export const OAUTH_NONCE_COOKIE = "brandshield_oauth_nonce";

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
}

/**
 * Set of consumed nonces for replay prevention within the state TTL window
 */
const consumedNonces = new Set<string>();

export function markNonceConsumed(nonce: string): void {
  consumedNonces.add(nonce);
  // Auto-cleanup after 15 minutes
  const timer = setTimeout(() => {
    consumedNonces.delete(nonce);
  }, 15 * 60 * 1000);
  if (timer.unref) timer.unref();
}

export function isNonceConsumed(nonce: string): boolean {
  return consumedNonces.has(nonce);
}

/**
 * In-flight promise map to deduplicate concurrent token refresh requests for the same user
 */
const inFlightRefreshes = new Map<string, Promise<string | null>>();

/**
 * Generates an HMAC-signed state parameter bound to the authenticated user ID and a secure nonce.
 * Format: `<userId>.<nonce>.<timestamp>.<signature>`
 */
export function generateGoogleOAuthState(userId: string): { state: string; nonce: string } {
  const secret = process.env.SESSION_SECRET || "brandshield_session_secret_32bytes_min";
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${userId}:${nonce}:${timestamp}`;
  const sig = createHmac("sha256", secret).update(data).digest("hex");
  return {
    state: `${userId}.${nonce}.${timestamp}.${sig}`,
    nonce,
  };
}

/**
 * Cryptographically verifies OAuth state against user identity, cookie nonce, timestamp, replay, and HMAC signature.
 */
export function verifyGoogleOAuthState(
  state: string | null | undefined,
  expectedUserId: string,
  cookieNonce?: string | null
): { valid: boolean; reason?: string; nonce?: string } {
  if (!state) {
    return { valid: false, reason: "Missing OAuth state parameter." };
  }

  const parts = state.split(".");
  if (parts.length !== 4) {
    return { valid: false, reason: "Malformed OAuth state format. Expected 4-segment token." };
  }

  const [userId, nonce, tsStr, signature] = parts;

  // 1. User binding check
  if (userId !== expectedUserId) {
    return { valid: false, reason: "State user identity mismatch." };
  }

  // 2. Cookie nonce binding check (CSRF defense)
  if (!cookieNonce) {
    return { valid: false, reason: "Missing session nonce cookie. State cannot be bound." };
  }
  if (nonce !== cookieNonce) {
    return { valid: false, reason: "State nonce does not match session nonce cookie." };
  }

  // 3. Replay attack prevention check
  if (isNonceConsumed(nonce)) {
    return { valid: false, reason: "OAuth state nonce has already been consumed (replay rejected)." };
  }

  // 4. Timestamp check (10 minutes tolerance)
  const timestamp = parseInt(tsStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, reason: "Invalid timestamp in OAuth state." };
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > STATE_MAX_AGE_SECONDS) {
    return { valid: false, reason: "OAuth state has expired (exceeded 10 minutes)." };
  }
  if (timestamp - now > 60) {
    // Clock drift guard
    return { valid: false, reason: "OAuth state timestamp in the future." };
  }

  // 5. HMAC signature check
  const secret = process.env.SESSION_SECRET || "brandshield_session_secret_32bytes_min";
  const expectedSig = createHmac("sha256", secret).update(`${userId}:${nonce}:${timestamp}`).digest("hex");

  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expectedSig, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false, reason: "Invalid OAuth state signature." };
    }
  } catch {
    return { valid: false, reason: "Signature comparison error." };
  }

  return { valid: true, nonce };
}

/**
 * Saves or updates encrypted Google OAuth tokens in the database for the user.
 */
export async function saveGoogleOAuthConnection(params: {
  userId: string;
  orgId: string;
  tokens: GoogleOAuthTokens;
  googleEmail?: string | null;
}) {
  const { userId, orgId, tokens, googleEmail } = params;
  const encryptedAccessToken = encryptToken(tokens.access_token);
  const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined;
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
  const scope = tokens.scope || "documents.readonly drive.readonly";

  const existing = await db.googleOAuthConnection.findUnique({
    where: { userId },
  });

  if (existing) {
    return db.googleOAuthConnection.update({
      where: { userId },
      data: {
        encryptedAccessToken,
        ...(encryptedRefreshToken ? { encryptedRefreshToken } : {}),
        tokenExpiry,
        scope,
        ...(googleEmail ? { googleEmail } : {}),
      },
    });
  }

  return db.googleOAuthConnection.create({
    data: {
      userId,
      orgId,
      googleEmail: googleEmail || null,
      encryptedAccessToken,
      encryptedRefreshToken: encryptedRefreshToken || null,
      tokenExpiry,
      scope,
    },
  });
}

/**
 * Returns a valid, non-expired access token for the given user, automatically refreshing
 * using the stored refresh token when near expiration. Handles concurrent requests safely.
 */
export async function getValidGoogleDocsToken(userId: string): Promise<string | null> {
  const connection = await db.googleOAuthConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    return null;
  }

  const now = Date.now();
  const expiryTime = connection.tokenExpiry.getTime();

  // If token is still valid with more than 5 minutes buffer, return it directly
  if (expiryTime - now > REFRESH_BUFFER_SECONDS * 1000) {
    try {
      return decryptToken(connection.encryptedAccessToken);
    } catch (err) {
      console.error("[getValidGoogleDocsToken] Decryption failed:", err);
    }
  }

  // Token is expired or expiring soon — refresh using refresh token
  if (!connection.encryptedRefreshToken) {
    console.warn(`[getValidGoogleDocsToken] Token expired and no refresh token available for user ${userId}`);
    return null;
  }

  // Deduplicate concurrent refreshes for the same user
  const existingRefresh = inFlightRefreshes.get(userId);
  if (existingRefresh) {
    return existingRefresh;
  }

  const refreshPromise = (async () => {
    try {
      const rawRefreshToken = decryptToken(connection.encryptedRefreshToken!);
      const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

      if (!clientId || !clientSecret) {
        throw new Error("Missing Google OAuth credentials for refresh.");
      }

      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: rawRefreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.error(`[getValidGoogleDocsToken] Google token refresh failed (${res.status}): ${errBody}`);
        return null;
      }

      const data = (await res.json()) as {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
        scope?: string;
      };

      const newEncryptedAccess = encryptToken(data.access_token);
      const newEncryptedRefresh = data.refresh_token ? encryptToken(data.refresh_token) : undefined;
      const newExpiry = new Date(Date.now() + data.expires_in * 1000);

      await db.googleOAuthConnection.update({
        where: { userId },
        data: {
          encryptedAccessToken: newEncryptedAccess,
          ...(newEncryptedRefresh ? { encryptedRefreshToken: newEncryptedRefresh } : {}),
          tokenExpiry: newExpiry,
        },
      });

      return data.access_token;
    } catch (err) {
      console.error("[getValidGoogleDocsToken] Unexpected refresh error:", err);
      return null;
    } finally {
      inFlightRefreshes.delete(userId);
    }
  })();

  inFlightRefreshes.set(userId, refreshPromise);
  return refreshPromise;
}
