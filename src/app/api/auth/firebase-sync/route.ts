import { NextRequest, NextResponse } from "next/server";
import { createVerify } from "crypto";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken } from "@/lib/brandshield/server/auth";
import { ensureSeed } from "@/lib/brandshield/server/seed";
import { jsonError } from "@/lib/brandshield/server/json";
import { unusablePassword } from "@/lib/brandshield/server/password";
import { provisionWorkspace } from "@/lib/brandshield/server/workspace";

/**
 * Real Firebase Authentication sync endpoint.
 *
 * When a Firebase project is connected (FIREBASE_PROJECT_ID env var set),
 * the client signs in with the Firebase SDK (`signInWithEmailAndPassword`)
 * and posts the resulting **ID token** here. This endpoint verifies the
 * token cryptographically — RS256 signature against Google's public x509
 * certificates, plus `aud` / `iss` / `exp` claims — then provisions a
 * local user record and an httpOnly session cookie.
 *
 * No firebase-admin service account is required: verification uses only
 * public metadata, so it works in any environment.
 */

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

interface FirebaseIdTokenClaims {
  aud: string;
  iss: string;
  sub: string; // uid
  email?: string;
  email_verified?: boolean;
  name?: string;
  exp: number;
  iat: number;
}

let certCache: { certs: Record<string, string>; fetchedAt: number } | null = null;

async function getPublicCerts(): Promise<Record<string, string>> {
  if (certCache && Date.now() - certCache.fetchedAt < 60 * 60 * 1000) return certCache.certs;
  const res = await fetch(CERT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Unable to fetch Google public certificates");
  const certs = (await res.json()) as Record<string, string>;
  certCache = { certs, fetchedAt: Date.now() };
  return certs;
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function verifySignature(jwt: string, certs: Record<string, string>): boolean {
  const [headerB64, payloadB64, sigB64] = jwt.split(".");
  if (!headerB64 || !payloadB64 || !sigB64) return false;
  const header = JSON.parse(base64UrlDecode(headerB64)) as { alg: string; kid: string };
  if (header.alg !== "RS256" || !header.kid || !certs[header.kid]) return false;
  const cert = certs[header.kid];
  const signature = Buffer.from(sigB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);
  return verifier.verify({ key: cert }, signature);
}

export async function POST(req: NextRequest) {
  try {
    if (!FIREBASE_PROJECT_ID) {
      return NextResponse.json(
        {
          error:
            "Firebase Auth is not connected on the server. Set FIREBASE_PROJECT_ID (and the NEXT_PUBLIC_FIREBASE_* web config) to enable it.",
          code: "firebase/not-configured",
        },
        { status: 501 }
      );
    }

    const { idToken } = (await req.json()) as { idToken?: string };
    if (!idToken || typeof idToken !== "string" || idToken.split(".").length !== 3) {
      return NextResponse.json({ error: "A Firebase ID token is required.", code: "auth/invalid-id-token" }, { status: 400 });
    }

    const certs = await getPublicCerts();
    const valid = verifySignature(idToken, certs);
    if (!valid) {
      return NextResponse.json({ error: "ID token signature verification failed.", code: "auth/invalid-id-token" }, { status: 401 });
    }

    const claims = JSON.parse(base64UrlDecode(idToken.split(".")[1])) as FirebaseIdTokenClaims;
    const now = Math.floor(Date.now() / 1000);
    if (claims.aud !== FIREBASE_PROJECT_ID || claims.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
      return NextResponse.json({ error: "ID token was not issued for this Firebase project.", code: "auth/project-mismatch" }, { status: 401 });
    }
    if (!claims.exp || claims.exp < now) {
      return NextResponse.json({ error: "ID token has expired. Please sign in again.", code: "auth/id-token-expired" }, { status: 401 });
    }
    if (!claims.email) {
      return NextResponse.json({ error: "ID token has no email claim.", code: "auth/invalid-id-token" }, { status: 400 });
    }

    await ensureSeed();
    const email = claims.email.toLowerCase().trim();
    let user = await db.user.findUnique({ where: { email }, include: { organization: true } });

    if (!user) {
      // Firebase-authenticated newcomers get their OWN workspace (same
      // contract as email/password sign-up) — never the shared demo org.
      const provisioned = await provisionWorkspace({
        email,
        name: claims.name ?? email.split("@")[0],
        passwordHash: await unusablePassword(), // federated login only
        role: "creator",
        department: null,
        organizationName: null,
      });
      await db.user.update({ where: { id: provisioned.user.id }, data: { firebaseUid: claims.sub } });
      user = {
        ...provisioned.user,
        password: provisioned.user.password,
        organization: provisioned.organization,
      };
    } else if (user.firebaseUid !== claims.sub) {
      // Pre-existing workspace account (created before Firebase was
      // connected, or via local-mode sign-up) signing in through Firebase
      // for the first time — link the verified Firebase UID so the record
      // is fully federated, and keep the existing workspace untouched.
      await db.user.update({ where: { id: user.id }, data: { firebaseUid: claims.sub } });
      user = { ...user, firebaseUid: claims.sub };
    }

    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      avatarColor: user.avatarColor,
      orgId: user.orgId,
      orgName: user.organization.name,
      orgSlug: user.organization.slug,
      zeroDataRetention: user.organization.zeroDataRetention,
    });
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    return jsonError(e);
  }
}
