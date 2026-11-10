import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { encryptToken, decryptToken } from "./crypto";

const STATE_MAX_AGE_SECONDS = 600; // 10 minutes maximum state age
const REFRESH_BUFFER_SECONDS = 300; // Refresh 5 minutes before expiration

export const FIGMA_NONCE_COOKIE = "brandshield_figma_nonce";

export interface FigmaOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user_id_string?: string;
  user_id?: string;
  scope?: string;
}

export interface FigmaUserProfile {
  id: string;
  email?: string;
  handle?: string;
  name?: string;
  img_url?: string;
}

/**
 * Consumed nonces registry to prevent replay attacks during state validity window
 */
const consumedFigmaNonces = new Set<string>();

export function markFigmaNonceConsumed(nonce: string): void {
  consumedFigmaNonces.add(nonce);
  const timer = setTimeout(() => {
    consumedFigmaNonces.delete(nonce);
  }, 15 * 60 * 1000);
  if (timer.unref) timer.unref();
}

export function isFigmaNonceConsumed(nonce: string): boolean {
  return consumedFigmaNonces.has(nonce);
}

/**
 * In-flight promise map to deduplicate concurrent Figma token refresh requests
 */
const inFlightFigmaRefreshes = new Map<string, Promise<string | null>>();

/**
 * Generates an HMAC-signed state parameter bound to the authenticated user ID and a secure nonce.
 * Format: `<userId>.<nonce>.<timestamp>.<signature>`
 */
export function generateFigmaOAuthState(userId: string): { state: string; nonce: string } {
  const secret = process.env.SESSION_SECRET || "brandshield_session_secret_32bytes_min";
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `figma:${userId}:${nonce}:${timestamp}`;
  const sig = createHmac("sha256", secret).update(data).digest("hex");
  return {
    state: `${userId}.${nonce}.${timestamp}.${sig}`,
    nonce,
  };
}

/**
 * Cryptographically verifies Figma OAuth state against user identity, cookie nonce, timestamp, replay, and HMAC.
 */
export function verifyFigmaOAuthState(
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
  if (isFigmaNonceConsumed(nonce)) {
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
  const expectedSig = createHmac("sha256", secret).update(`figma:${userId}:${nonce}:${timestamp}`).digest("hex");

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
 * Fetches the authenticated Figma user's profile metadata
 */
export async function fetchFigmaUserProfile(accessToken: string): Promise<FigmaUserProfile | null> {
  try {
    const res = await fetch("https://api.figma.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      console.warn(`[fetchFigmaUserProfile] Figma /v1/me returned status ${res.status}`);
      return null;
    }

    return (await res.json()) as FigmaUserProfile;
  } catch (err) {
    console.error("[fetchFigmaUserProfile] Network error:", err);
    return null;
  }
}

/**
 * Saves or updates encrypted Figma OAuth credentials in the database
 */
export async function saveFigmaOAuthConnection(params: {
  userId: string;
  orgId: string;
  tokens: FigmaOAuthTokens;
  figmaUserId?: string | null;
  figmaEmail?: string | null;
  figmaHandle?: string | null;
}) {
  const { userId, orgId, tokens, figmaUserId, figmaEmail, figmaHandle } = params;
  const encryptedAccessToken = encryptToken(tokens.access_token);
  const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined;
  // Figma default expiry is ~90 days (7776000 seconds)
  const expiresIn = tokens.expires_in || 7776000;
  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
  const scope = tokens.scope || "file_content:read,current_user:read";

  const existing = await db.figmaOAuthConnection.findUnique({
    where: { userId },
  });

  if (existing) {
    return db.figmaOAuthConnection.update({
      where: { userId },
      data: {
        encryptedAccessToken,
        ...(encryptedRefreshToken ? { encryptedRefreshToken } : {}),
        tokenExpiry,
        scope,
        ...(figmaUserId ? { figmaUserId } : {}),
        ...(figmaEmail ? { figmaEmail } : {}),
        ...(figmaHandle ? { figmaHandle } : {}),
      },
    });
  }

  return db.figmaOAuthConnection.create({
    data: {
      userId,
      orgId,
      figmaUserId: figmaUserId || null,
      figmaEmail: figmaEmail || null,
      figmaHandle: figmaHandle || null,
      encryptedAccessToken,
      encryptedRefreshToken: encryptedRefreshToken || null,
      tokenExpiry,
      scope,
    },
  });
}

/**
 * Returns a valid, non-expired Figma access token for the given user, automatically refreshing
 * using the stored refresh token when near expiration. Handles concurrent requests safely.
 */
export async function getValidFigmaToken(userId: string): Promise<string | null> {
  const connection = await db.figmaOAuthConnection.findUnique({
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
      console.error("[getValidFigmaToken] Decryption failed:", err);
    }
  }

  // Token is expired or expiring soon — refresh using refresh token
  if (!connection.encryptedRefreshToken) {
    console.warn(`[getValidFigmaToken] Token expired and no refresh token available for user ${userId}`);
    return null;
  }

  // Deduplicate concurrent refreshes for the same user
  const existingRefresh = inFlightFigmaRefreshes.get(userId);
  if (existingRefresh) {
    return existingRefresh;
  }

  const refreshPromise = (async () => {
    try {
      const rawRefreshToken = decryptToken(connection.encryptedRefreshToken!);
      const clientId = process.env.FIGMA_CLIENT_ID?.split(/\r?\n/)[0]?.trim();
      const clientSecret = process.env.FIGMA_CLIENT_SECRET?.split(/\r?\n/)[0]?.trim();

      if (!clientId || !clientSecret) {
        throw new Error("Missing Figma OAuth credentials for token refresh.");
      }

      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const res = await fetch("https://api.figma.com/v1/oauth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          refresh_token: rawRefreshToken,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.error(`[getValidFigmaToken] Figma token refresh failed (${res.status}): ${errBody}`);
        return null;
      }

      const data = (await res.json()) as {
        access_token: string;
        expires_in?: number;
        refresh_token?: string;
      };

      const newEncryptedAccess = encryptToken(data.access_token);
      const newEncryptedRefresh = data.refresh_token ? encryptToken(data.refresh_token) : undefined;
      const expiresIn = data.expires_in || 7776000;
      const newExpiry = new Date(Date.now() + expiresIn * 1000);

      await db.figmaOAuthConnection.update({
        where: { userId },
        data: {
          encryptedAccessToken: newEncryptedAccess,
          ...(newEncryptedRefresh ? { encryptedRefreshToken: newEncryptedRefresh } : {}),
          tokenExpiry: newExpiry,
        },
      });

      return data.access_token;
    } catch (err) {
      console.error("[getValidFigmaToken] Unexpected refresh error:", err);
      return null;
    } finally {
      inFlightFigmaRefreshes.delete(userId);
    }
  })();

  inFlightFigmaRefreshes.set(userId, refreshPromise);
  return refreshPromise;
}

