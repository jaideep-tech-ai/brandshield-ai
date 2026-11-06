import { NextResponse } from "next/server";
import { isDemoWorkspaceEnabled } from "@/lib/brandshield/server/seed";

/**
 * Public endpoint: tells the sign-in screen whether the one-click demo
 * personas exist in this deployment. Production deployments start with
 * DEMO_SEED=off → the UI hides the persona buttons and shows only the
 * real email/password + create-account flows.
 */
export async function GET() {
  return NextResponse.json({ demoEnabled: isDemoWorkspaceEnabled() });
}
