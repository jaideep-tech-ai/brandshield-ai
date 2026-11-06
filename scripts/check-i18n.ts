/**
 * i18n audit — exact version.
 * Imports the REAL registry (index.tsx + all dict files via side effects),
 * then verifies every literal t("key") in src/** resolves for en AND hi.
 * Run: bun run scripts/check-i18n.ts
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Real registry with every dictionary registered.
import { getRegistry } from "../src/lib/brandshield/i18n/index";
import "../src/lib/brandshield/i18n/dict-common";
import "../src/lib/brandshield/i18n/dict-landing";
import "../src/lib/brandshield/i18n/dict-auth";
import "../src/lib/brandshield/i18n/dict-knowledge";
import "../src/lib/brandshield/i18n/dict-scanner";
import "../src/lib/brandshield/i18n/dict-findings";
import "../src/lib/brandshield/i18n/dict-approvals";
import "../src/lib/brandshield/i18n/dict-analytics";
import "../src/lib/brandshield/i18n/dict-billing";
import "../src/lib/brandshield/i18n/dict-settings";
import "../src/lib/brandshield/i18n/dict-shell";
import "../src/lib/brandshield/i18n/dict-tour";
import "../src/lib/brandshield/i18n/dict-dash-a";
import "../src/lib/brandshield/i18n/dict-dash-b";

const registry = getRegistry();
const enKeys = new Set(Object.keys(registry.en));
const hiKeys = new Set(Object.keys(registry.hi));

// en/hi key-set parity across dictionaries
const onlyEn = [...enKeys].filter((k) => !hiKeys.has(k));
const onlyHi = [...hiKeys].filter((k) => !enKeys.has(k));
if (onlyEn.length || onlyHi.length) {
  console.log("⚠️  en/hi key-set mismatch:", { onlyEn, onlyHi });
}

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(f) && !f.startsWith("dict-") && !p.includes("i18n/index")) out.push(p);
  }
  return out;
}

const roots = [
  join(import.meta.dir, "../src/components"),
  join(import.meta.dir, "../src/app"),
  join(import.meta.dir, "../src/lib/brandshield"),
];
const files = roots.flatMap((r) => walk(r));

let missing = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const callRe = /\bt\(\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = callRe.exec(src))) {
    const key = m[1];
    if (key === "") continue;
    if (!enKeys.has(key) || !hiKeys.has(key)) {
      missing++;
      console.log(`MISSING [${file.split("/").pop()}] "${key}" en=${enKeys.has(key)} hi=${hiKeys.has(key)}`);
    }
  }
}

console.log(
  missing === 0
    ? `✅ All t() keys resolve exactly (registry: ${enKeys.size} keys, scanned ${files.length} files)`
    : `❌ ${missing} missing key references`
);
