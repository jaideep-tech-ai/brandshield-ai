"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// ─── Signed-in code splitting ────────────────────────────────────────────────
// The landing + auth screen ship in the initial bundle so the first paint and
// the "Get Started" click are instant. Everything behind sign-in is split
// into lazy chunks. The loaders are exported so both the app shell and the
// auth screen can warm them during idle time — by the time the user finishes
// typing their credentials, the dashboard chunks are already in the cache.

export const loadShell = () => import("@/components/brandshield/shell").then((m) => ({ default: m.Shell }));
export const loadDemoTour = () =>
  import("@/components/brandshield/demo-tour").then((m) => ({ default: m.DemoTour }));
export const loadRoleDashboard = () =>
  import("@/components/brandshield/dashboards/role-dashboard").then((m) => ({ default: m.RoleDashboard }));
export const loadCopilot = () =>
  import("@/components/brandshield/copilot-view").then((m) => ({ default: m.CopilotView }));
export const loadKnowledge = () =>
  import("@/components/brandshield/knowledge-view").then((m) => ({ default: m.KnowledgeView }));
export const loadScanner = () =>
  import("@/components/brandshield/scanner-view").then((m) => ({ default: m.ScannerView }));
export const loadFindings = () =>
  import("@/components/brandshield/findings-view").then((m) => ({ default: m.FindingsView }));
export const loadApprovals = () =>
  import("@/components/brandshield/approvals-view").then((m) => ({ default: m.ApprovalsView }));
export const loadAnalytics = () =>
  import("@/components/brandshield/analytics-view").then((m) => ({ default: m.AnalyticsView }));
export const loadIntegrations = () =>
  import("@/components/brandshield/integrations-view").then((m) => ({ default: m.IntegrationsView }));
export const loadBilling = () =>
  import("@/components/brandshield/billing-view").then((m) => ({ default: m.BillingView }));
export const loadSettings = () =>
  import("@/components/brandshield/settings-view").then((m) => ({ default: m.SettingsView }));

function ChunkFallback({ full }: { full?: boolean }) {
  return (
    <div
      className={
        full
          ? "flex min-h-screen items-center justify-center bg-[#FAFAF9]"
          : "flex min-h-[50vh] items-center justify-center"
      }
    >
      <Loader2 className="size-6 animate-spin text-teal-600" />
    </div>
  );
}

export const Shell = dynamic(loadShell, { ssr: false, loading: () => <ChunkFallback full /> });
export const RoleDashboard = dynamic(loadRoleDashboard, { ssr: false, loading: () => <ChunkFallback /> });
export const CopilotView = dynamic(loadCopilot, { ssr: false, loading: () => <ChunkFallback /> });
export const KnowledgeView = dynamic(loadKnowledge, { ssr: false, loading: () => <ChunkFallback /> });
export const ScannerView = dynamic(loadScanner, { ssr: false, loading: () => <ChunkFallback /> });
export const FindingsView = dynamic(loadFindings, { ssr: false, loading: () => <ChunkFallback /> });
export const ApprovalsView = dynamic(loadApprovals, { ssr: false, loading: () => <ChunkFallback /> });
export const AnalyticsView = dynamic(loadAnalytics, { ssr: false, loading: () => <ChunkFallback /> });
export const IntegrationsView = dynamic(loadIntegrations, { ssr: false, loading: () => <ChunkFallback /> });
export const BillingView = dynamic(loadBilling, { ssr: false, loading: () => <ChunkFallback /> });
export const SettingsView = dynamic(loadSettings, { ssr: false, loading: () => <ChunkFallback /> });
// Overlay component — mount silently once the chunk arrives.
export const DemoTour = dynamic(loadDemoTour, { ssr: false });
export { GuidedTasksCard } from "@/components/brandshield/demo-tour";

/** Download the signed-in chunks ahead of time (idempotent — import() caches). */
export function warmSignedInChunks() {
  void loadShell();
  void loadDemoTour();
  void loadRoleDashboard();
  void loadCopilot();
  void loadKnowledge();
  void loadScanner();
  void loadFindings();
  void loadApprovals();
  void loadAnalytics();
  void loadBilling();
  void loadSettings();
}

/** Idle-time warm-up used by the auth screen: dashboard chunks download while
 *  the user types their credentials, so first sign-in needs zero waiting. */
export function warmSignedInChunksWhenIdle() {
  if (typeof window === "undefined") return;
  const warm = () => warmSignedInChunks();
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => void }).requestIdleCallback(warm, { timeout: 2500 });
  } else {
    setTimeout(warm, 1200);
  }
}
