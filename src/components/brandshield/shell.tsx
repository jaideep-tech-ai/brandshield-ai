"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  ClipboardCheck,
  CreditCard,
  Database,
  FileSearch,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  ScanSearch,
  Settings,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { useLogout, useSession } from "@/lib/brandshield/client";
import { useUIStore, type ViewKey } from "@/lib/brandshield/store";
import type { Role } from "@/lib/brandshield/types";
import { cn, initials } from "@/lib/brandshield/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LangToggle, useLang } from "@/lib/brandshield/i18n";
import "@/lib/brandshield/i18n/dict-shell";
import { RoleSwitcher } from "@/components/brandshield/role-switcher";

// ─── Navigation model (role-gated) ───────────────────────────────────────────

interface NavItem {
  key: ViewKey;
  labelKey: string; // i18n key — resolved via t() at render time
  shortKey: string; // compact label for the mobile bottom bar
  icon: LucideIcon;
  roles: readonly Role[];
}

const ALL_ROLES: readonly Role[] = ["creator", "reviewer", "contractor", "admin"];

const NAV: readonly NavItem[] = [
  { key: "dashboard", labelKey: "shell.nav.dashboard", shortKey: "shell.navShort.dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
  { key: "copilot", labelKey: "shell.nav.copilot", shortKey: "shell.navShort.copilot", icon: Sparkles, roles: ALL_ROLES },
  { key: "knowledge", labelKey: "shell.nav.knowledge", shortKey: "shell.navShort.knowledge", icon: Database, roles: ALL_ROLES },
  {
    key: "scanner",
    labelKey: "shell.nav.scanner",
    shortKey: "shell.navShort.scanner",
    icon: ScanSearch,
    roles: ["creator", "contractor", "admin"],
  },
  { key: "findings", labelKey: "shell.nav.findings", shortKey: "shell.navShort.findings", icon: FileSearch, roles: ALL_ROLES },
  { key: "approvals", labelKey: "shell.nav.approvals", shortKey: "shell.navShort.approvals", icon: ClipboardCheck, roles: ALL_ROLES },
  { key: "analytics", labelKey: "shell.nav.analytics", shortKey: "shell.navShort.analytics", icon: BarChart3, roles: ["reviewer", "admin"] },
  { key: "billing", labelKey: "shell.nav.billing", shortKey: "shell.navShort.billing", icon: CreditCard, roles: ["admin"] },
  { key: "settings", labelKey: "shell.nav.settings", shortKey: "shell.navShort.settings", icon: Settings, roles: ["admin"] },
];

const ROLE_BADGE: Record<Role, string> = {
  creator: "border-teal-200 bg-teal-50 text-teal-700",
  reviewer: "border-amber-200 bg-amber-50 text-amber-700",
  contractor: "border-orange-200 bg-orange-50 text-orange-700",
  admin: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

// ─── Bits ────────────────────────────────────────────────────────────────────

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

interface NavButtonProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onSelect: () => void;
}

function SidebarNavButton({ item, active, collapsed, onSelect }: NavButtonProps) {
  const Icon = item.icon;
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onSelect}
      title={collapsed ? t(item.labelKey) : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-3 whitespace-nowrap rounded-lg py-2 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        active ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-teal-600" />
      )}
      <Icon
        className={cn("size-4 shrink-0", active ? "text-teal-700" : "text-slate-400 group-hover:text-slate-600")}
      />
      {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
    </button>
  );
}

function IconNavButton({
  item,
  active,
  onSelect,
  className,
}: {
  item: NavItem;
  active: boolean;
  onSelect: () => void;
  className?: string;
}) {
  const Icon = item.icon;
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onSelect}
      title={t(item.labelKey)}
      aria-label={t(item.labelKey)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex size-10 items-center justify-center rounded-lg transition-colors",
        active ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        className
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-teal-600" />
      )}
      <Icon className="size-4.5" />
    </button>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────────

export function Shell({ children }: { children: ReactNode }) {
  const session = useSession();
  const { view, setView, sidebarCollapsed, toggleSidebar, setTourOpen } = useUIStore();
  const { t } = useLang();
  const logout = useLogout();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  function startTour() {
    window.dispatchEvent(new Event("brandshield:start-tour"));
  }

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9]">
        <Loader2 className="size-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!session.data) return null;

  const user = session.data;
  const nav = NAV.filter((item) => item.roles.includes(user.role));
  const bottomItems = nav.slice(0, 5);
  const moreItems = nav.slice(5);

  function goTo(key: ViewKey) {
    setView(key);
    setMobileNavOpen(false);
    setMoreOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
      {/* ── Desktop sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-slate-200 bg-white lg:flex"
      >
        <button
          type="button"
          onClick={() => goTo("dashboard")}
          className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4"
          aria-label={t("shell.aria.goOverview")}
        >
          <LogoMark />
          {!sidebarCollapsed && (
            <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-slate-900">
              BrandShield AI
            </span>
          )}
        </button>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3" aria-label={t("shell.aria.primary")}>
          {nav.map((item) => (
            <SidebarNavButton
              key={item.key}
              item={item}
              active={view === item.key}
              collapsed={sidebarCollapsed}
              onSelect={() => goTo(item.key)}
            />
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? t("shell.sidebar.expandTitle") : t("shell.sidebar.collapseTitle")}
            className={cn(
              "flex w-full items-center gap-3 whitespace-nowrap rounded-lg py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900",
              sidebarCollapsed ? "justify-center px-0" : "px-3"
            )}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="size-4 shrink-0" />
                <span>{t("shell.sidebar.collapse")}</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* ── Tablet rail ── */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center border-r border-slate-200 bg-white md:flex lg:hidden"
        aria-label={t("shell.aria.primary")}
      >
        <button
          type="button"
          onClick={() => goTo("dashboard")}
          className="flex h-14 w-full items-center justify-center border-b border-slate-100"
          aria-label={t("shell.aria.goOverview")}
        >
          <LogoMark />
        </button>
        <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-3">
          {nav.map((item) => (
            <IconNavButton
              key={item.key}
              item={item}
              active={view === item.key}
              onSelect={() => goTo(item.key)}
            />
          ))}
        </nav>
      </aside>

      {/* ── Content column (header + main + footer) ── */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-[margin] duration-200 ease-out md:ml-16",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-[240px]"
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/80 px-3 backdrop-blur sm:gap-3 sm:px-4">
          {/* Mobile / tablet drawer */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("shell.mobile.navAria")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-slate-100 p-4 text-left">
                <div className="flex items-center gap-2.5">
                  <LogoMark />
                  <SheetTitle className="text-base font-semibold text-slate-900">BrandShield AI</SheetTitle>
                </div>
                <SheetDescription className="sr-only">{t("shell.mobile.sheetDesc")}</SheetDescription>
              </SheetHeader>
              <div className="border-b border-slate-100 p-3 bg-slate-50/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Role Perspective
                </p>
                <RoleSwitcher />
              </div>
              <nav className="space-y-1 p-3" aria-label={t("shell.aria.primary")}>
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => goTo(item.key)}
                      className={cn(
                        "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-teal-50 text-teal-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-teal-600" />
                      )}
                      <Icon className={cn("size-4 shrink-0", active ? "text-teal-700" : "text-slate-400")} />
                      {t(item.labelKey)}
                    </button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <button
            type="button"
            onClick={() => goTo("dashboard")}
            className="flex items-center gap-2.5"
            aria-label={t("shell.aria.goOverview")}
          >
            <LogoMark />
            <span className="hidden text-sm font-semibold tracking-tight text-slate-900 sm:inline">
              BrandShield AI
            </span>
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {user.zeroDataRetention && (
              <Badge
                title={t("shell.header.zdrTitle")}
                className="hidden gap-1 border-emerald-200 bg-emerald-50 font-medium text-emerald-700 sm:inline-flex"
              >
                <ShieldCheck className="size-3" />
                {t("shell.header.zdr")}
              </Badge>
            )}
            <span className="hidden max-w-44 truncate text-sm text-slate-500 md:inline">{user.orgName}</span>
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-6! hidden md:block" />

            {/* Language switcher — compact, always visible (even on mobile) */}
            <LangToggle />

            {/* Persistent 4-role evaluation switcher */}
            <RoleSwitcher />

            <Button
              variant="ghost"
              size="sm"
              onClick={startTour}
              className="gap-1.5 rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-700"
              aria-label={t("shell.header.tourAria")}
            >
              <GraduationCap className="size-4" />
              <span className="hidden sm:inline">{t("shell.header.tour")}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-teal-600/40"
                  aria-label={t("shell.header.accountAria")}
                >
                  <Avatar className="size-8 border border-black/5">
                    <AvatarFallback
                      style={{ backgroundColor: user.avatarColor }}
                      className="text-xs font-semibold text-white"
                    >
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs font-normal text-slate-500">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <Badge variant="outline" className={cn("font-medium", ROLE_BADGE[user.role])}>
                    {t(`common.role.${user.role}`)}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={startTour} className="gap-2">
                  <GraduationCap className="size-4 text-teal-600" />
                  {t("shell.account.tour")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  {logout.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  {t("shell.account.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-8">
          <div data-tour="page-root">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="mt-auto shrink-0 border-t border-slate-200 bg-white/60 py-4">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-1.5 px-4 text-center text-xs text-slate-500 sm:flex-row sm:justify-center sm:gap-3">
            <span>{t("shell.footer.line1")}</span>
            <span aria-hidden className="hidden text-slate-300 sm:inline">
              •
            </span>
            <span>{t("shell.footer.line2")}</span>
            <span aria-hidden className="hidden text-slate-300 sm:inline">
              •
            </span>
            <span>{t("shell.footer.line3")}</span>
          </div>
        </footer>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label={t("shell.aria.primary")}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => goTo(item.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-teal-700" : "text-slate-500"
                )}
              >
                <Icon className="size-5" />
                <span className="max-w-full truncate">{t(item.shortKey)}</span>
              </button>
            );
          })}

          {moreItems.length > 0 && (
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-slate-500 transition-colors"
                  aria-label={t("shell.mobile.moreAria")}
                >
                  <MoreHorizontal className="size-5" />
                  {t("shell.mobile.more")}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-base">{t("shell.mobile.more")}</SheetTitle>
                  <SheetDescription>{t("shell.mobile.moreDesc")}</SheetDescription>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-2 p-4 pt-0">
                  {moreItems.map((item) => {
                    const Icon = item.icon;
                    const active = view === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => goTo(item.key)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border p-3 text-sm font-medium transition-colors",
                          active
                            ? "border-teal-200 bg-teal-50 text-teal-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", active ? "text-teal-700" : "text-slate-400")} />
                        <span className="truncate">{t(item.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </nav>
    </div>
  );
}
