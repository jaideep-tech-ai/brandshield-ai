import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Authenticated Encryption at Rest (AES-256-GCM)
 *
 * Implements NIST SP 800-38D compliant authenticated encryption with associated data:
 * - 256-bit symmetric key derived via SHA-256 from the master secret
 * - 96-bit (12-byte) cryptographically secure random Initialization Vector (IV) per encryption
 * - 128-bit (16-byte) GCM authentication tag for tamper detection
 * - Format: `${ivHex}:${authTagHex}:${ciphertextHex}`
 */

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "brandshield_master_encryption_secret_min32chars";
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypts sensitive credentials (such as OAuth refresh tokens and access tokens)
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${ciphertext}`;
}

/**
 * Decrypts and verifies ciphertext using AES-256-GCM authenticated tag.
 * Throws if tampered with or corrupted.
 */
export function decryptToken(encryptedString: string): string {
  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format. Expected iv:authTag:ciphertext.");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
