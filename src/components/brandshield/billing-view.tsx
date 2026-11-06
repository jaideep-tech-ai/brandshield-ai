"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Check,
  CircleCheck,
  CreditCard,
  ExternalLink,
  Eye,
  FlaskConical,
  Infinity as InfinityIcon,
  Loader2,
  Lock,
  ShieldCheck,
  Users,
  Webhook,
} from "lucide-react";
import { toast } from "sonner";

import {
  useSession,
  useSubscription,
  useStartCheckout,
  useCompleteCheckout,
  useBillingPortal,
} from "@/lib/brandshield/client";
import { useLang } from "@/lib/brandshield/i18n";
import "@/lib/brandshield/i18n/dict-billing";
import { TIER_META } from "@/lib/brandshield/types";
import type { Tier } from "@/lib/brandshield/types";
import { cn, formatDate } from "@/lib/brandshield/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const TIER_ORDER: Tier[] = ["starter", "growth", "enterprise"];

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: Math.min(i, 8) * 0.06 },
  };
}

// ─── View ────────────────────────────────────────────────────────────────────

export function BillingView() {
  const { t, lang } = useLang();

  const { data: session } = useSession();
  const isAdmin = session?.role === "admin";

  const subscription = useSubscription();
  const startCheckout = useStartCheckout();
  const completeCheckout = useCompleteCheckout();
  const billingPortal = useBillingPortal();

  const sub = subscription.data;

  const tierShort = (tier: Tier) => t(`billing.tier.${tier}.short`);

  // Simulated Stripe Checkout state
  const [checkout, setCheckout] = useState<{ tier: Tier; sessionId: string } | null>(null);
  const [payStage, setPayStage] = useState<"form" | "processing" | "confirmed">("form");
  const confirmTimer = useRef<number | null>(null);

  const closeCheckout = () => {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    confirmTimer.current = null;
    setCheckout(null);
    setPayStage("form");
  };

  const beginCheckout = (tier: Tier) => {
    startCheckout.mutate(tier, {
      onSuccess: (r) => {
        setPayStage("form");
        setCheckout({ tier: r.tier ?? tier, sessionId: r.sessionId });
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : t("billing.toastCheckoutError")),
    });
  };

  const pay = () => {
    if (!checkout) return;
    setPayStage("processing");
    completeCheckout.mutate(checkout.sessionId, {
      onSuccess: () => {
        setPayStage("confirmed");
        confirmTimer.current = window.setTimeout(() => {
          closeCheckout();
          toast.success(t("billing.toastSubUpdated"));
        }, 1200);
      },
      onError: (err) => {
        setPayStage("form");
        toast.error(err instanceof Error ? err.message : t("billing.toastPayError"));
      },
    });
  };

  const openPortal = () => {
    billingPortal.mutate(undefined, {
      onSuccess: () => toast.info(t("billing.toastPortalInfo")),
      onError: (err) => toast.error(err instanceof Error ? err.message : t("billing.toastPortalError")),
    });
  };

  const usagePct = sub && sub.scanLimit > 0 ? Math.min(100, Math.round((sub.scansUsed / sub.scanLimit) * 100)) : 0;
  const checkoutPrice = checkout ? TIER_META[checkout.tier].price : 0;

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{t("billing.title")}</h1>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              <FlaskConical className="h-3 w-3" /> {t("billing.sandboxBadge")}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{t("billing.subtitle")}</p>
        </div>
        {!isAdmin && (
          <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-amber-700">
            <Eye className="h-3 w-3" /> {t("billing.readOnlyBadge")}
          </Badge>
        )}
      </motion.div>

      {/* Current plan */}
      {subscription.isLoading || !sub ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-28 rounded-xl" />
          </CardContent>
        </Card>
      ) : (
        <motion.div {...fadeUp(1)}>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
              {/* Plan identity */}
              <div className="flex flex-col items-start gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{t("billing.currentPlan")}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{t(`common.tier.${sub.tier}`)}</h2>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border",
                      sub.status === "active"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    )}
                  >
                    <CircleCheck className="h-3 w-3" /> {sub.status === "active" ? t("billing.status.active") : sub.status}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    ${(sub.priceCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-sm text-slate-500">{t("billing.perMonth")}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                    {sub.currentPeriodEnd
                      ? t("billing.renews", { date: formatDate(sub.currentPeriodEnd, lang) })
                      : t("billing.noRenewalDate")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {sub.seats === 1 ? t("billing.seat.one", { n: sub.seats }) : t("billing.seat.many", { n: sub.seats })}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-slate-200 text-slate-700 hover:bg-slate-50"
                  disabled={!isAdmin || billingPortal.isPending}
                  onClick={openPortal}
                >
                  {billingPortal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  {t("billing.managePortal")}
                </Button>
              </div>

              {/* Usage panel */}
              <div className="flex flex-col justify-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-700" /> {t("billing.scanQuota")}
                </div>
                {sub.scanLimit === -1 ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                      <InfinityIcon className="h-5 w-5 text-teal-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t("billing.unlimitedScans")}</p>
                      <p className="text-xs text-slate-500">{t("billing.scansThisCycle", { n: sub.scansUsed })}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {t("billing.scansUsed", { used: sub.scansUsed, limit: sub.scanLimit })}
                      </p>
                      <span className={cn("text-xs font-medium", usagePct >= 90 ? "text-red-600" : "text-slate-500")}>
                        {usagePct}%
                      </span>
                    </div>
                    <Progress
                      value={usagePct}
                      className={cn("h-2 bg-slate-200/70", usagePct >= 90 ? "[&>div]:bg-red-500" : "[&>div]:bg-teal-600")}
                    />
                    <p className="text-xs text-slate-500">{t("billing.quotaResets")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Read-only note for non-admins */}
      {!isAdmin && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <Eye className="text-amber-600" />
          <AlertTitle>{t("billing.readOnlyTitle")}</AlertTitle>
          <AlertDescription>{t("billing.readOnlyDesc")}</AlertDescription>
        </Alert>
      )}

      {/* Pricing grid */}
      <div className="grid grid-cols-1 gap-5 pt-2 lg:grid-cols-3 lg:gap-6">
        {TIER_ORDER.map((tier, i) => {
          const meta = TIER_META[tier];
          const isCurrent = sub?.tier === tier;
          const isPopular = tier === "growth";
          const isHigher = sub ? TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(sub.tier) : false;
          return (
            <motion.div key={tier} {...fadeUp(i + 2)} className={cn(isPopular && "lg:-mt-2 lg:mb-2")}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow",
                  isCurrent
                    ? "border-teal-500 ring-2 ring-teal-500/30"
                    : isPopular
                      ? "border-teal-400 shadow-md"
                      : "border-slate-200 hover:shadow-md"
                )}
              >
                {isCurrent ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border border-teal-300 bg-white text-teal-700">
                    {t("billing.currentPlan")}
                  </Badge>
                ) : isPopular ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-transparent bg-teal-700 text-white">
                    {t("billing.popular")}
                  </Badge>
                ) : null}

                <h3 className="text-sm font-semibold text-slate-900">{tierShort(tier)}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{t(`billing.tier.${tier}.tagline`)}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">${meta.price}</span>
                  <span className="text-sm text-slate-500">{t("billing.perMonth")}</span>
                </div>
                <p className="mt-2 min-h-[40px] text-xs leading-relaxed text-slate-600">{t(`billing.tier.${tier}.blurb`)}</p>

                <ul className="mt-4 space-y-2.5">
                  {meta.features.map((_, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                      {t(`billing.tier.${tier}.f${fIdx + 1}`)}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-2">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full border-teal-200 bg-teal-50/50 text-teal-700" disabled>
                      <CircleCheck className="h-4 w-4" /> {t("billing.currentPlan")}
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full",
                        isHigher
                          ? "bg-teal-700 text-white hover:bg-teal-800"
                          : "border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-50"
                      )}
                      variant={isHigher ? "default" : "outline"}
                      disabled={!isAdmin || startCheckout.isPending}
                      onClick={() => beginCheckout(tier)}
                    >
                      {startCheckout.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isHigher ? (
                        t("billing.upgradeTo", { tier: tierShort(tier) })
                      ) : (
                        t("billing.downgradeTo", { tier: tierShort(tier) })
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* How billing works */}
      <motion.div {...fadeUp(5)}>
        <Alert className="border-slate-200 bg-slate-50/70">
          <Webhook className="text-teal-700" />
          <AlertTitle>{t("billing.howTitle")}</AlertTitle>
          <AlertDescription>{t("billing.howDesc")}</AlertDescription>
        </Alert>
      </motion.div>

      {/* ── Simulated Stripe Checkout dialog ── */}
      <Dialog open={!!checkout} onOpenChange={(o) => !o && closeCheckout()}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md" showCloseButton={payStage !== "confirmed"}>
          {/* Merchant header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-slate-900">Nimbus Labs</DialogTitle>
                <p className="text-[11px] text-slate-500">{t("billing.merchantOfRecord")}</p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              {t("billing.testMode")}
            </Badge>
          </div>

          {payStage === "confirmed" ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 320, damping: 18 }}>
                <CircleCheck className="h-12 w-12 text-emerald-600" />
              </motion.div>
              <p className="text-sm font-semibold text-slate-900">{t("billing.payConfirmed")}</p>
              <p className="text-xs text-slate-500">{t("billing.syncingWorkspace")}</p>
            </div>
          ) : (
            <>
              {/* Product line */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{checkout ? t(`common.tier.${checkout.tier}`) : ""}</p>
                  <p className="text-xs text-slate-500">{t("billing.productLine")}</p>
                </div>
                <p className="shrink-0 pl-3 text-lg font-semibold text-slate-900">${checkoutPrice}.00</p>
              </div>

              {/* Payment form (read-only sandbox) */}
              <div className="space-y-4 px-6 py-5">
                <div className="space-y-1.5">
                  <Label htmlFor="co-email" className="text-slate-700">{t("billing.email")}</Label>
                  <Input
                    id="co-email"
                    type="email"
                    readOnly
                    value={session?.email ?? "billing@nimbuslabs.io"}
                    className="border-slate-200 bg-slate-50 text-slate-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="co-card" className="text-slate-700">{t("billing.cardInfo")}</Label>
                  <Input
                    id="co-card"
                    readOnly
                    value="4242 4242 4242 4242"
                    className="border-slate-200 bg-slate-50 font-mono text-slate-600"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input readOnly value="12 / 34" aria-label={t("billing.expiry")} className="border-slate-200 bg-slate-50 font-mono text-slate-600" />
                    <Input readOnly value="424" aria-label={t("billing.cvc")} className="border-slate-200 bg-slate-50 font-mono text-slate-600" />
                  </div>
                </div>
                <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {t("billing.sandboxNote")}
                </p>
                <Button
                  className="w-full bg-teal-700 text-white hover:bg-teal-800"
                  disabled={payStage === "processing" || completeCheckout.isPending}
                  onClick={pay}
                >
                  {payStage === "processing" || completeCheckout.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("billing.processing")}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" /> {t("billing.payNow", { amount: `$${checkoutPrice}.00` })}
                    </>
                  )}
                </Button>
                <Separator className="bg-slate-100" />
                <p className="text-center text-[11px] text-slate-400">
                  {t("billing.stripeFooter")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BillingView;
