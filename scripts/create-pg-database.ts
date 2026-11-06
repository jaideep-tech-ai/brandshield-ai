// Create an isolated `brandshield` database in the user's existing Neon project.
// The Neon store is shared with another app (travelbharat) which owns `neondb` —
// BrandShield MUST NOT share that database (table/migration collisions).
// Owner role on Neon has CREATEDB, so we provision a sibling database.
import { SQL } from "bun";

const DIRECT = process.env.NEON_DIRECT_URL!; // unpooled URL to neondb (admin target)
const sql = new SQL(DIRECT);

const exists = await sql`SELECT 1 FROM pg_database WHERE datname = 'brandshield'`;
if (exists.length > 0) {
  console.log("[pg] database 'brandshield' already exists — skip create");
} else {
  await sql.unsafe(`CREATE DATABASE brandshield OWNER neondb_owner`);
  console.log("[pg] database 'brandshield' created ✓");
}

const dbs = await sql`SELECT datname FROM pg_database WHERE datname NOT LIKE 'template%' ORDER BY datname`;
console.log("[pg] databases now:", dbs.map((d) => d.datname).join(", "));
await sql.end();
process.exit(0);
