import { createHmac, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { validateSsrfSafeUrl } from "./ssrf";

export interface WebhookEventPayload<T = unknown> {
  id: string;
  event: string;
  timestamp: string;
  organizationId: string;
  data: T;
}

/**
 * Generate a new cryptographically secure webhook secret
 */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

/**
 * Sign payload using HMAC-SHA256 according to standard enterprise webhook schemes
 * (similar to Stripe / GitHub webhooks).
 * Header format: `t={timestamp},v1={signature}`
 */
export function signWebhookPayload(payloadString: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const signedData = `${timestamp}.${payloadString}`;
  const signature = createHmac("sha256", secret).update(signedData).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verify incoming webhook signature with timestamp drift protection (default 5 minutes).
 */
export function verifyWebhookSignature(
  header: string,
  payloadString: string,
  secret: string,
  toleranceSeconds = 300
): { valid: boolean; reason?: string } {
  try {
    const parts = header.split(",");
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));

    if (!tPart || !v1Part) {
      return { valid: false, reason: "Malformed signature header. Missing t= or v1=" };
    }

    const timestamp = parseInt(tPart.slice(2), 10);
    const signature = v1Part.slice(3);

    if (isNaN(timestamp)) {
      return { valid: false, reason: "Invalid timestamp in signature header." };
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return { valid: false, reason: "Webhook signature timestamp outside acceptable tolerance (replay prevention)." };
    }

    const expected = createHmac("sha256", secret).update(`${timestamp}.${payloadString}`).digest("hex");
    if (expected !== signature) {
      return { valid: false, reason: "Signature mismatch." };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : "Verification error" };
  }
}

/**
 * Dispatches an event to all subscribed active webhook endpoints for a given organization.
 */
export async function dispatchWebhookEvent<T = unknown>(
  orgId: string,
  event: string,
  data: T
): Promise<{ dispatchedCount: number }> {
  try {
    const endpoints = await db.webhookEndpoint.findMany({
      where: { orgId, active: true },
    });

    const relevant = endpoints.filter((ep) => {
      try {
        const eventsList: string[] = JSON.parse(ep.events);
        return eventsList.includes("*") || eventsList.includes(event);
      } catch {
        return false;
      }
    });

    if (relevant.length === 0) {
      return { dispatchedCount: 0 };
    }

    const eventPayload: WebhookEventPayload<T> = {
      id: `evt_${randomBytes(12).toString("hex")}`,
      event,
      timestamp: new Date().toISOString(),
      organizationId: orgId,
      data,
    };

    const payloadString = JSON.stringify(eventPayload);

    for (const ep of relevant) {
      await deliverWebhook(ep, event, payloadString);
    }

    return { dispatchedCount: relevant.length };
  } catch (error) {
    console.error("[dispatchWebhookEvent] Error:", error);
    return { dispatchedCount: 0 };
  }
}

/**
 * Delivers a single webhook with SSRF verification, signature generation, and logging.
 */
export async function deliverWebhook(
  endpoint: { id: string; orgId: string; url: string; secret: string },
  event: string,
  payloadString: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  const ssrfCheck = await validateSsrfSafeUrl(endpoint.url);
  if (!ssrfCheck.valid) {
    await db.webhookDeliveryLog.create({
      data: {
        orgId: endpoint.orgId,
        endpointId: endpoint.id,
        event,
        payload: payloadString,
        responseStatus: 400,
        responseBody: `SSRF Violation: ${ssrfCheck.reason}`,
        status: "failed",
        executionMs: 0,
      },
    });
    return { success: false, error: ssrfCheck.reason };
  }

  const signature = signWebhookPayload(payloadString, endpoint.secret);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "BrandShield-Webhook/1.1",
        "x-brandshield-event": event,
        "x-brandshield-signature": signature,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const duration = Date.now() - startTime;
    const bodyText = await res.text().catch(() => "");

    const success = res.ok;
    await db.webhookDeliveryLog.create({
      data: {
        orgId: endpoint.orgId,
        endpointId: endpoint.id,
        event,
        payload: payloadString,
        responseStatus: res.status,
        responseBody: bodyText.slice(0, 1000), // Cap logged body
        status: success ? "success" : "failed",
        executionMs: duration,
      },
    });

    return { success, status: res.status };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "Connection failed";

    await db.webhookDeliveryLog.create({
      data: {
        orgId: endpoint.orgId,
        endpointId: endpoint.id,
        event,
        payload: payloadString,
        responseStatus: 0,
        responseBody: errorMsg,
        status: "failed",
        executionMs: duration,
      },
    });

    return { success: false, error: errorMsg };
  }
}
