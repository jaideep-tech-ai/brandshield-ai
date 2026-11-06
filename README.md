# 🛡️ BrandShield AI

**Catch brand drift before it ships.** A multi-modal brand governance and pre-publishing compliance platform that scans marketing content for factual hallucinations, brand-voice drift, visual non-compliance and accessibility issues — with an explainable, auditable review pipeline.

🌐 **Live**: https://brandshield-ai-five.vercel.app

---

## ✨ What it does

Marketing content fails at the last mile — unverified claims, off-brand tone, non-compliant visuals and manual review bottlenecks. BrandShield AI inserts a governed pipeline **between the draft and the public**:

| Stage | Capability |
|-------|------------|
| **1. Repository Ingestion** | Brand knowledge base, rules and tokens ingested & tokenized |
| **2. Multi-Modal Pre-Flight Analysis** | Text + visual scans for claims, tone, visual & accessibility drift |
| **3. Explainable Findings** | Every finding cites the exact rule and source document |
| **4. Guided Remediation** | Suggested fixes, one-click re-scan, collaborative sign-off |
| **5. Cryptographic Audit Trail** | SHA-256 tamper-evident chain of every review decision |

### Key features
- 🎭 **4 role-based dashboards** — Content Creator, Brand/Legal Reviewer, External Agency, CMO/Brand Admin
- 🔐 **Firebase Authentication** (email/password) with a local-mode fallback that mirrors Firebase semantics — zero UI changes when switching
- 🌐 **Bilingual UI** — English ⇄ हिन्दी (902 i18n keys, fully type-checked)
- 🧭 **Role-specific guided product tour**
- ♿ **WCAG-conscious, responsive** — mobile bottom-nav to desktop sidebar
- 📊 **Drift analytics** — rule ambiguity and brand drift dashboards

## 🧱 Tech stack

- **Next.js 16** (App Router) + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (New York) + **Framer Motion** + **Lucide icons**
- **Prisma ORM** — SQLite (local) / PostgreSQL (production, schema-aware generate)
- **Firebase Auth** — RS256 ID-token verification server-side (no service account needed)
- **Zustand** (client state) · **TanStack Query** (server state)
- **Vercel** (hosting) + **Neon** (managed Postgres)

## 🚀 Getting started

```bash
# 1. Install
bun install   # or npm install

# 2. Configure environment (see .env.example)
cp .env.example .env.local

# 3. Push the database schema and start
bun run db:push
bun run dev
```

Open http://localhost:3000 — the app boots in **local auth mode** until Firebase env vars are provided.

### Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite file URL locally, Postgres URL in production |
| `SESSION_SECRET` | Secret for signing session cookies |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web config (activates Firebase mode) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app id |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `FIREBASE_PROJECT_ID` | Server-side project id for ID-token verification |

> Firebase mode activates automatically when the `NEXT_PUBLIC_FIREBASE_*` variables exist — otherwise the app runs on the built-in local auth system with identical semantics.

## 📦 Deployment

See [DEPLOY.md](./DEPLOY.md) for the full production runbook (Vercel + Neon Postgres, schema-aware Prisma generate, framework preset troubleshooting).

## 🗂️ Project structure

```
src/
├── app/                    # App Router pages & API routes
│   └── api/auth/           # login, register, firebase-sync (RS256 verify)
├── components/brandshield/ # dashboards, scanner, findings, tour, auth
├── lib/brandshield/        # server logic: auth, workspace, seed, i18n
└── ...
prisma/
├── schema.prisma           # SQLite (local dev)
└── schema.postgres.prisma  # PostgreSQL (production)
```

## 🔒 Security notes

- Passwords hashed with bcrypt; federated users get unusable password hashes
- Firebase ID tokens verified server-side (signature + `aud`/`iss`/`exp`) before any session is issued
- httpOnly, SameSite=Lax session cookies
- Legacy accounts created before Firebase are auto-linked on first federated sign-in — workspaces are preserved

---

© 2026 BrandShield AI
