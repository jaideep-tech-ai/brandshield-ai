"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CircleAlert,
  CircleCheck,
  FileSearch,
  FileWarning,
  Fingerprint,
  Hourglass,
  MessageSquareOff,
  Palette,
  PenLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TIER_META } from "@/lib/brandshield/types";
import { cn } from "@/lib/brandshield/utils";

// ─── Motion presets ──────────────────────────────────────────────────────────

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-700 to-emerald-600 text-white shadow-sm",
        className
      )}
    >
      <ShieldCheck className="size-4" />
    </span>
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const NAV_LINKS = [
  { label: "Problem", id: "problem" },
  { label: "Workflow", id: "workflow" },
  { label: "Personas", id: "personas" },
  { label: "Pricing", id: "pricing" },
] as const;

// ─── Data ────────────────────────────────────────────────────────────────────

const PROBLEMS = [
  {
    icon: FileWarning,
    title: "Factual Hallucinations & Unverified Claims",
    desc: "Confidently published statistics and product claims that no verified corporate document actually supports.",
  },
  {
    icon: MessageSquareOff,
    title: "Brand Voice Fragmentation",
    desc: "Every team writes in a different tone, eroding the consistent voice your audience was trained to trust.",
  },
  {
    icon: Palette,
    title: "Visual & Accessibility Non-Compliance",
    desc: "Off-palette colors, stretched logos, and WCAG contrast failures that slip through until after launch.",
  },
  {
    icon: Hourglass,
    title: "Manual Review Bottlenecks",
    desc: "Reviewers drown in doc threads and email chains, delaying launch dates by days for every asset.",
  },
] as const;

const WORKFLOW = [
  {
    title: "Repository Ingestion & Brand Tokenization",
    desc: "Connect guideline PDFs, style wikis, and approved visual tokens. BrandShield tokenizes them into a governed, versioned knowledge base.",
  },
  {
    title: "Multi-Modal Pre-Flight Analysis",
    desc: "Deterministic validators, RAG claim verification, and vision checks run on every text and banner draft before it moves an inch.",
  },
  {
    title: "Explainable Findings & Guided Remediation",
    desc: "Every flag cites the exact rule and source document, with one-click, tone-preserving rewrite suggestions.",
  },
  {
    title: "Collaborative Sign-Off & Cryptographic Audit Trail",
    desc: "Reviewers approve or request changes on a shared board; each decision is hashed into a tamper-evident SHA-256 chain.",
  },
  {
    title: "Brand Drift & Rule Ambiguity Analytics",
    desc: "Spot recurring drift patterns and rules that generate friction, then refine your governance where it matters most.",
  },
] as const;

const PERSONAS = [
  {
    icon: PenLine,
    title: "Content Creators & Copywriters",
    pain: "Waiting days for manual brand reviews kills creative momentum.",
    value: "Instant pre-flight scans with cited, actionable fixes — ship same-day.",
  },
  {
    icon: FileSearch,
    title: "Brand Managers & Legal Reviewers",
    pain: "Risky claims and tone drift hide inside endless doc threads.",
    value: "One approval board with explainable findings and a full audit trail.",
  },
  {
    icon: Building2,
    title: "External Agencies & Contractors",
    pain: "Contractors lack context on every client's brand rules.",
    value: "Sandboxed workspaces enforce client guidelines without exposing internals.",
  },
  {
    icon: TrendingUp,
    title: "CMO & Marketing Leadership",
    pain: "No quantified visibility into where brand equity leaks.",
    value: "Drift analytics measure risk and prove governance ROI to the board.",
  },
] as const;

const TIER_ORDER = ["starter", "growth", "enterprise"] as const;

// ─── Landing ─────────────────────────────────────────────────────────────────

export function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5"
            aria-label="BrandShield AI home"
          >
            <LogoMark />
            <span className="text-base font-semibold tracking-tight">
              BrandShield <span className="text-teal-700">AI</span>
            </span>
          </button>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Sections">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToId(link.id)}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <Button
            onClick={onGetStarted}
            className="rounded-lg bg-teal-700 text-white shadow-sm hover:bg-teal-800"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-teal-50/80 to-transparent"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-xl">
            <motion.div variants={fadeUp}>
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
              >
                <Sparkles className="size-3.5" />
                Pre-Publishing Brand Assurance
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Catch brand drift{" "}
              <span className="bg-gradient-to-r from-teal-700 to-emerald-500 bg-clip-text text-transparent">
                before it ships
              </span>
              .
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              An explainable copilot that prevents factual hallucinations, tone drift, visual
              non-compliance, and compliance violations before content publication — grounded in
              your verified corporate documents.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="h-12 rounded-xl bg-teal-700 px-6 text-white shadow-sm hover:bg-teal-800"
              >
                Start free in sandbox
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToId("workflow")}
                className="h-12 rounded-xl border-slate-300 px-6 text-slate-700 hover:border-teal-300 hover:text-teal-700"
              >
                See the 5-stage workflow
              </Button>
            </motion.div>
          </motion.div>

          {/* Stylized product mock */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-lg"
          >
            <div
              aria-hidden
              className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-teal-100 bg-teal-50/60"
            />
            <div className="relative z-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-teal-900/5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <LogoMark className="size-6 rounded-md" />
                  <span className="text-sm font-semibold text-slate-900">Pre-Flight Scan</span>
                </div>
                <Badge variant="outline" className="border-slate-200 text-xs text-slate-500">
                  Draft v3
                </Badge>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-600">
                <p>
                  &ldquo;Experience up to{" "}
                  <span className="rounded bg-red-50 px-1 font-medium text-red-700 underline decoration-red-500 decoration-wavy underline-offset-4">
                    340% guaranteed conversion uplift
                  </span>{" "}
                  with zero ramp-up time.&rdquo;
                </p>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                  <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                  Unverified claim — no supporting source in Brand Voice Guide §4.2
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  <span className="size-1.5 rounded-full bg-red-600" />
                  Critical Claim Mismatch
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Warning Tone Drift
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                  <span className="size-1.5 rounded-full bg-teal-600" />
                  Minor Style
                </span>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Compliance Score</span>
                  <span className="text-slate-900">62/100</span>
                </div>
                <Progress value={62} className="mt-2 h-2 bg-slate-100 [&>div]:bg-amber-500" />
              </div>
            </div>

            {/* Floating chips */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-2 -top-5 z-20 sm:-right-6"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-medium text-teal-700 shadow-md shadow-teal-900/5">
                <BadgeCheck className="size-3.5" />
                3 citations verified
              </span>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute -bottom-5 -left-2 z-20 sm:-left-6"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-md shadow-teal-900/5">
                <Fingerprint className="size-3.5 text-teal-600" />
                SHA-256 audit logged
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section id="problem" className="scroll-mt-24 border-t border-slate-100 bg-slate-50/50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">The problem</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Governance fails at the last mile
            </h2>
            <p className="mt-3 text-slate-600">
              Brand books are thorough — enforcement is not. Drift is discovered after publication,
              when the damage is already public.
            </p>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PROBLEMS.map((problem) => (
              <motion.div key={problem.title} variants={fadeUp} whileHover={{ y: -4 }}>
                <Card className="h-full rounded-2xl border-slate-200 py-0 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <problem.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold leading-snug text-slate-900">
                      {problem.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{problem.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <Reveal className="mt-10">
            <div className="grid gap-8 rounded-2xl border border-teal-100 bg-teal-50/60 px-6 py-8 sm:grid-cols-2 sm:px-10">
              <div className="text-center sm:text-left">
                <p className="text-4xl font-bold tracking-tight text-teal-700 sm:text-5xl">68%</p>
                <p className="mt-2 text-sm text-slate-600">
                  of enterprise teams publish off-brand or unverified claims
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-4xl font-bold tracking-tight text-teal-700 sm:text-5xl">4.2</p>
                <p className="mt-2 text-sm text-slate-600">
                  business days average review delay
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section id="workflow" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">The workflow</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Five stages between draft and public
            </h2>
            <p className="mt-3 text-slate-600">
              Every step is explainable, auditable, and grounded in documents you already trust.
            </p>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            {WORKFLOW.map((step, i) => (
              <motion.div key={step.title} variants={fadeUp} className="relative">
                {i < WORKFLOW.length - 1 && (
                  <ArrowRight
                    aria-hidden
                    className="absolute -right-4 top-7 z-10 hidden size-4 text-teal-400 lg:block"
                  />
                )}
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="flex size-9 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold leading-snug text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Personas ── */}
      <section id="personas" className="scroll-mt-24 border-t border-slate-100 bg-slate-50/50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Personas</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for everyone who touches the brand
            </h2>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PERSONAS.map((persona) => (
              <motion.div key={persona.title} variants={fadeUp} whileHover={{ y: -4 }}>
                <Card className="h-full rounded-2xl border-slate-200 py-0 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <persona.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold leading-snug text-slate-900">
                      {persona.title}
                    </h3>
                    <ul className="mt-3 space-y-2.5">
                      <li className="flex gap-2 text-sm leading-relaxed text-slate-600">
                        <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                        <span>{persona.pain}</span>
                      </li>
                      <li className="flex gap-2 text-sm leading-relaxed text-slate-600">
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-teal-600" />
                        <span>{persona.value}</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Pricing</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Governance that scales with you
            </h2>
            <p className="mt-3 text-slate-600">Start free in sandbox. Upgrade when the team does.</p>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto mt-12 grid max-w-5xl items-stretch gap-6 lg:grid-cols-3"
          >
            {TIER_ORDER.map((tier) => {
              const meta = TIER_META[tier];
              const highlighted = tier === "growth";
              return (
                <motion.div key={tier} variants={fadeUp} className="relative">
                  <Card
                    className={cn(
                      "flex h-full flex-col rounded-2xl p-1 shadow-sm",
                      highlighted && "border-teal-600 ring-2 ring-teal-600/20"
                    )}
                  >
                    {highlighted && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-700 px-3 py-1 text-xs text-white shadow-sm">
                        Most popular
                      </Badge>
                    )}
                    <CardContent className="flex h-full flex-col p-6">
                      <h3 className="text-sm font-semibold text-slate-900">{meta.name}</h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tight text-slate-900">
                          ${meta.price}
                        </span>
                        <span className="text-sm text-slate-500">/month</span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{meta.blurb}</p>
                      <ul className="mt-5 flex-1 space-y-2.5">
                        {meta.features.map((feature) => (
                          <li key={feature} className="flex gap-2 text-sm text-slate-600">
                            <Check className="mt-0.5 size-4 shrink-0 text-teal-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={onGetStarted}
                        className={cn(
                          "mt-6 w-full rounded-xl",
                          highlighted
                            ? "bg-teal-700 text-white hover:bg-teal-800"
                            : "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-700"
                        )}
                        variant={highlighted ? "default" : "outline"}
                      >
                        {tier === "enterprise" ? "Contact sales" : "Start free"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <Reveal className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 px-6 py-12 text-center text-white shadow-lg shadow-teal-900/10 sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ship on-brand, every time.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-teal-50 sm:text-base">
              Spin up a sandbox workspace in under a minute — no credit card required, no data
              retained, full audit trail included.
            </p>
            <Button
              onClick={onGetStarted}
              size="lg"
              className="mt-7 h-12 rounded-xl bg-white px-7 text-teal-700 shadow-sm hover:bg-teal-50"
            >
              Get started free
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2025 BrandShield AI · Explainable brand governance</p>
          <Badge
            variant="outline"
            className="gap-1.5 border-emerald-200 bg-emerald-50 font-medium text-emerald-700"
          >
            <ShieldCheck className="size-3.5" />
            Zero-Data-Retention by default
          </Badge>
        </div>
      </footer>
    </div>
  );
}
