"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  Check,
  KeyRound,
  Languages,
  Lock,
  Mail,
  Minus,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSession, useUpdateOrg, useTeam } from "@/lib/brandshield/client";
import { LANGS, useLang } from "@/lib/brandshield/i18n";
import "@/lib/brandshield/i18n/dict-settings";
import type { Role } from "@/lib/brandshield/types";
import { cn, initials } from "@/lib/brandshield/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ─── Meta ────────────────────────────────────────────────────────────────────

const ROLE_CLS: Record<Role, string> = {
  creator: "bg-teal-50 text-teal-700 border-teal-200",
  reviewer: "bg-amber-50 text-amber-700 border-amber-200",
  contractor: "bg-orange-50 text-orange-700 border-orange-200",
  admin: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const ROLE_ORDER: Role[] = ["creator", "contractor", "reviewer", "admin"];

const PERMISSION_ROWS: { key: string; allowed: Record<Role, boolean> }[] = [
  { key: "scans", allowed: { creator: true, contractor: true, reviewer: false, admin: true } },
  { key: "submit", allowed: { creator: true, contractor: true, reviewer: false, admin: true } },
  { key: "approve", allowed: { creator: false, contractor: false, reviewer: true, admin: true } },
  { key: "kb", allowed: { creator: false, contractor: false, reviewer: false, admin: true } },
  { key: "billing", allowed: { creator: false, contractor: false, reviewer: false, admin: true } },
  { key: "analytics", allowed: { creator: false, contractor: false, reviewer: true, admin: true } },
  { key: "override", allowed: { creator: true, contractor: false, reviewer: true, admin: true } },
];

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: Math.min(i, 8) * 0.06 },
  };
}

function RoleBadge({ role }: { role: Role }) {
  const { t } = useLang();
  return (
    <Badge variant="outline" className={cn("border", ROLE_CLS[role])}>
      {t(`common.role.${role}`)}
    </Badge>
  );
}

function MemberAvatar({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" }) {
  return (
    <Avatar className={cn("shrink-0 border border-slate-200", size === "md" ? "h-9 w-9" : "h-8 w-8")}>
      <AvatarFallback style={{ backgroundColor: color }} className="text-xs font-semibold text-white">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50">
            <Icon className="h-4.5 w-4.5 text-teal-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </CardContent>
    </Card>
  );
}

// ─── View ────────────────────────────────────────────────────────────────────

export function SettingsView() {
  const { t, lang } = useLang();
  const queryClient = useQueryClient();
  const { data: session, isLoading: sessionLoading } = useSession();
  const isAdmin = session?.role === "admin";
  const updateOrg = useUpdateOrg();
  const team = useTeam();

  // Optimistic ZDR toggle: write the session cache immediately, reconcile on settle
  const toggleZdr = (v: boolean) => {
    const prev = session?.zeroDataRetention ?? false;
    if (session) {
      queryClient.setQueryData(["session"], { ...session, zeroDataRetention: v });
    }
    updateOrg.mutate(
      { zeroDataRetention: v },
      {
        onSuccess: () => toast.success(v ? t("settings.toast.zdrOn") : t("settings.toast.zdrOff")),
        onError: (err) => {
          if (session) {
            queryClient.setQueryData(["session"], { ...session, zeroDataRetention: prev });
          }
          toast.error(err instanceof Error ? err.message : t("settings.toast.orgError"));
        },
      }
    );
  };

  // Loading skeleton
  if (sessionLoading || !session) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-56" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  // ── Non-admin gate ──
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 sm:px-6">
        <motion.div {...fadeUp(0)}>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-slate-600">{t("settings.subtitleNonAdmin")}</p>
        </motion.div>

        <motion.div {...fadeUp(1)}>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-base font-semibold text-slate-900">{t("settings.gate.title")}</p>
              <p className="max-w-md text-sm text-slate-600">{t("settings.gate.desc")}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp(2)}>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-4 p-6">
              <MemberAvatar name={session.name} color={session.avatarColor} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{session.name}</p>
                <p className="truncate text-xs text-slate-500">{session.email}</p>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <RoleBadge role={session.role} />
                {session.department && (
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                    <Briefcase className="h-3 w-3" /> {session.department}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Admin view ──
  const members = team.data ?? [];
  const currentLangNative = LANGS.find((l) => l.value === lang)?.native ?? lang;

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 sm:px-6">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("settings.subtitle")}</p>
      </motion.div>

      {/* 1 — Organization */}
      <motion.div {...fadeUp(1)}>
        <SectionCard icon={Building2} title={t("settings.org.title")} description={t("settings.org.desc")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-slate-700">{t("settings.org.name")}</Label>
              <Input
                id="org-name"
                readOnly
                value={session.orgName}
                placeholder={t("settings.org.namePlaceholder")}
                className="border-slate-200 bg-slate-50 text-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">{t("settings.org.slug")}</Label>
              <div>
                <Badge variant="outline" className="border-teal-200 bg-teal-50/60 font-mono text-teal-700">
                  @{session.orgSlug}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="my-5 bg-slate-100" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-900">{t("settings.org.zdr")}</p>
                {session.zeroDataRetention && (
                  <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <ShieldCheck className="h-3 w-3" /> {t("settings.org.zdrActive")}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {session.zeroDataRetention ? t("settings.org.zdr.descOn") : t("settings.org.zdr.descOff")}
              </p>
            </div>
            <Switch
              checked={session.zeroDataRetention}
              onCheckedChange={toggleZdr}
              disabled={updateOrg.isPending}
              className="data-[state=checked]:bg-emerald-600"
              aria-label={t("settings.org.zdrAria")}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* 2 — Team & Access Control */}
      <motion.div {...fadeUp(2)}>
        <SectionCard
          icon={Users}
          title={t("settings.team.title")}
          description={
            members.length === 1
              ? t("settings.team.descOne", { n: members.length, org: session.orgName })
              : t("settings.team.descMany", { n: members.length, org: session.orgName })
          }
        >
          {team.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-xs text-slate-500">
              {t("settings.team.noMembers")}
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border border-slate-100 md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 bg-slate-50/60 hover:bg-slate-50/60">
                      <TableHead className="text-slate-500">{t("settings.team.colName")}</TableHead>
                      <TableHead className="text-slate-500">{t("settings.team.colRole")}</TableHead>
                      <TableHead className="text-slate-500">{t("settings.team.colDepartment")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id} className="border-slate-100">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <MemberAvatar name={m.name} color={m.avatarColor} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">{m.name}</p>
                              <p className="truncate text-xs text-slate-500">{m.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={m.role} />
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{m.department ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {members.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <MemberAvatar name={m.name} color={m.avatarColor} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{m.name}</p>
                        <p className="truncate text-xs text-slate-500">{m.email}</p>
                      </div>
                      <RoleBadge role={m.role} />
                    </div>
                    {m.department && (
                      <p className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-500">
                        <Briefcase className="h-3 w-3" /> {m.department}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </motion.div>

      {/* 3 — Role Permission Matrix */}
      <motion.div {...fadeUp(3)}>
        <SectionCard
          icon={ShieldCheck}
          title={t("settings.perm.title")}
          description={t("settings.perm.desc")}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="min-w-44 text-slate-500">{t("settings.perm.colCapability")}</TableHead>
                  {ROLE_ORDER.map((role) => (
                    <TableHead key={role} className="min-w-20 text-center text-slate-500">
                      {t(`common.role.${role}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_ROWS.map((row) => (
                  <TableRow key={row.key} className="border-slate-100">
                    <TableCell className="text-sm text-slate-700">{t(`settings.perm.row.${row.key}`)}</TableCell>
                    {ROLE_ORDER.map((role) => (
                      <TableCell key={role} className="text-center">
                        {row.allowed[role] ? (
                          <Check className="mx-auto h-4 w-4 text-teal-600" aria-label={t("settings.perm.allowed")} />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label={t("settings.perm.notAllowed")} />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </motion.div>

      {/* 4 — Preferences (display-only language row; the switcher lives in the header) */}
      <motion.div {...fadeUp(4)}>
        <SectionCard icon={Languages} title={t("settings.prefs.title")} description={t("settings.prefs.desc")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-slate-900">{t("settings.prefs.lang")}</p>
              <p className="mt-0.5 text-xs text-slate-500">{t("settings.prefs.langHint")}</p>
            </div>
            <Badge variant="outline" className="w-fit border-teal-200 bg-teal-50/60 text-teal-700">
              {currentLangNative}
            </Badge>
          </div>
        </SectionCard>
      </motion.div>

      {/* 5 — Session */}
      <motion.div {...fadeUp(5)}>
        <SectionCard icon={KeyRound} title={t("settings.session.title")} description={t("settings.session.desc")}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
              <Mail className="h-3 w-3 text-slate-400" /> {session.email}
            </Badge>
            <RoleBadge role={session.role} />
            {session.department ? (
              <Badge variant="outline" className="border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                <Briefcase className="h-3 w-3 text-slate-400" /> {session.department}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-500">
                {t("settings.session.noDept")}
              </Badge>
            )}
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}

export default SettingsView;
