import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number }
) => Promise<Buffer>;

// scrypt parameters (OWASP-recommended for interactive logins)
const PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEYLEN = 64;

/**
 * Hash a password with scrypt (salted, constant-time verifiable).
 * Stored format:  scrypt$N$r$p$<salt-hex>$<hash-hex>
 * Never store plaintext. Firebase-provisioned accounts get an unusable
 * random hash so password sign-in stays impossible for them.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(plain.normalize("NFKC"), salt, KEYLEN, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/**
 * Verify a password against a stored hash.
 * - Modern rows: scrypt constant-time comparison.
 * - Legacy rows (plaintext from the early demo build): plain comparison,
 *   reported via `needsUpgrade` so the caller can transparently re-hash.
 */
export async function verifyPassword(
  plain: string,
  stored: string
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  if (stored.startsWith("scrypt$")) {
    const parts = stored.split("$");
    if (parts.length !== 6) return { valid: false, needsUpgrade: false };
    const [, N, r, p, saltHex, hashHex] = parts;
    try {
      const expected = Buffer.from(hashHex, "hex");
      const actual = await scrypt(plain.normalize("NFKC"), Buffer.from(saltHex, "hex"), expected.length, {
        N: Number(N),
        r: Number(r),
        p: Number(p),
      });
      return { valid: actual.length === expected.length && timingSafeEqual(actual, expected), needsUpgrade: false };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }
  // Legacy plaintext row — verify, then let the caller upgrade it.
  return { valid: plain === stored, needsUpgrade: true };
}

/** Unusable password hash for Federated (Firebase) accounts. */
export async function unusablePassword(): Promise<string> {
  return hashPassword(randomBytes(32).toString("hex"));
}
