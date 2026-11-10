import dns from "node:dns/promises";
import net from "node:net";

/**
 * Enterprise SSRF (Server-Side Request Forgery) Prevention Filter
 *
 * Enforces strict validation of all user-supplied webhook URLs:
 * 1. Requires valid HTTP/HTTPS schemes (HTTPS strictly required in production).
 * 2. Rejects loopback, link-local, RFC-1918 private, and cloud metadata IPs.
 * 3. Resolves domain names to IP addresses via DNS before connecting to prevent DNS rebinding.
 */

// Cloud metadata endpoints (AWS, GCP, Azure, OpenStack, etc.)
const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.internal",
  "instance-data",
  "169.254.169.254",
  "fd00:ec2::254",
]);

/**
 * Check if an IPv4 address is in a reserved or private range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private-Use RFC 1918)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-Local / Cloud Metadata)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private-Use RFC 1918)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private-Use RFC 1918)
  if (a === 192 && b === 168) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved)
  if (a >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (ip === "255.255.255.255") return true;

  return false;
}

/**
 * Check if an IPv6 address is private, loopback, or link-local.
 */
function isPrivateIPv6(ip: string): boolean {
  const clean = ip.toLowerCase();
  if (clean === "::1" || clean === "::") return true;
  // fc00::/7 (Unique local address)
  if (clean.startsWith("fc") || clean.startsWith("fd")) return true;
  // fe80::/10 (Link-local address)
  if (clean.startsWith("fe80:") || clean.startsWith("fe9") || clean.startsWith("fea") || clean.startsWith("feb")) return true;
  return false;
}

export interface SsrfValidationResult {
  valid: boolean;
  reason?: string;
  resolvedIp?: string;
}

/**
 * Validates a target URL against SSRF vulnerabilities.
 */
export async function validateSsrfSafeUrl(targetUrl: string): Promise<SsrfValidationResult> {
  try {
    const url = new URL(targetUrl);

    // 1. Protocol check
    const isDev = process.env.NODE_ENV !== "production";
    if (url.protocol !== "https:" && (isDev ? url.protocol !== "http:" : true)) {
      return { valid: false, reason: "Webhook URL must use secure HTTPS protocol." };
    }

    const hostname = url.hostname.toLowerCase();

    // 2. Reject known blocked metadata hostnames
    if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith(".internal") || hostname.endsWith(".local")) {
      return { valid: false, reason: "Access to internal or cloud metadata endpoints is prohibited." };
    }

    // 3. Reject ports commonly used for internal services
    const port = url.port ? parseInt(url.port, 10) : (url.protocol === "https:" ? 443 : 80);
    const blockedPorts = [22, 25, 2375, 2376, 5432, 6379, 27017, 9200];
    if (blockedPorts.includes(port)) {
      return { valid: false, reason: `Port ${port} is restricted for security.` };
    }

    // 4. If hostname is directly an IP address
    if (net.isIP(hostname)) {
      if (net.isIPv4(hostname) && isPrivateIPv4(hostname)) {
        return { valid: false, reason: `Private IPv4 address ${hostname} is blocked.` };
      }
      if (net.isIPv6(hostname) && isPrivateIPv6(hostname)) {
        return { valid: false, reason: `Private IPv6 address ${hostname} is blocked.` };
      }
      return { valid: true, resolvedIp: hostname };
    }

    // 5. DNS Resolution check (prevent DNS rebinding)
    try {
      const records = await dns.lookup(hostname, { all: true });
      for (const rec of records) {
        if (rec.family === 4 && isPrivateIPv4(rec.address)) {
          return { valid: false, reason: `Hostname resolves to private IPv4 address ${rec.address}.` };
        }
        if (rec.family === 6 && isPrivateIPv6(rec.address)) {
          return { valid: false, reason: `Hostname resolves to private IPv6 address ${rec.address}.` };
        }
      }
      return { valid: true, resolvedIp: records[0]?.address };
    } catch {
      return { valid: false, reason: "Hostname could not be resolved via DNS." };
    }
  } catch {
    return { valid: false, reason: "Malformed URL." };
  }
}
