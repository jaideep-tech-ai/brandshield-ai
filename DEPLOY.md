# 🚀 BrandShield AI — Vercel Deployment Guide (Hinglish)

Poori step-by-step guide: **Supabase (PostgreSQL) + Vercel** pe production
deployment, bilkul smooth aur lag-free. Total time: ~15 minute.

---

## Kyun Supabase chahiye? (Important)

Vercel ke serverless functions ka filesystem **ephemeral** hota hai — SQLite
file har request pe vanish ho jati hai. Isliye production ke liye **PostgreSQL
(Supabase free tier)** zaroori hai. Project mein PostgreSQL schema pehle se
ready hai (`prisma/schema.postgres.prisma`) — aapko sirf connect karna hai.

---

## Step 1 — Supabase database banao (5 min)

1. [supabase.com](https://supabase.com) → **New project** (free tier kaafi hai)
2. Project ban jaye toh: **Project Settings → Database → Connection string → URI**
3. **Do URLs copy karo:**
   - **Connection pooler** (port `6543`) — ye `DATABASE_URL` banega (app runtime)
   - **Direct** (port `5432`) — ye `DIRECT_URL` banega (migrations)
4. Pooler URL ke end mein ye add karo:
   `?pgbouncer=true&connection_limit=10`

```
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
```

> 💡 `connection_limit=10` + pgbouncer = 1000+ concurrent users bhi handle
> ho jate hain bina connection exhaustion ke (serverless pe must-have).

---

## Step 2 — Schema Supabase mein push karo (2 min)

Apne machine pe (repo root mein):

```bash
# .env mein upar wale DATABASE_URL + DIRECT_URL daal kar:
bun install
bun run db:sync:pg      # sqlite schema se postgres twin generate hota hai
bun run db:pg:push      # tables + indexes Supabase mein ban jate hain
```

Verify: Supabase Dashboard → Table Editor → `Organization`, `User`,
`Submission`… sab dikhna chahiye.

---

## Step 3 — Vercel pe deploy karo (5 min)

1. Code ko GitHub pe push karo:
   ```bash
   git add -A && git commit -m "Production ready" && git push origin main
   ```
2. [vercel.com](https://vercel.com) → **Add New → Project** → repo import karo
3. Framework auto-detect: **Next.js** ✓ (build command `next build`)
4. **Environment Variables** section mein ye add karo:

   | Key | Value | Notes |
   |---|---|---|
   | `DATABASE_URL` | Step 1 ka **pooler URL (6543)** | app runtime |
   | `DIRECT_URL` | Step 1 ka **direct URL (5432)** | migrations |
   | `SESSION_SECRET` | `openssl rand -hex 32` ka output | **zaroor set karo!** |
   | `DEMO_SEED` | `off` | real-data production (demo personas hidden) |
   | `ZAI_BASE_URL` | OpenAI-compatible endpoint | *optional* — neeche dekho |
   | `ZAI_API_KEY` | uska API key | *optional* |

5. **Deploy** dabao — 2-3 minute mein live! 🎉

> ⚠️ `SESSION_SECRET` set na karo toh default dev secret use hota hai —
> production mein kabhi mat chhodna.

---

## Step 4 — AI features (optional, recommended)

Scan pipeline **bina AI ke bhi kabhi crash nahi hota** — Stage 1
(deterministic checks) + WCAG contrast math hamesha chalte hain. LLM stages
(claim verification, tone scoring, vision audit) ke liye koi bhi
OpenAI-compatible API env vars mein do:

```
ZAI_BASE_URL="https://api.openai.com/v1"     # ya koi bhi compatible endpoint
ZAI_API_KEY="sk-..."
```

Nahi diye toh: scans complete hote hain, AI stages neutral fallback return
karti hain. App kabhi 500 nahi marega.

---

## Production behavior (kya alag hai)

| Feature | Sandbox demo | Vercel production (`DEMO_SEED=off`) |
|---|---|---|
| Demo persona buttons | dikhte hain | **hidden** (`/api/auth/demo-status`) |
| Pehli login pe demo data | auto-seed | **kuch nahi banta** — 100% real data |
| Real users | — | **Create account** tab se signup (atomic org provisioning) |
| Session cookie | httpOnly | httpOnly + **secure** (HTTPS-only) |
| DB query logs | verbose | errors-only (fast) |

---

## Smoothness checklist (lag-free ke liye kya kiya gaya hai)

- ✅ **Connection pooling**: pgbouncer + `connection_limit` — serverless pe
  DB connections exhaust nahi hote
- ✅ **Lightweight list API**: `/api/submissions` ab heavy base64 `imageData`
  return NAHI karta (multi-MB payloads → KBs). Banner images cached binary
  endpoint se aati hain: `/api/submissions/[id]/image` (24h browser cache)
- ✅ **DB indexes**: org/status/author/updatedAt pe indexes schema mein hain
- ✅ **Prisma engine**: `rhel-openssl-3.0.x` binaryTarget — Vercel runtime
  ke liye pre-bundled, cold start pe engine download nahi hota
- ✅ **`maxDuration = 60`**: scan route Hobby plan limit ke andar
- ✅ **Prisma generate**: `postinstall` hook — har deploy pe client fresh
- ✅ **Production logging off**: query logs sirf dev mein

---

## Deploy ke baad verify (2 min)

1. Apni Vercel URL kholo → landing page dikhe
2. **Get Started → Create account** → real org + user banao
3. Pre-Flight Scanner → copy/banner scan chalao
4. Findings → review → approve — poora flow
5. Supabase → Table Editor → data real-time mein aa raha hoga ✓

---

## Common problems (troubleshooting)

| Problem | Fix |
|---|---|
| `Query engine library not found` | `bun run db:sync:pg` dobara chalao (binaryTargets fix ho jayega) + redeploy |
| `P1001: Can't reach database` | `DATABASE_URL` mein pooler URL (6543) hai? Password mein special chars hain toh URL-encode karo |
| Login pe 500 | `SESSION_SECRET` env var set hai? `DIRECT_URL` bhi set karo |
| Build fail: prisma | Vercel → Settings → Environment Variables mein `DIRECT_URL` add karo (postinstall generate ke liye chahiye) |
| Scan slow (>60s timeout) | `ZAI_BASE_URL`/`ZAI_API_KEY` slow endpoint? Fast provider try karo — deterministic results toh phir bhi milte hain |

---

## Self-hosting (optional, Vercel ke alawa)

```bash
NEXT_OUTPUT_STANDALONE=1 bun run build:standalone
bun run start          # .next/standalone/server.js on :3000
```
