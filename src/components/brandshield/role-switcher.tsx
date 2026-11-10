"use client";

import { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  FileSearch,
  Paintbrush,
  UserCheck,
  ChevronDown,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useSession, useSwitchRole } from "@/lib/brandshield/client";
import type { Role } from "@/lib/brandshield/types";
import { cn } from "@/lib/brandshield/utils";
import { useLang } from "@/lib/brandshield/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoleConfig {
  role: Role;
  titleKey: string;
  defaultTitle: string;
  subtitle: string;
  personaName: string;
  personaEmail: string;
  icon: typeof ShieldAlert;
  colorClass: string;
  badgeClass: string;
}

export const EVALUATION_ROLES: RoleConfig[] = [
  {
    role: "admin",
    titleKey: "shell.roles.admin",
    defaultTitle: "Brand Director (Super Admin)",
    subtitle: "Full governance, brand tokens, workspace settings & audit control",
    personaName: "Elena Rodriguez",
    personaEmail: "elena@nimbus.demo",
    icon: ShieldAlert,
    colorClass: "text-emerald-700",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    role: "reviewer",
    titleKey: "shell.roles.reviewer",
    defaultTitle: "Compliance Officer",
    subtitle: "WCAG 2.1 approvals, policy exception sign-offs & rule overrides",
    personaName: "Marcus Reed",
    personaEmail: "marcus@nimbus.demo",
    icon: CheckCircle2,
    colorClass: "text-amber-700",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    role: "creator",
    titleKey: "shell.roles.creator",
    defaultTitle: "Content Creator",
    subtitle: "Marketing asset scans, visual inspector & guidelines copilot",
    personaName: "Ava Chen",
    personaEmail: "ava@nimbus.demo",
    icon: Paintbrush,
    colorClass: "text-teal-700",
    badgeClass: "border-teal-200 bg-teal-50 text-teal-700",
  },
  {
    role: "contractor",
    titleKey: "shell.roles.contractor",
    defaultTitle: "Auditor / Viewer",
    subtitle: "Read-only compliance verification, certificates & audit history",
    personaName: "Priya Sharma",
    personaEmail: "priya@pixelworks.demo",
    icon: FileSearch,
    colorClass: "text-orange-700",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700",
  },
];

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const session = useSession();
  const switchRole = useSwitchRole();
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  if (!session.data) return null;
  const currentRole = session.data.role;
  const activeConfig = EVALUATION_ROLES.find((r) => r.role === currentRole) || EVALUATION_ROLES[0];
  const ActiveIcon = activeConfig.icon;

  function handleSelect(role: Role) {
    if (role === currentRole || switchRole.isPending) return;
    const target = EVALUATION_ROLES.find((r) => r.role === role);
    switchRole.mutate(role, {
      onSuccess: () => {
        setOpen(false);
        toast.success(`Switched role to ${target?.defaultTitle} (${target?.personaName})`);
      },
      onError: (err) => {
        toast.error(err.message || "Could not switch role.");
      },
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={switchRole.isPending}
          className={cn(
            "group flex min-h-[38px] items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30",
            switchRole.isPending && "opacity-75"
          )}
          title="Switch evaluation persona / role"
        >
          {switchRole.isPending ? (
            <Loader2 className="size-3.5 animate-spin text-teal-600" />
          ) : (
            <ActiveIcon className={cn("size-3.5 shrink-0", activeConfig.colorClass)} />
          )}

          {!compact && (
            <div className="hidden flex-col items-start leading-tight sm:flex">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                Evaluation Role
              </span>
              <span className="font-semibold text-slate-800">{activeConfig.defaultTitle.split(" (")[0]}</span>
            </div>
          )}

          <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px] font-semibold", activeConfig.badgeClass)}>
            {currentRole.toUpperCase()}
          </Badge>

          <ChevronDown className="size-3 text-slate-400 transition group-hover:text-slate-600" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-1.5 shadow-xl">
        <DropdownMenuLabel className="px-2 py-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Sparkles className="size-3.5 text-teal-600" />
            <span>Switch Role Perspective</span>
          </div>
          <p className="mt-0.5 text-[11px] font-normal text-slate-400">
            One-click evaluation switcher across the 4 BrandShield personas.
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="space-y-1 py-1">
          {EVALUATION_ROLES.map((cfg) => {
            const Icon = cfg.icon;
            const isActive = cfg.role === currentRole;
            return (
              <DropdownMenuItem
                key={cfg.role}
                onClick={() => handleSelect(cfg.role)}
                disabled={switchRole.isPending}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition",
                  isActive ? "bg-teal-50/80 text-teal-900" : "hover:bg-slate-50 text-slate-700"
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                    isActive ? "border-teal-200 bg-white" : "border-slate-200 bg-white"
                  )}
                >
                  <Icon className={cn("size-4", cfg.colorClass)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900">{cfg.defaultTitle}</span>
                    {isActive && (
                      <span className="rounded bg-teal-100 px-1 text-[9px] font-bold text-teal-800">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-tight text-slate-500 mt-0.5 line-clamp-1">{cfg.subtitle}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {cfg.personaName} · {cfg.personaEmail}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
