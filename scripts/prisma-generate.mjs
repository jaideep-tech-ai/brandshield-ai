// ─── Schema-aware `prisma generate` (runs on every `npm install`) ────────────
//
// Why: Prisma pins the client provider at GENERATE time. This repo keeps two
// schemas — SQLite (sandbox preview) and PostgreSQL (production, derived from
// the canonical one via `bun run db:sync:pg`). A plain `prisma generate` on
// Vercel would build the SQLITE client while DATABASE_URL points at Postgres
// → instant runtime crash ("the URL must start with protocol file:").
//
// Fix: pick the schema from the environment at install time.
//   DATABASE_URL starts with postgres… → generate the PostgreSQL client
//   anything else (or unset)          → generate the SQLite client (sandbox)
//
// Requires zero extra config on Vercel: env vars are injected before install.

import { execSync } from "node:child_process";

const url = (process.env.DATABASE_URL ?? "").trim();
const isPostgres = /^postgres(ql)?:\/\//i.test(url);

const schema = isPostgres
  ? "prisma/schema.postgres.prisma"
  : "prisma/schema.prisma";

console.log(
  `[prisma-generate] DATABASE_URL ${url ? "is set" : "is unset"} → using ${schema}`
);

execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" });
