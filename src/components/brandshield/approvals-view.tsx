"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  Loader2,
  ShieldCheck,
  FileDiff,
  History,
  Download,
  CheckCircle2,
  Flag,
  CircleDashed,
  Link2,
  BadgeCheck,
  SendHorizonal,
  MessageSquarePlus,
  Fingerprint,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useSession,
  useSubmissions,
  useSubmission,
  useTransitionSubmission,
  useAuditTrail,
  useResolveFinding,
} from "@/lib/brandshield/client";
import { cn, lineDiff, timeAgo, formatDate, shortHash } from "@/lib/brandshield/utils";
import { STATUS_META, SEVERITY_META, type Submission, type SubmissionStatus } from "@/lib/brandshield/types";
import { useLang } from "@/lib/brandshield/i18n";
import "@/lib/brandshield/i18n/dict-approvals";
import "@/lib/brandshield/i18n/dict-help";
import { ContextualHelpButton } from "@/components/brandshield/help-center";

const COLUMNS: { status: SubmissionStatus; accent: string }[] = [
  { status: "draft", accent: "bg-slate-400" },
  { status: "in_review", accent: "bg-amber-400" },
  { status: "changes_requested", accent: "bg-orange-500" },
  { status: "approved", accent: "bg-emerald-500" },
];

export function ApprovalsView() {
  const session = useSession();
  const submissions = useSubmissions();
  const { t } = useLang();
  const [detailId, setDetailId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<SubmissionStatus, Submission[]>();
    for (const col of COLUMNS) map.set(col.status, []);
    for (const s of submissions.data ?? []) map.get(s.status as SubmissionStatus)?.push(s);
    return map;
  }, [submissions.data]);

  const isReviewer = session.data?.role === "reviewer" || session.data?.role === "admin";
  const inReviewCount = (grouped.get("in_review") ?? []).length;

  return (
    <div className="space-y-5 px-4 py-6 sm:px-6 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            {t("approvals.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("approvals.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <ContextualHelpButton guideKey="approvals" labelKey="help.needHelp.approvals" />
          {isReviewer && (
            <Badge variant="outline" className="gap-1 border-teal-200 bg-teal-50 text-teal-700">
              <BadgeCheck className="h-3.5 w-3.5" /> {t("approvals.reviewerBadge", { count: inReviewCount })}
            </Badge>
          )}
        </div>
      </div>

      {submissions.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{[...Array(4)].map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="flex flex-col rounded-2xl border border-slate-100 bg-white/70 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", col.accent)} />
                  <h3 className="text-sm font-semibold text-slate-700">{t(`common.status.${col.status}`)}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{grouped.get(col.status)?.length ?? 0}</span>
              </div>
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {(grouped.get(col.status) ?? []).map((s) => (
                    <motion.button
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      onClick={() => setDetailId(s.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-teal-300 hover:shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-slate-800">{s.title}</p>
                        {s.complianceScore !== null && (
                          <Badge variant="outline" className={cn("shrink-0 text-[10px]", s.complianceScore >= 85 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : s.complianceScore >= 60 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700")}>
                            {s.complianceScore}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 truncate text-[11px] text-slate-400">{s.authorName} · {s.department ?? "—"}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><History className="h-3 w-3" /> v{s.currentVersion}</span>
                        {s.contentType === "banner" && <span className="rounded bg-slate-100 px-1.5 py-0.5">{t("approvals.typeBanner")}</span>}
                        {(() => {
                          const open = s.findings?.filter((f) => f.status === "open") ?? [];
                          if (open.length === 0) return <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> {t("approvals.findingsClear")}</span>;
                          return <span className="flex items-center gap-1 text-amber-600"><CircleDashed className="h-3 w-3" /> {t("approvals.findingsOpen", { n: open.length })}</span>;
                        })()}
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
                {(grouped.get(col.status) ?? []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-300">{t("approvals.emptyColumn")}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DetailDialog submissionId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

// ─── Detail dialog: overview + diff + findings + audit chain ─────────────────

function DetailDialog({ submissionId, onClose }: { submissionId: string | null; onClose: () => void }) {
  const session = useSession();
  const { data: sub } = useSubmission(submissionId);
  const { data: audit } = useAuditTrail(submissionId);
  const transition = useTransitionSubmission();
  const resolveFinding = useResolveFinding();
  const { t, lang } = useLang();
  const [note, setNote] = useState("");
  const [actionOpen, setActionOpen] = useState<"request_changes" | "approve" | null>(null);

  const actionLabel = (a: string) => {
    const k = `approvals.action.${a}`;
    return t(k) === k ? a.replaceAll("_", " ") : t(k);
  };
  const detailLabel = (k: string) => {
    const key = `approvals.detail.${k}`;
    return t(key) === key ? k : t(key);
  };

  const isReviewer = session.data?.role === "reviewer" || session.data?.role === "admin";
  const isAuthor = sub?.authorId === session.data?.id;

  const act = async (action: "submit_for_review" | "request_changes" | "approve" | "reopen") => {
    if (!sub) return;
    try {
      const res = await transition.mutateAsync({ id: sub.id, action, note: note.trim() || undefined });
      if (action === "approve") {
        toast.success(t("approvals.toastApproved"), {
          description: t("approvals.toastApprovedDesc", { hash: String((res as { signOffHash?: string }).signOffHash ?? "").slice(0, 24) }),
          duration: 7000,
        });
      } else if (action === "request_changes") {
        toast.info(t("approvals.toastChanges"));
      } else if (action === "submit_for_review") {
        toast.success(t("approvals.toastSubmitted"));
      } else {
        toast.info(t("approvals.toastReopened"));
      }
      setActionOpen(null);
      setNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("approvals.toastError"));
    }
  };

  const exportAudit = () => {
    if (!sub || !audit) return;
    const cert = {
      certificate: "BrandShield AI — Compliance Certificate",
      generatedAt: new Date().toISOString(),
      submission: { id: sub.id, title: sub.title, author: sub.authorName, status: sub.status, complianceScore: sub.complianceScore, version: sub.currentVersion },
      chainVerified: verifyChain(audit, false),
      auditTrail: audit,
    };
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brandshield-certificate-${sub.id.slice(-8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("approvals.toastExported"));
  };

  const chainOk = audit ? verifyChain(audit, false) : false;

  return (
    <Dialog open={!!submissionId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-3xl lg:max-w-5xl">
        <DialogTitle className="sr-only">{t("approvals.detailSrTitle")}</DialogTitle>
        {sub ? (
          <div className="flex max-h-[calc(92vh-4rem)] flex-col gap-4">
            <DialogHeader className="shrink-0 pr-8">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
                {sub.title}
                <Badge variant="outline" className={cn("border", STATUS_META[sub.status as keyof typeof STATUS_META]?.className)}>{t(`common.status.${sub.status}`)}</Badge>
                {sub.complianceScore !== null && (
                  <Badge variant="outline" className={cn("border text-[10px]", sub.complianceScore >= 85 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                    {t("approvals.scoreBadge", { score: sub.complianceScore })}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="diff" className="min-h-0 flex-1">
              <TabsList className="flex w-full sm:w-fit">
                <TabsTrigger value="diff" className="flex-1 gap-1.5 sm:flex-none"><FileDiff className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t("approvals.tabDiffVersion")}</span>{" "}{t("approvals.tabDiff")}</TabsTrigger>
                <TabsTrigger value="findings" className="flex-1 gap-1.5 sm:flex-none"><ShieldCheck className="h-3.5 w-3.5" /> {t("approvals.tabFindings", { n: sub.findings.filter((f) => f.status === "open").length })}</TabsTrigger>
                <TabsTrigger value="audit" className="flex-1 gap-1.5 sm:flex-none"><History className="h-3.5 w-3.5" /> {t("approvals.tabAudit")}</TabsTrigger>
              </TabsList>

              {/* Diff tab */}
              <TabsContent value="diff" className="mt-3 min-h-0 flex-1 overflow-hidden">
                <DiffViewer sub={sub} />
              </TabsContent>

              {/* Findings tab */}
              <TabsContent value="findings" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {sub.findings.length === 0 && <p className="py-8 text-center text-sm text-slate-400">{t("approvals.noFindings")}</p>}
                  {sub.findings.map((f) => (
                    <div key={f.id} className="rounded-xl border border-slate-100 bg-white p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className={cn("border text-[10px]", SEVERITY_META[f.severity].border, SEVERITY_META[f.severity].bg, SEVERITY_META[f.severity].text)}>{t(`common.severity.${f.severity}`)}</Badge>
                        <span className="text-xs font-medium text-slate-600">&ldquo;{f.flaggedText.slice(0, 70)}{f.flaggedText.length > 70 ? "…" : ""}&rdquo;</span>
                        <span className="ml-auto text-[10px] capitalize text-slate-400">{t(`common.finding.${f.status}`)}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{f.sourceDoc} — {f.ruleCitation.slice(0, 90)}</p>
                      {isReviewer && f.status === "open" && (
                        <Button size="sm" variant="ghost" className="mt-1 h-7 gap-1 text-xs text-teal-700" onClick={() => resolveFinding.mutate({ id: f.id })}>
                          <CheckCircle2 className="h-3 w-3" /> {t("approvals.markResolved")}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Audit tab */}
              <TabsContent value="audit" className="mt-3 min-h-0 flex-1 overflow-hidden">
                <div className="flex h-full flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className={cn("gap-1.5 border text-[11px]", chainOk ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600")}>
                      <Lock className="h-3 w-3" /> {chainOk ? t("approvals.chainOk") : t("approvals.chainBroken")}
                    </Badge>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={exportAudit} disabled={!audit?.length}>
                      <Download className="h-3.5 w-3.5" /> {t("approvals.exportCert")}
                    </Button>
                  </div>
                  <ScrollArea className="min-h-0 flex-1 pr-2">
                    <div className="relative space-y-0 pl-5">
                      <span className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" aria-hidden />
                      {(audit ?? []).map((entry, i) => (
                        <div key={entry.id} className="relative py-2.5">
                          <span className={cn("absolute -left-[13px] top-3.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white", i === 0 ? "bg-slate-300" : entry.action === "APPROVAL" || entry.action === "SIGN_OFF" ? "bg-emerald-500" : "bg-teal-500")} />
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-xs font-semibold text-slate-700">{actionLabel(entry.action)}</span>
                            <span className="text-[11px] text-slate-400">{entry.actorName} · {formatDate(entry.createdAt, lang)}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                            {Object.entries(entry.details)
                              .filter(([k]) => !["hash", "verifiedContentHash"].includes(k))
                              .slice(0, 3)
                              .map(([k, v]) => `${detailLabel(k)}: ${String(v).slice(0, 90)}`)
                              .join(" · ")}
                          </p>
                          <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-slate-400">
                            <Fingerprint className="h-3 w-3" /> {shortHash(entry.contentHash)}
                            <Link2 className="ml-1 h-3 w-3" /> ← {shortHash(entry.prevHash)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action bar */}
            <div className="shrink-0 border-t border-slate-100 pt-3">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {isAuthor && sub.status === "draft" && sub.scanCount > 0 && (
                  <Button className="min-h-10 gap-1.5 bg-teal-700 hover:bg-teal-800" onClick={() => act("submit_for_review")} disabled={transition.isPending}>
                    {transition.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />} {transition.isPending ? t("approvals.working") : t("approvals.submitReview")}
                  </Button>
                )}
                {isReviewer && sub.status === "in_review" && (
                  <>
                    <Button variant="outline" className="min-h-10 gap-1.5" onClick={() => setActionOpen("request_changes")}>
                      <MessageSquarePlus className="h-4 w-4" /> {t("approvals.requestChanges")}
                    </Button>
                    <Button className="min-h-10 gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => setActionOpen("approve")}>
                      <BadgeCheck className="h-4 w-4" /> {t("approvals.grantApproval")}
                    </Button>
                  </>
                )}
                {isReviewer && sub.status === "changes_requested" && (
                  <Button variant="ghost" className="min-h-10" onClick={() => act("reopen")}>{t("approvals.reopenDraft")}</Button>
                )}
                {isReviewer && sub.status === "approved" && (
                  <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                    <ShieldCheck className="h-4 w-4" /> {t("approvals.signedOff")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
        )}

        {/* note dialog */}
        <Dialog open={!!actionOpen} onOpenChange={(o) => !o && setActionOpen(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">{actionOpen === "approve" ? t("approvals.grantApproval") : t("approvals.requestChanges")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-500">
              {actionOpen === "approve"
                ? t("approvals.approveHelp")
                : t("approvals.changesHelp")}
            </p>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={actionOpen === "approve" ? t("approvals.approvePlaceholder") : t("approvals.changesPlaceholder")} className="min-h-[80px]" />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setActionOpen(null)}>{t("common.action.cancel")}</Button>
              <Button
                className={actionOpen === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}
                disabled={transition.isPending || (actionOpen === "request_changes" && note.trim().length < 8)}
                onClick={() => act(actionOpen === "approve" ? "approve" : "request_changes")}
              >
                {transition.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : actionOpen === "approve" ? <BadgeCheck className="h-4 w-4" /> : null}
                {actionOpen === "approve" ? t("approvals.approveSign") : t("approvals.send")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// ─── Diff viewer (side-by-side LCS line diff) ────────────────────────────────

function DiffViewer({ sub }: { sub: NonNullable<ReturnType<typeof useSubmission>["data"]> }) {
  const { t, lang } = useLang();
  const [fromV, setFromV] = useState(0);
  const revisions = sub.revisions;
  const a = revisions?.[fromV]?.content ?? "";
  const b = revisions?.[revisions.length - 1]?.content ?? "";
  const rows = useMemo(() => lineDiff(a, b), [a, b]);
  const same = a === b;

  if (!revisions || revisions.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">{t("approvals.noRevisions")}</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-medium text-slate-600">{t("approvals.compare")}</span>
        <select value={fromV} onChange={(e) => setFromV(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
          {revisions.slice(0, Math.max(1, revisions.length - 1)).map((r) => (
            <option key={r.id} value={r.id === revisions[revisions.length - 1].id ? Math.max(0, revisions.length - 2) : revisions.findIndex((x) => x.id === r.id)}>
              v{r.version} · {r.changeSummary ?? t("approvals.edited")} · {timeAgo(r.createdAt, lang)}
            </option>
          ))}
        </select>
        <span>→</span>
        <span className="font-medium text-slate-600">v{revisions[revisions.length - 1].version} ({t("approvals.current")})</span>
        {same && <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-600">{t("approvals.identical")}</Badge>}
      </div>
      <Separator />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden sm:grid-cols-2">
        <div className="min-h-0 overflow-y-auto rounded-xl border border-slate-100">
          <p className="sticky top-0 bg-red-50/90 px-3 py-1.5 text-[11px] font-semibold text-red-700 backdrop-blur">{t("approvals.prevVersion")}</p>
          <DiffPane rows={rows} side="left" />
        </div>
        <div className="min-h-0 overflow-y-auto rounded-xl border border-slate-100">
          <p className="sticky top-0 bg-emerald-50/90 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 backdrop-blur">{t("approvals.currVersion")}</p>
          <DiffPane rows={rows} side="right" />
        </div>
      </div>
    </div>
  );
}

function DiffPane({ rows, side }: { rows: ReturnType<typeof lineDiff>; side: "left" | "right" }) {
  const visible = rows.filter((r) => (side === "left" ? r.left !== null : r.right !== null));
  return (
    <div className="divide-y divide-slate-50 font-mono text-[11px] leading-relaxed">
      {visible.map((r, i) => {
        const text = side === "left" ? r.left : r.right;
        const type = r.type;
        return (
          <div
            key={i}
            className={cn(
              "whitespace-pre-wrap px-3 py-1",
              type === "same" && "text-slate-500",
              type === "removed" && side === "left" && "bg-red-50 text-red-800",
              type === "added" && side === "right" && "bg-emerald-50 text-emerald-800",
              type === "changed" && "bg-amber-50"
            )}
          >
            {text || ""}
          </div>
        );
      })}
    </div>
  );
}

function verifyChain(entries: { prevHash: string; contentHash: string }[], requireGenesis = true): boolean {
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].prevHash !== entries[i - 1].contentHash) return false;
  }
  // An org-wide chain is anchored at GENESIS, but a per-submission slice starts
  // mid-chain (its first entry links to the previous org-wide event).
  if (requireGenesis && entries.length > 0 && entries[0].prevHash !== "GENESIS") return false;
  return true;
}
