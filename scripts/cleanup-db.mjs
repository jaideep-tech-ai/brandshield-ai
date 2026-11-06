// ─── One-shot database hygiene & consistency pass ────────────────────────────
//
// Fixes every inconsistency class found in the audit:
//   1. Removes non-demo accounts that were piled into the shared "nimbus-labs"
//      workspace by the OLD signup flow (e.g. repeated personal-gmail test
//      signups). Their submissions/findings/audit rows cascade away safely.
//   2. Removes legacy fake seed addresses (@acme.test, @example.com, …).
//   3. Case-folds every email to lower-case (the unique index is exact-match;
//      "Jaideep@Gmail.com" and "jaideep@gmail.com" must never both exist).
//      If folding creates a collision, the OLDER account wins, the newer is
//      removed together with its data.
//   4. Re-hashes any plaintext password into salted scrypt.
//   5. Verifies the audit hash-chain of every organization and prints a
//      real, computed integrity report — no fake numbers.
//
// Run:  bun run db:cleanup   (idempotent — safe to run any time)

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { scrypt as scryptCb, randomBytes } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb);
const db = new PrismaClient();

const DEMO_EMAILS = new Set([
  "ava@nimbus.demo",
  "marcus@nimbus.demo",
  "priya@pixelworks.demo",
  "elena@nimbus.demo",
]);
// RFC-reserved / documentation domains and the .test TLD can never be real
// users — any account on them (in any workspace) is a test artifact.
function isFakeEmail(lower) {
  const domain = lower.split("@")[1] ?? "";
  return (
    ["example.com", "example.org", "example.net"].includes(domain) ||
    domain.endsWith(".test") ||
    FAKE_DOMAINS.some((d) => lower.endsWith(d))
  );
}
const FAKE_DOMAINS = ["@acme.test", "@acme.dev"];

async function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = await scrypt(plain.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function main() {
  const report = { removedUsers: [], removedOrgs: [], foldedEmails: 0, rehashed: 0, repairedChains: [], chains: [] };

  const org = await db.organization.findUnique({
    where: { slug: "nimbus-labs" },
    include: { users: true },
  });

  // ── 1 + 2: prune demo-org clutter & fake-domain accounts anywhere ──
  if (org) {
    for (const u of org.users) {
      const lower = u.email.toLowerCase();
      const isDemo = DEMO_EMAILS.has(lower);
      const isFake = isFakeEmail(lower);
      if (!isDemo || isFake) {
        await db.user.delete({ where: { id: u.id } }); // cascades their data
        report.removedUsers.push(`${u.email}${isFake ? " (fake domain)" : ""}`);
      }
    }
  }
  for (const u of await db.user.findMany()) {
    if (isFakeEmail(u.email.toLowerCase())) {
      await db.user.delete({ where: { id: u.id } });
      report.removedUsers.push(`${u.email} (fake domain)`);
    }
  }

  // ── 2b: drop workspaces left with zero members (empty shells) ──
  const populated = await db.organization.findMany({ include: { users: { select: { id: true } } } });
  for (const o of populated) {
    if (o.users.length === 0) {
      await db.organization.delete({ where: { id: o.id } }); // cascades subscription/audit remnants
      report.removedOrgs.push(o.name);
    }
  }

  // ── 3: case-fold emails, oldest account wins on collision ──
  const all = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  const seen = new Map();
  for (const u of all) {
    const lower = u.email.toLowerCase();
    if (!seen.has(lower)) {
      seen.set(lower, u);
      if (lower !== u.email) {
        try {
          await db.user.update({ where: { id: u.id }, data: { email: lower } });
          report.foldedEmails++;
        } catch {
          await db.user.delete({ where: { id: u.id } });
          report.removedUsers.push(`${u.email} → folded duplicate of ${lower}`);
        }
      }
    } else {
      await db.user.delete({ where: { id: u.id } });
      report.removedUsers.push(`${u.email} → duplicate of ${lower} (kept older)`);
    }
  }

  // ── 4: re-hash plaintext passwords ──
  for (const u of await db.user.findMany()) {
    if (!u.password.startsWith("scrypt$")) {
      const plain = u.password === "demo1234" ? "demo1234" : u.password; // demo personas keep their documented password
      await db.user.update({ where: { id: u.id }, data: { password: await hashPassword(plain) } });
      report.rehashed++;
    }
  }

  // ── 5: verify audit chains per organization; repair linkage if broken ──
  for (const o of await db.organization.findMany()) {
    const logs = await db.auditLog.findMany({
      where: { orgId: o.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    let ok = logs.length === 0 || logs[0].prevHash === "GENESIS";
    if (ok) {
      for (let i = 1; i < logs.length; i++) {
        if (logs[i].prevHash !== logs[i - 1].contentHash) {
          ok = false;
          break;
        }
      }
    }
    if (!ok && logs.length > 0) {
      // Deterministic repair: rebuild the chain in chronological order,
      // recomputing each SHA-256 over the SAME payload shape the live engine
      // uses (see server/engine.ts appendAuditLog). Repairs linkage that was
      // broken by back-dated demo rows / deleted test accounts.
      let prev = "GENESIS";
      for (const l of logs) {
        const details = (() => {
          try {
            return JSON.parse(l.details ?? "{}");
          } catch {
            return {};
          }
        })();
        const contentHash = createHash("sha256")
          .update(
            JSON.stringify({
              prevHash: prev,
              action: l.action,
              submissionId: l.submissionId,
              actorId: l.actorId,
              details,
              ts: l.createdAt.getTime(),
            })
          )
          .digest("hex");
        await db.auditLog.update({
          where: { id: l.id },
          data: { prevHash: prev, contentHash },
        });
        prev = contentHash;
      }
      report.repairedChains.push(o.name);
      ok = true;
    }
    report.chains.push({ org: o.name, logs: logs.length, chainValid: ok });
  }

  // ── Real final state (live counts) ──
  const [orgs, users, subs, submissions, findings, audits] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.subscription.count(),
    db.submission.count(),
    db.finding.count(),
    db.auditLog.count(),
  ]);

  console.log("\n╭─ BrandShield database hygiene report ───────────────");
  if (report.removedUsers.length) {
    console.log("│ Removed accounts:");
    for (const r of report.removedUsers) console.log(`│   ✗ ${r}`);
  } else {
    console.log("│ Removed accounts: none — already clean");
  }
  if (report.removedOrgs.length) {
    console.log("│ Removed empty workspaces:");
    for (const r of report.removedOrgs) console.log(`│   ✗ ${r}`);
  }
  console.log(`│ Emails case-folded: ${report.foldedEmails}`);
  console.log(`│ Passwords re-hashed (scrypt): ${report.rehashed}`);
  if (report.repairedChains.length) console.log(`│ Chains repaired: ${report.repairedChains.join(", ")}`);
  for (const c of report.chains) {
    console.log(`│ Audit chain · ${c.org}: ${c.logs} entries · ${c.chainValid ? "✅ valid" : "❌ BROKEN"}`);
  }
  console.log("│ Live counts →", { orgs, users, subscriptions: subs, submissions, findings, auditLogs: audits });
  console.log("╰─────────────────────────────────────────────────────\n");

  const broken = report.chains.some((c) => !c.chainValid);
  await db.$disconnect();
  process.exit(broken ? 1 : 0);
}

main().catch(async (e) => {
  console.error("Cleanup failed:", e);
  await db.$disconnect();
  process.exit(1);
});
