# BrandShield AI × Supabase PostgreSQL — Setup Guide / सेटअप गाइड

BrandShield ka data layer **fully PostgreSQL-ready** hai. Sandbox preview SQLite par chalta hai
(zero config), aur production Supabase par ek command se switch ho jata hai — koi code change nahi.

The data layer is **fully PostgreSQL-ready**. The sandbox preview runs on SQLite (zero config);
production switches to Supabase with one command — no code changes.

---

## Consistency guarantees (already built-in) / डेटा कंसिस्टेंसी गारंटी

| Guarantee | Kaise ensure hota hai |
|---|---|
| **Duplicate accounts impossible** | `User.email @unique` (DB-level) + lower-case normalization + 409 error |
| **1000 signups? Koi problem nahi** | Har signup apna **alag workspace** (organization) paye — kisi ka team list polluted nahi hota |
| **No partial data (no orphans)** | Org + subscription + user ek hi **atomic transaction** mein bante hain |
| **No orphan children on delete** | Har relation par `onDelete: Cascade` |
| **Unlimited-signup abuse blocked** | Register: 8/hour/IP → 429. Login: 15/15-min/IP → 429 |
| **Passwords safe** | Salted **scrypt** hashes (plaintext kabhi store nahi) |
| **Audit trail tamper-proof** | SHA-256 hash chain per org (`bun run db:cleanup` verify/repair karta hai) |
| **Real data only** | Har screen DB se aata hai — `/api/system/database` live counts + integrity prove karta hai |

---

## Step 1 — Supabase project banao / Create the project

1. https://supabase.com → **New project**
2. Region apne users ke paas choose karo (e.g. Mumbai `ap-south-1`)
3. DB password set karo (save kar lo)

## Step 2 — Connection strings lo / Grab connection strings

**Project Settings → Database → Connection string → URI**

- **App runtime** → **Connection pooler** (port `6543`, Transaction mode):
  ```
  postgresql://postgres.<project-ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10
  ```
- **Migrations / push** → **Direct connection** (port `5432`):
  ```
  postgresql://postgres.<project-ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
  ```

## Step 3 — `.env` update karo

```env
DATABASE_URL="postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres"
SESSION_SECRET="<openssl rand -hex 32>"
```

## Step 4 — PostgreSQL schema push karo

```bash
bun run db:sync:pg      # schema.postgres.prisma regenerate (canonical se — no drift)
bun run db:pg:generate  # Prisma Client PostgreSQL provider ke saath
bun run db:pg:push      # tables/indexes/uniques Supabase mein create
```

Bas! First API call par demo workspace (Nimbus Labs + 4 personas + brand repository)
**automatically seed** ho jata hai — `ensureSeed()` idempotent hai.

## Step 5 — Verify / सत्यापन

```bash
curl -s localhost:3000/api/system/database | jq
# → { provider: "postgresql", supplier: "Supabase", integrity: { duplicateEmails: 0, auditChainValid: true, ... } }
```

Ya admin se sign-in karke **Settings → Database Health** card dekho — live counts, zero
duplicates, verified hash chain, sab real-time DB se.

---

## Rollback to SQLite (sandbox/preview) / वापस SQLite

```env
DATABASE_URL="file:/home/z/my-project/db/custom.db"
```
```bash
bun run db:generate && bun run db:push
```

## Maintenance commands

| Command | Kaam |
|---|---|
| `bun run db:cleanup` | Hygiene pass: duplicates purge, emails lower-case, plaintext passwords re-hash, audit chain verify+repair — full report print |
| `bun run db:sync:pg` | Postgres schema ko canonical schema se sync |
| `bun run db:pg:studio` | Supabase data ka Prisma Studio |

---

## Firebase Auth (optional) / फायरबेस ऑथ

Firebase Auth fully supported hai — client Firebase SDK se sign-in karke ID token
`/api/auth/firebase-sync` ko POST hota hai (RS256 signature Google public certs ke against
verify hota hai). Firebase users ko bhi **apna workspace** milta hai. Bina Firebase ke bhi
email/password flow poora kaam karta hai (same error codes: `auth/email-already-in-use`,
`auth/wrong-password`, `auth/too-many-requests` …).
