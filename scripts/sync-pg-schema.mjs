// ─── Generate prisma/schema.postgres.prisma from the canonical schema ────────
//
// Single source of truth: prisma/schema.prisma (SQLite — used by the sandbox
// preview). This script derives the PostgreSQL twin for Supabase/Neon/RDS so
// the two schemas can NEVER drift apart.
//
//   bun run db:sync:pg      # regenerate after every schema.prisma edit
//   bun run db:pg:push      # push to your Supabase PostgreSQL
//
// Prisma pins the provider at generate-time, so production deployments that
// point DATABASE_URL at Supabase simply build with the postgres schema:
//   prisma generate --schema prisma/schema.postgres.prisma

import { readFileSync, writeFileSync } from "node:fs";

const SRC = "prisma/schema.prisma";
const OUT = "prisma/schema.postgres.prisma";

let schema = readFileSync(SRC, "utf8");

// Swap the datasource provider (SQLite → PostgreSQL). Everything else —
// models, uniques, indexes, cascade rules — is identical and fully
// PostgreSQL-compatible.
schema = schema.replace(
  /datasource\s+db\s*\{[^}]*\}/,
  `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`
);

// Header note on the generated file.
schema =
  `// ⚠️ GENERATED FILE — do not edit by hand.
// Generated from prisma/schema.prisma by scripts/sync-pg-schema.mjs (bun run db:sync:pg).
// Target: Supabase PostgreSQL (also compatible with Neon / RDS / any Postgres 14+).

` + schema;

writeFileSync(OUT, schema, "utf8");
console.log(`✔ Wrote ${OUT} (provider: postgresql, directUrl for migrations)`);
console.log("  Next: set DATABASE_URL + DIRECT_URL in .env, then run: bun run db:pg:push");
