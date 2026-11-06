"use client";

import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "@/lib/brandshield/client";
import { useLang } from "@/lib/brandshield/i18n";
import "@/lib/brandshield/i18n/dict-dash-a";
import { useUIStore } from "@/lib/brandshield/store";
import { Providers } from "@/components/brandshield/providers";
import { Landing } from "@/components/brandshield/landing";
import { AuthView } from "@/components/brandshield/auth-view";
import { DemoTour } from "@/components/brandshield/demo-tour";
import { Shell } from "@/components/brandshield/shell";
import { RoleDashboard } from "@/components/brandshield/dashboards/role-dashboard";
import { KnowledgeView } from "@/components/brandshield/knowledge-view";
import { ScannerView } from "@/components/brandshield/scanner-view";
import { FindingsView } from "@/components/brandshield/findings-view";
import { ApprovalsView } from "@/components/brandshield/approvals-view";
import { AnalyticsView } from "@/components/brandshield/analytics-view";
import { BillingView } from "@/components/brandshield/billing-view";
import { SettingsView } from "@/components/brandshield/settings-view";

export default function Home() {
  return (
    <Providers>
      <App />
    </Providers>
  );
}

function App() {
  const session = useSession();
  const { t } = useLang();
  const [showAuth, setShowAuth] = useState(false);

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAFAF9]">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-600/20"
        >
          <ShieldCheck className="h-7 w-7 text-white" />
        </motion.div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("app.loading")}
        </div>
      </div>
    );
  }

  const user = session.data;

  if (!user) {
    return showAuth ? (
      <AuthView onBack={() => setShowAuth(false)} />
    ) : (
      <Landing onGetStarted={() => setShowAuth(true)} />
    );
  }

  return (
    <ShellWithTour>
      <ViewRouter />
    </ShellWithTour>
  );
}

function ShellWithTour({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const user = session.data;
  return (
    <>
      <Shell>{children}</Shell>
      {user && <DemoTour role={user.role} />}
    </>
  );
}

function ViewRouter() {
  const view = useUIStore((s) => s.view);
  switch (view) {
    case "knowledge": return <KnowledgeView />;
    case "scanner": return <ScannerView />;
    case "findings": return <FindingsView />;
    case "approvals": return <ApprovalsView />;
    case "analytics": return <AnalyticsView />;
    case "billing": return <BillingView />;
    case "settings": return <SettingsView />;
    default: return <RoleDashboard />;
  }
}
