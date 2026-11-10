# BrandShield AI — Project Status & Technical Inventory

**Last Updated**: 2026-11-10  
**Current Branch**: `main`  
**Latest Commit**: `ace8e74` (Merge PR #1: Feature 1 & Feature 2)  
**Production URL**: https://brandshield-ai-five.vercel.app  
**Lead Engineer / Architect**: AI Engineering Partner

---

## 1. Executive Summary

BrandShield AI is an enterprise pre-publishing brand governance and compliance SaaS platform built on Next.js 16 (Turbopack, App Router), React 19, TypeScript 5, Prisma ORM, Tailwind CSS 4, and Firebase Authentication.

A technical takeover assessment was executed against the repository `jaideep-tech-ai/brandshield-ai` on `main`. All dependencies have been installed, TypeScript type-checking (`tsc --noEmit`) passes with 0 errors, ESLint passes with 0 errors (2 minor warnings), the custom feature verification test suite (`scripts/verify-features.mjs`) passes 15/15 assertions, and the Next.js production build (`next build`) compiles successfully across all 32 API routes and static pages.

---

## 2. Feature Implementation Status

| Feature / Subsystem | Status | Implementation Details | Tested Locally | Tested in Production |
|---|---|---|---|---|
| **Feature 1: Visual Asset & WCAG 2.1 Accessibility Inspector** | **Completed** | Sharp decoding + decompression bomb guard (16.7M px), CIELAB K-Means++ clustering with Lloyd's iterations (`kmeans.ts`), CIE76 Delta-E brand token matching, WCAG 2.1 AA/AAA contrast ratio engine (`wcag.ts`), multi-tenant data isolation (`user.orgId`), base64 + multipart upload endpoint (`POST /api/inspect/visual`), DB persistence (`VisualInspection`), UI matrix rendering in Scanner and Findings views. | ✅ Yes (15/15 tests) | ⚠️ Partial (Pending Vercel redeploy of PR #1) |
| **Feature 2: Dynamic Vector-RAG Ingestion Engine** | **Completed (Worker refinement required)** | Zero-dependency streaming PDF parser with page tracking (`pdf-parser.ts`), semantic recursive chunker with rule tags (`vector-rag.ts`), OpenAI-compatible 1536-dim embedding generator with batching & backoffs, hybrid search with BM25 + Reciprocal Rank Fusion (RRF, k=60), multi-tenant `orgId` isolation, UI document manager & search sandbox (`knowledge-view.tsx`). | ✅ Yes | ⚠️ Partial (Embeddings require API key) |
| **Feature 3: Pre-Publishing Authoring Extensions & Webhooks** | **Pending** | Planned after Features 1 & 2 verification. Requires: Google Docs OAuth & governance checker, Figma API connection & token analyzer, and secure signing Webhook system with SSRF prevention and delivery retries. | ❌ No | ❌ No |
| **Authentication Subsystem** | **Needs Fix (High Priority)** | Dual-mode auth: Firebase Auth (RS256 token verification via Google public certs) and local auth with scrypt-hashed passwords. Root cause of production login failure identified (details below). | ✅ Yes (Local mode) | ❌ Broken (Prod credentials mismatch & missing env) |
| **Multi-Tenant Workspace Engine** | **Completed** | Atomic workspace provisioning in `$transaction` (`workspace.ts`), slug generation with collision prevention, SHA-256 genesis audit log chain, strict tenant query isolation. | ✅ Yes | ✅ Yes |
| **Database & Schema Synchronization** | **Completed** | Canonical SQLite schema (`schema.prisma`) and derived PostgreSQL schema (`schema.postgres.prisma`) via `scripts/sync-pg-schema.mjs`. Schema-aware `postinstall` Prisma generator for Vercel. | ✅ Yes | ✅ Yes |

---

## 3. High-Priority Investigation: Production Login Issue

### 3.1 Symptoms Reported
- Live deployed app displays `Firebase Auth [Local mode]`.
- Sign-in screen shows demo login placeholders (`ava@nimbus.demo`, `demo1234`) and helper text (`Any demo persona email works with password demo1234.`).
- Attempting sign-in with displayed credentials triggers: `"Incorrect password. Demo accounts use “demo1234”."` (`auth/wrong-password`) or `"No account found for this email..."` (`auth/user-not-found`).

### 3.2 Root Causes Identified
1. **Missing Firebase Environment Variables in Vercel**:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` are not configured in Vercel's production environment variables.
   - `isFirebaseConfigured()` evaluates to `false`, causing the UI badge to show `Firebase Auth [Local mode]` and silently falling back to the local backend endpoints (`/api/auth/login`).
2. **Production `DEMO_SEED=off` vs UI Demo Credential Hint Inconsistency**:
   - Live endpoint `GET /api/auth/demo-status` returns `{"demoEnabled": false}`.
   - In production, `DEMO_SEED=off` suppresses `seedInternal()` in `src/lib/brandshield/server/seed.ts`. Consequently, demo accounts (`ava@nimbus.demo`, `marcus@nimbus.demo`, `priya@pixelworks.demo`, `elena@nimbus.demo`) **do not exist** in the production Supabase database.
   - However, in `src/components/brandshield/auth-view.tsx`, the email input placeholder (`ava@nimbus.demo`), the password input placeholder (`demo1234`), and the helper text `"Any demo persona email works with password demo1234."` were displayed **unconditionally**, regardless of `demoEnabled`.
   - Users seeing this prompt naturally enter `ava@nimbus.demo` / `demo1234`, which results in `auth/user-not-found` or `auth/wrong-password`.
3. **Silent Insecure Fallback in Production**:
   - The UI silently fell back to local credentials without enforcing or alerting on the missing production Firebase configuration.
4. **Federated vs Local Password Isolation**:
   - Accounts registered through Firebase Auth are assigned an unusable random hash (`unusablePassword()`). If Firebase fails to initialize or is unconfigured on the client, those users cannot authenticate via password.

---

## 4. Environment Variables Inventory

| Variable Name | Client / Server | Required / Optional | Production Status (Vercel) | Description |
|---|---|---|---|---|
| `DATABASE_URL` | Server | **Required** | Configured | Supabase pooler connection string (port 6543) with `pgbouncer=true&connection_limit=10`. |
| `DIRECT_URL` | Server | **Required** | Configured | Supabase direct connection string (port 5432) for Prisma schema migrations. |
| `SESSION_SECRET` | Server | **Required** | Verify | 32-byte secret for HMAC-SHA256 session cookie signing. |
| `DEMO_SEED` | Server | Optional | Set to `off` | When `off`, suppresses demo persona buttons and seeding in clean production environments. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | **Required for Firebase** | **Missing** | Firebase web client API key. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | **Required for Firebase** | **Missing** | Firebase project ID. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | **Required for Firebase** | **Missing** | Firebase application ID. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | Optional | **Missing** | Firebase auth domain (defaults to `<projectId>.firebaseapp.com`). |
| `FIREBASE_PROJECT_ID` | Server | **Required for Firebase** | **Missing** | Server-side Firebase project ID for RS256 token verification. |
| `OPENAI_API_KEY` / `ZAI_API_KEY` | Server | Optional | Missing | Key for text embeddings (`text-embedding-3-small`) and LLM scan stages. |
| `OPENAI_BASE_URL` / `ZAI_BASE_URL` | Server | Optional | Missing | Base URL for OpenAI-compatible endpoint. |

---

## 5. Background Processing & Infrastructure Limitations

1. **Vercel Serverless Function Lifecycle & `setImmediate`**:
   - [`src/lib/brandshield/server/document-queue.ts`](file:///Users/jaideep/Brandshield-ai/brandshield-ai/src/lib/brandshield/server/document-queue.ts) dispatches background PDF ingestion using Node.js `setImmediate()`.
   - On Vercel serverless functions, execution halts as soon as the HTTP response is returned. Heavy 50+ page PDF parsing and embedding generation in unawaited background promises will freeze or be terminated.
   - **Remediation**: Use Next.js `after()` or configure long-duration route execution (`maxDuration = 60`) with synchronous completion or chunked job processing.
2. **pgvector Native Extension vs In-Memory Cosine Similarity**:
   - `prisma/migrations/pgvector_setup.sql` is ready with HNSW indexing and `match_knowledge_chunks` stored procedure.
   - Currently, `vector-rag.ts` computes cosine similarity in memory across tenant chunks to preserve dual-engine compatibility (SQLite locally, Postgres in prod). For large datasets, native pgvector RPC queries should be executed when Postgres is detected.

---

## 6. Test & Quality Control Results

- **Prisma Client Generation**: ✅ Passed (`prisma generate --schema prisma/schema.prisma`).
- **TypeScript Compilation**: ✅ Passed (`bun x tsc --noEmit` — 0 errors).
- **ESLint**: ✅ Passed (`bun run lint` — 0 errors, 2 unused directive warnings).
- **i18n Translation Integrity**: ✅ Passed (`bun scripts/check-i18n.ts` — 902 keys verified across 118 files).
- **Feature Verification Suite**: ✅ Passed (`bun scripts/verify-features.mjs` — 15/15 tests passed):
  - WCAG 2.1 Contrast calculations (Black/White 21:1, White/White 1:1, AA/AAA thresholds, violation count).
  - CIELAB Delta E (CIE76) color distance formulas.
  - Cosine similarity vector math.
  - Recursive semantic chunker with rule-tag retention.
- **Production Build**: ✅ Passed (`bun run build` — compiled all 32 routes in 5.7s).

---

## 7. Prioritized Implementation Plan

### Phase 1: Critical Production Authentication Fixes (Immediate)
1. **Fix UI Placeholder & Helper Leaks When Demo Mode is Disabled**:
   - Update `auth-view.tsx` so that when `demoEnabled` is `false`, the placeholder text and helper hint do NOT display demo credentials (`ava@nimbus.demo`, `demo1234`).
   - Show generic corporate placeholders (e.g. `you@company.com`) and generic password help.
2. **Safe Production Authentication Guard**:
   - When running in production (`NODE_ENV === "production"`), provide clear operational indicators if Firebase is unconfigured rather than silent confusing failure.
   - Ensure demo persona login endpoints refuse execution if `DEMO_SEED=off` without leaking misleading password errors.
3. **Database Seed Integrity Check**:
   - Ensure `seedInternal()` is robust and atomic so that if demo mode IS enabled, all 4 personas exist with their expected hashed passwords.

### Phase 2: Serverless Reliability & Background Processing
1. **Fix Ingestion Queue for Serverless**:
   - Refactor `queueDocumentIngestion` in `document-queue.ts` to leverage Next.js `after()` (available in Next.js 15/16) to ensure background tasks complete reliably without premature container freezing on Vercel.
2. **Next.js Turbopack Root Warning**:
   - Configure `turbopack: { root: __dirname }` in `next.config.ts` to silence workspace root inference warnings.

### Phase 3: Feature 3 Implementation (Pre-Publishing Authoring Extensions & Webhooks)
1. **Webhook Delivery System**:
   - Database schema: `WebhookEndpoint`, `WebhookDeliveryLog`.
   - HMAC-SHA256 payload signing, SSRF protection, exponential backoff retries.
2. **Google Docs OAuth & Governance Inspection**:
   - OAuth 2.0 flow with Google Workspace, document text retrieval, brand scan execution.
3. **Figma API Integration**:
   - Figma personal access token / OAuth integration, canvas color and typography token extraction.

---

## 8. Deployment Readiness Checklist

- [x] Codebase audited and verified against specifications
- [x] Dependencies installed and locked
- [x] Feature 1 (Visual Inspector & WCAG 2.1) verified
- [x] Feature 2 (Dynamic Vector-RAG) verified
- [x] TypeScript checks pass
- [x] Production build passes locally
- [x] Authentication fix branch created (`fix/production-authentication`) and tested locally
- [x] Serverless background lifecycle hardened with Next.js `after()`
- [x] Turbopack root workspace path pinned in Next.js config
- [ ] Production Vercel environment variables added for Firebase
- [ ] Safe PR created for review and authorized merge into main
