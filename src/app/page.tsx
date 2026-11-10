"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSession, hasAuthHint } from "@/lib/brandshield/client";
import { useLang } from "@/lib/brandshield/i18n";
import "@/lib/brandshield/i18n/dict-dash-a";
import { useUIStore } from "@/lib/brandshield/store";
import { Providers } from "@/components/brandshield/providers";
import { Landing } from "@/components/brandshield/landing";
import { AuthView } from "@/components/brandshield/auth-view";
import {
  Shell,
  DemoTour,
  RoleDashboard,
  CopilotView,
  KnowledgeView,
  ScannerView,
  FindingsView,
  ApprovalsView,
  AnalyticsView,
  BillingView,
  SettingsView,
  warmSignedInChunks,
} from "@/components/brandshield/lazy-views";

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

  // Hydration-safe session gate via useSyncExternalStore: server snapshot and
  // first client render are `false` (landing paints instantly, matching SSR);
  // returning users then flip to the branded gate while /api/auth/me resolves
  // AND the signed-in chunks warm up in parallel. Anonymous visitors never see
  // the gate at all.
  const gate = useSyncExternalStore(
    () => () => {},
    () => hasAuthHint(),
    () => false
  );
  useEffect(() => {
    // Warm the signed-in chunks for returning users (gate) and fresh SPA
    // sign-ins (data) — idempotent, import() returns the cached promise.
    if (gate || session.data) warmSignedInChunks();
  }, [gate, session.data]);

  if (session.isLoading && gate) {
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
    case "copilot": return <CopilotView />;
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
