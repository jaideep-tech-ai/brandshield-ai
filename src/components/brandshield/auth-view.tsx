"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  FileSearch,
  Flame,
  Fingerprint,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoLogin, useLogin, useRegister } from "@/lib/brandshield/client";
import { firebaseEmailSignIn, firebaseEmailSignUp, isFirebaseConfigured } from "@/lib/brandshield/firebase";
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

const ROLE_OPTIONS: { value: Role; label: string; hint: string }[] = [
  { value: "creator", label: "Content Creator", hint: "Draft, scan, fix, submit" },
  { value: "reviewer", label: "Brand / Legal Reviewer", hint: "Approve or request changes" },
  { value: "contractor", label: "External Agency", hint: "Sandboxed pre-checks" },
  { value: "admin", label: "CMO / Brand Admin", hint: "Knowledge, billing, analytics" },
];

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

type Mode = "signin" | "signup";

// ─── Auth view ───────────────────────────────────────────────────────────────

export function AuthView({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("creator");
  const [department, setDepartment] = useState("");

  const demo = useDemoLogin();
  const login = useLogin();
  const register = useRegister();
  const busy = login.isPending || register.isPending || demo.isPending;
  const formError = (mode === "signin" ? login.error : register.error)?.message ?? null;
  const firebaseConnected = isFirebaseConfigured();

  function handleDemo(personaEmail: string, personaName: string) {
    demo.mutate(personaEmail, {
      onSuccess: (user) => toast.success(`Signed in as ${user.name || personaName}`),
    });
  }

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const finish = () => toast.success("Signed in successfully");
    if (firebaseConnected) {
      firebaseEmailSignIn(email.trim(), password)
        .then(() => window.location.reload())
        .catch((err: Error) => toast.error(err.message));
      return;
    }
    login.mutate({ email: email.trim(), password }, { onSuccess: finish });
  }

  function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      toast.error("Passwords don't match — please retype them.");
      return;
    }
    if (firebaseConnected) {
      firebaseEmailSignUp({ email: email.trim(), password, name: name.trim() })
        .then(() => window.location.reload())
        .catch((err: Error) => toast.error(err.message));
      return;
    }
    register.mutate(
      { name: name.trim(), email: email.trim(), password, role, department: department.trim() || undefined },
      {
        onSuccess: (user) => {
          toast.success(`Welcome aboard, ${user.name.split(" ")[0]}! Your guided tour is about to start.`);
        },
      }
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

        {/* ── Auth panel ── */}
        <div className="min-w-0 p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-2 h-8 gap-1.5 px-2 text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to overview</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <Badge
              title={
                firebaseConnected
                  ? "Connected to your Firebase project — email/password auth runs through Firebase Authentication."
                  : "Running in Firebase-compatible local mode. Add NEXT_PUBLIC_FIREBASE_* config to connect a real Firebase project — no UI changes needed."
              }
              className={cn(
                "gap-1 border font-medium",
                firebaseConnected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              )}
            >
              <Flame className="size-3 text-orange-500" />
              <span className="hidden sm:inline">Firebase Auth</span>
              <span className="sm:hidden">Firebase</span>
              <span className={cn("ml-0.5 whitespace-nowrap rounded px-1 py-px text-[10px] font-semibold", firebaseConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")}>
                {firebaseConnected ? "Connected" : "Local mode"}
              </span>
            </Badge>
          </div>

          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
            {mode === "signin" ? "Sign in to BrandShield" : "Create your BrandShield account"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "signin"
              ? "Email + password, Firebase-style — or jump in with a demo persona."
              : "Email + password, Firebase-style. New teammates join the Nimbus Labs workspace with data pre-loaded."}
          </p>

          {/* Mode tabs */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Authentication mode">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "relative rounded-lg py-2 text-sm font-medium transition-colors",
                  mode === m ? "text-teal-800" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {mode === m && (
                  <motion.span
                    layoutId="auth-tab-pill"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm"
                    transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
                  />
                )}
                <span className="relative">{m === "signin" ? "Sign in" : "Create account"}</span>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <AnimatePresence mode="wait" initial={false}>
              {mode === "signin" ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Demo personas */}
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
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
                              className={cn("px-1.5 py-0 text-[10px] font-medium", ROLE_BADGE[persona.role as Role])}
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

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-xs text-slate-400">or sign in with email</span>
                    </div>
                  </div>

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
                      <PasswordInput
                        id="auth-password"
                        autoComplete="current-password"
                        placeholder="demo1234"
                        value={password}
                        onChange={setPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                      />
                      <p className="text-xs text-slate-400">
                        Any demo persona email works with password{" "}
                        <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-600">
                          demo1234
                        </code>
                        .
                      </p>
                    </div>

                    {formError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        role="alert"
                        className="text-sm font-medium text-red-600"
                      >
                        {formError}
                      </motion.p>
                    )}

                    <Button
                      type="submit"
                      disabled={busy}
                      className="h-10 w-full rounded-xl bg-teal-700 text-white shadow-sm hover:bg-teal-800"
                    >
                      {login.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      {login.isPending ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                  noValidate
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name">Full name</Label>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="reg-name"
                          autoComplete="name"
                          placeholder="Jordan Lee"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-10 rounded-xl pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-dept">
                        Team / department <span className="font-normal text-slate-400">(optional)</span>
                      </Label>
                      <Input
                        id="reg-dept"
                        placeholder="Content Studio"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 rounded-xl pl-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password">Password</Label>
                      <PasswordInput
                        id="reg-password"
                        autoComplete="new-password"
                        placeholder="6+ characters"
                        value={password}
                        onChange={setPassword}
                        show={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm">Confirm password</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="reg-confirm"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Repeat it"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          className={cn(
                            "h-10 rounded-xl pl-9",
                            confirm && confirm !== password && "border-red-300 focus-visible:ring-red-200"
                          )}
                        />
                      </div>
                      {confirm && confirm !== password && (
                        <p className="text-xs font-medium text-red-600">Passwords don&apos;t match yet.</p>
                      )}
                    </div>
                  </div>

                  <fieldset className="space-y-1.5">
                    <legend className="text-sm font-medium text-slate-700">Choose your role</legend>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {ROLE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRole(option.value)}
                          aria-pressed={role === option.value}
                          className={cn(
                            "rounded-xl border p-3 text-left transition",
                            role === option.value
                              ? "border-teal-400 bg-teal-50/70 ring-1 ring-teal-300"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">{option.label}</span>
                            {role === option.value && <BadgeCheck className="size-4 text-teal-600" />}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">{option.hint}</p>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {formError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="text-sm font-medium text-red-600"
                    >
                      {formError}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    disabled={busy || (confirm.length > 0 && confirm !== password)}
                    className="h-10 w-full rounded-xl bg-teal-700 text-white shadow-sm hover:bg-teal-800"
                  >
                    {register.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    {register.isPending ? "Creating account…" : "Create account & start tour"}
                  </Button>
                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                    <Users className="size-3.5" />
                    You&apos;ll join the Nimbus Labs demo workspace — seeded with a real brand repository.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Password input with visibility toggle ───────────────────────────────────

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  show,
  onToggle,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <Input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl pl-9 pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
