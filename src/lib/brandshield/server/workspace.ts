import { createHash } from "crypto";
import { db } from "@/lib/db";
import type { Organization, Subscription, User } from "@prisma/client";

// ─── Workspace provisioning (consistency-critical) ───────────────────────────
//
// Every new signup gets its OWN isolated workspace (organization), exactly the
// way Slack/Notion/Linear do. A thousand signups ⇒ a thousand independent
// workspaces — nobody else's team list, submissions or audit trail is ever
// polluted, and the seeded demo workspace (Nimbus Labs) stays pristine.
//
// Consistency guarantees:
//   1. Org + subscription + owner are created in ONE interactive transaction —
//      a crash can never leave an org without its subscription or a user
//      without an org.
//   2. Workspace slugs are collision-checked against the DB (unique index is
//      the final backstop) with deterministic-retry, so concurrent signups
//      with the same company name cannot conflict.
//   3. Emails are globally unique (@unique on User.email) and always stored
//      lower-cased; the register route rejects duplicates with 409.

const AVATAR_COLORS = ["#0F766E", "#B45309", "#7C2D12", "#4D7C0F", "#6D28D9", "#BE185D"];

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace"
  );
}

function shortFingerprint(seed: string): string {
  return createHash("sha256").update(seed).digest("hex").slice(0, 6);
}

export interface ProvisionInput {
  email: string; // already normalized (lower-case, trimmed)
  name: string;
  passwordHash: string;
  role: string;
  department: string | null;
  organizationName?: string | null;
}

export interface ProvisionedAccount {
  user: User;
  organization: Organization;
  subscription: Subscription;
}

/**
 * Create a complete, self-consistent workspace for a brand-new user.
 * Throws on any failure AFTER rolling back the whole transaction — callers
 * only ever see all-or-nothing results.
 */
export async function provisionWorkspace(input: ProvisionInput): Promise<ProvisionedAccount> {
  const baseSlug = slugify(input.organizationName || `${input.name} workspace`);
  const fingerprint = shortFingerprint(`${input.email}:${Date.now()}:${Math.random()}`);

  return db.$transaction(async (tx) => {
    // Unique slug: deterministic base + 6-char fingerprint; verify against DB.
    let slug = `${baseSlug}-${fingerprint}`;
    while (await tx.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${shortFingerprint(`${slug}:${Math.random()}`)}`;
    }

    const organization = await tx.organization.create({
      data: {
        name: (input.organizationName?.trim() || `${input.name.split(" ")[0]}'s Workspace`).slice(0, 60),
        slug,
        zeroDataRetention: true,
      },
    });

    const subscription = await tx.subscription.create({
      data: {
        orgId: organization.id,
        tier: "starter",
        status: "active",
        scanLimit: 50,
        scansUsed: 0,
        seats: 5,
        priceCents: 4900,
      },
    });

    const user = await tx.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: input.passwordHash,
        role: input.role,
        department: input.department,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        orgId: organization.id,
      },
    });

    // Genesis audit entry for the new workspace (hash chain anchor).
    const contentHash = createHash("sha256")
      .update(
        JSON.stringify({
          prevHash: "GENESIS",
          action: "WORKSPACE_CREATED",
          submissionId: null,
          actorId: user.id,
          details: { organizationId: organization.id, slug, ownerEmail: user.email },
          ts: Date.now(),
        })
      )
      .digest("hex");
    await tx.auditLog.create({
      data: {
        orgId: organization.id,
        submissionId: null,
        actorId: user.id,
        action: "WORKSPACE_CREATED",
        details: JSON.stringify({ organizationId: organization.id, slug, ownerEmail: user.email }),
        contentHash,
        prevHash: "GENESIS",
      },
    });

    return { user, organization, subscription };
  });
}
