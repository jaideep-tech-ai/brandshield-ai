"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  FileSearch,
  Fingerprint,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoLogin, useLogin } from "@/lib/brandshield/client";
import type { Role } from "@/lib/brandshield/types";
import { cn, initials } from "@/lib/brandshield/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// ─── Demo personas ───────────────────────────────────────────────────────────

const PERSONAS = [
  {
    email: "ava@nimbus.demo",
    name: "Ava Chen",
    role: "creator",
    title: "Content Creator",
    avatarColor: "#0F766E",
  },
  {
    email: "marcus@nimbus.demo",
    name: "Marcus Reed",
    role: "reviewer",
    title: "Brand Manager & Legal Reviewer",
    avatarColor: "#B45309",
  },
  {
    email: "priya@pixelworks.demo",
    name: "Priya Sharma",
    role: "contractor",
    title: "External Agency (PixelWorks)",
    avatarColor: "#7C2D12",
  },
  {
    email: "elena@nimbus.demo",
    name: "Elena Rodriguez",
    role: "admin",
    title: "CMO / Brand Admin",
    avatarColor: "#4D7C0F",
  },
] as const;

const ROLE_BADGE: Record<Role, string> = {
  creator: "border-teal-200 bg-teal-50 text-teal-700",
  reviewer: "border-amber-200 bg-amber-50 text-amber-700",
  contractor: "border-orange-200 bg-orange-50 text-orange-700",
  admin: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const TRUST_MARKERS = [
  {
    icon: FileSearch,
    title: "Explainable citations",
    desc: "Every finding cites the exact rule and source document.",
  },
  {
    icon: Fingerprint,
    title: "SHA-256 audit trail",
    desc: "Tamper-evident chain of every review decision.",
  },
  {
    icon: ShieldCheck,
    title: "Zero-data-retention",
    desc: "Your drafts are never used for model training.",
  },
] as const;

// ─── Auth view ───────────────────────────────────────────────────────────────

export function AuthView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const demo = useDemoLogin();
  const login = useLogin();

  function handleDemo(personaEmail: string, personaName: string) {
    demo.mutate(personaEmail, {
      onSuccess: (user) => toast.success(`Signed in as ${user.name || personaName}`),
    });
  }

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (login.isPending) return;
    login.mutate(
      { email: email.trim(), password },
      { onSuccess: (user) => toast.success(`Signed in as ${user.name}`) }
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-white to-teal-50 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-teal-900/5 lg:grid-cols-2"
      >
        {/* ── Brand panel (desktop) ── */}
        <aside className="hidden flex-col justify-between border-r border-slate-100 bg-gradient-to-br from-teal-50 via-white to-white p-8 lg:flex">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-700 to-emerald-600 text-white shadow-sm">
                <ShieldCheck className="size-5" />
              </span>
              <span className="text-base font-semibold tracking-tight text-slate-900">
                BrandShield <span className="text-teal-700">AI</span>
              </span>
            </div>
            <p className="mt-6 max-w-xs text-lg font-medium leading-snug text-slate-700">
              Catch brand drift before it ships — with proof, not vibes.
            </p>
          </div>

          <ul className="space-y-5">
            {TRUST_MARKERS.map((marker) => (
              <li key={marker.title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-white text-teal-700 shadow-sm">
                  <marker.icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{marker.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{marker.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-xs text-slate-400">
            Trusted by brand, legal & agency teams for pre-publishing governance.
          </p>
        </aside>

        {/* ── Sign-in panel ── */}
        <div className="p-5 sm:p-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ml-2 mb-4 gap-1.5 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
            Back to overview
          </Button>

          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Sign in to BrandShield</h1>
          <p className="mt-1 text-sm text-slate-500">
            One-click demo personas — each shows a different role&apos;s workspace.
          </p>

          {/* Demo personas */}
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
            One-click demo personas
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {PERSONAS.map((persona) => (
              <button
                key={persona.email}
                type="button"
                disabled={demo.isPending}
                onClick={() => handleDemo(persona.email, persona.name)}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-sm disabled:pointer-events-none disabled:opacity-60"
              >
                <Avatar className="size-10 border border-black/5">
                  <AvatarFallback
                    style={{ backgroundColor: persona.avatarColor }}
                    className="text-sm font-semibold text-white"
                  >
                    {initials(persona.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-slate-900">{persona.name}</span>
                    <Badge
                      variant="outline"
                      className={cn("px-1.5 py-0 text-[10px] font-medium", ROLE_BADGE[persona.role])}
                    >
                      {persona.role}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{persona.title}</p>
                </div>
                {demo.isPending && demo.variables === persona.email ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-teal-600" />
                ) : (
                  <ArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400">or sign in with email</span>
            </div>
          </div>

          {/* Email login */}
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="ava@nimbus.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="demo1234"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-xl pl-9"
                />
              </div>
              <p className="text-xs text-slate-400">
                Any demo persona email works with password{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-600">
                  demo1234
                </code>
                .
              </p>
            </div>

            {login.error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {login.error.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={login.isPending}
              className="h-10 w-full rounded-xl bg-teal-700 text-white shadow-sm hover:bg-teal-800"
            >
              {login.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
