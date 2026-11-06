"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/brandshield/client";
import { useLang } from "@/lib/brandshield/i18n";
import "@/lib/brandshield/i18n/dict-dash-a";
import { CreatorDashboard } from "./creator-dashboard";
import { ReviewerDashboard } from "./reviewer-dashboard";
import { ContractorDashboard } from "./contractor-dashboard";
import { AdminDashboard } from "./admin-dashboard";

// ─── Role dashboard router ───────────────────────────────────────────────────
// Switches on the session role so every persona lands on a genuinely
// different workspace instead of one shared dashboard.

export function RoleDashboard() {
  const session = useSession();
  const { t } = useLang();

  if (session.isLoading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-sm">{t("app.loadingWorkspace")}</p>
      </div>
    );
  }

  const user = session.data;
  if (!user) return null; // signed-out state is handled by the shell

  if (user.role === "reviewer") return <ReviewerDashboard />;
  if (user.role === "contractor") return <ContractorDashboard />;
  if (user.role === "admin") return <AdminDashboard />;
  return <CreatorDashboard />; // creator + fallback
}
