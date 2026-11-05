import { NextResponse } from "next/server";

export function jsonError(e: unknown) {
  const err = e as { status?: number; message?: string; code?: string; upgradeTier?: string };
  const status = typeof err?.status === "number" ? err.status : 500;
  if (status !== 500) {
    return NextResponse.json(
      { error: err.message ?? "Request failed", code: err.code, upgradeTier: err.upgradeTier },
      { status }
    );
  }
  console.error("[BrandShield API]", e);
  return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
}
