"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  Loader2,
  Quote,
  Lightbulb,
  Wand2,
  CheckCircle2,
  Flag,
  AlertCircle,
  ShieldAlert,
  Mic,
  Palette,
  Type,
  Copyright,
  RefreshCw,
  SendHorizonal,
  Layers,
  Eye,
  MessageSquareQuote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useLang } from "@/lib/brandshield/i18n";
import "@/lib/brandshield/i18n/dict-findings";
import {
  useSession,
  useSubmissions,
  useSubmission,
  useScanSubmission,
  useResolveFinding,
  useOverrideFinding,
  useRewriteSuggestion,
  useTransitionSubmission,
} from "@/lib/brandshield/client";
import { useUIStore } from "@/lib/brandshield/store";
import { cn } from "@/lib/brandshield/utils";
import { SEVERITY_META, STATUS_META, CATEGORY_META, type Finding, type Severity } from "@/lib/brandshield/types";

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  claim: <ShieldAlert className="h-3.5 w-3.5" />,
  tone: <Mic className="h-3.5 w-3.5" />,
  visual: <Palette className="h-3.5 w-3.5" />,
  style: <Type className="h-3.5 w-3.5" />,
  trademark: <Copyright className="h-3.5 w-3.5" />,
};

export function FindingsView() {
  const { t } = useLang();
  const session = useSession();
  const submissions = useSubmissions();
  const selectedId = useUIStore((s) => s.selectedSubmissionId) ?? submissions.data?.[0]?.id ?? null;
  const { data: sub, isLoading } = useSubmission(selectedId);

  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  const scan = useScanSubmission();
  const resolve = useResolveFinding();
  const override = useOverrideFinding();
  const rewrite = useRewriteSuggestion();
  const transition = useTransitionSubmission();
  void session;

  const findings = sub?.findings ?? [];
  const openFindings = findings.filter((f) => f.status === "open");
  const visibleFindings = sevFilter === "all" ? findings : findings.filter((f) => f.severity === sevFilter);

  const isAuthor = !!sub && sub.authorId === session.data?.id;
  const canSubmitForReview = isAuthor && sub?.status === "draft" && (sub?.scanCount ?? 0) > 0;
  const openCritical = openFindings.filter((f) => f.severity === "critical").length;

  const counts = useMemo(
    () => ({
      critical: openFindings.filter((f) => f.severity === "critical").length,
      warning: openFindings.filter((f) => f.severity === "warning").length,
      minor: openFindings.filter((f) => f.severity === "minor").length,
    }),
    [openFindings]
  );

  const onApplySuggestion = async (f: Finding) => {
    if (!f.suggestion) return;
    try {
      const res = await resolve.mutateAsync({ id: f.id, suggestion: f.suggestion });
      toast.success(t("findings.toast.applied"), { description: res.contentUpdated ? t("findings.toast.appliedDesc.contentUpdated") : t("findings.toast.appliedDesc.resolved") });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("findings.toast.applyFail"));
    }
  };

  const onGenerateRewrite = async (f: Finding) => {
    try {
      const res = await rewrite.mutateAsync(f.id);
      if (!res.suggestion) {
        toast.info(t("findings.toast.noRewrite"));
        return;
      }
      await resolve.mutateAsync({ id: f.id, suggestion: res.suggestion });
      toast.success(t("findings.toast.aiApplied"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("findings.toast.rewriteFail"));
    }
  };

  const onOverride = async (f: Finding, note: string) => {
    try {
      await override.mutateAsync({ id: f.id, note });
      toast.success(t("findings.toast.overridden"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("findings.toast.overrideFail"));
    }
  };

  const onSubmitForReview = async () => {
    if (!sub) return;
    try {
      await transition.mutateAsync({ id: sub.id, action: "submit_for_review" });
      toast.success(t("findings.toast.submitted"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("findings.toast.submitFail"));
    }
  };

  const onRescan = async () => {
    if (!sub) return;
    try {
      await scan.mutateAsync(sub.id);
      toast.success(t("findings.toast.rescanDone"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("findings.toast.failed"));
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* Submission selector strip */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(submissions.data ?? []).map((s) => (
          <button
            key={s.id}
            onClick={() => { useUIStore.getState().setView("findings", s.id); setSelectedFindingId(null); }}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              s.id === selectedId ? "border-teal-600 bg-teal-700 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50"
            )}
          >
            {s.title}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", s.id === selectedId ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
              {s.findings?.filter((f) => f.status === "open").length ?? 0}
            </span>
          </button>
        ))}
        {(submissions.data ?? []).length === 0 && (
          <p className="text-sm text-slate-400">{t("findings.submissions.empty")}</p>
        )}
      </div>

      {isLoading || !sub ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("findings.loading")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* ── Left pane: annotated content ── */}
          <div className="min-w-0 space-y-4">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{sub.title}</h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {sub.authorName} · {sub.department ?? t("findings.unassigned")} · v{sub.currentVersion}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("border", STATUS_META[sub.status as keyof typeof STATUS_META]?.className)}>
                    {t(`common.status.${sub.status}`)}
                  </Badge>
                </div>

                {sub.contentType === "banner" && sub.imageData ? (
                  <BannerAnnotator sub={sub} findings={openFindings} selectedId={selectedFindingId} onSelect={setSelectedFindingId} />
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
                    <HighlightedContent content={sub.content} findings={openFindings} selectedId={selectedFindingId} onSelect={setSelectedFindingId} />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => void onRescan()} disabled={scan.isPending}>
                        {scan.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} {t("findings.action.rescan")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("findings.rescan.tooltip")}</TooltipContent>
                  </Tooltip>
                  {canSubmitForReview && (
                    <Button size="sm" className="min-h-9 gap-1.5 bg-teal-700 hover:bg-teal-800" onClick={() => void onSubmitForReview()} disabled={transition.isPending || openCritical > 0}>
                      {transition.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SendHorizonal className="h-3.5 w-3.5" />}
                      {t("findings.action.submitReview")}
                    </Button>
                  )}
                  {canSubmitForReview && openCritical > 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" /> {t("findings.blockedCritical", { n: openCritical, s: openCritical > 1 ? "s" : "" })}
                    </span>
                  )}
                  {isAuthor && sub.status === "draft" && sub.scanCount === 0 && (
                    <span className="text-xs text-slate-400">{t("findings.scanFirst")}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inspection meta */}
            {sub.inspections && sub.inspections.length > 0 && (
              <Card>
                <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600"><Layers className="h-3.5 w-3.5 text-teal-700" /> {t("findings.meta.lastInspection")}</span>
                  <span>{t("findings.meta.pipeline", { sec: (sub.inspections[0].durationMs / 1000).toFixed(1) })}</span>
                  <span>·</span>
                  <span>{t("findings.meta.stage1", { ms: String((sub.inspections[0].stageA as { durationMs?: number }).durationMs ?? "—") })}</span>
                  <span>·</span>
                  <span>{t("findings.meta.strictJson")}</span>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right pane: findings ── */}
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <FileSearch className="h-4 w-4 text-teal-700" /> {t("findings.findings.title")}
                <span className="text-xs font-normal text-slate-400">{t("findings.findings.openCount", { n: openFindings.length })}</span>
              </h3>
              <div className="flex gap-1.5">
                {(["all", "critical", "warning", "minor"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSevFilter(s)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                      sevFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {s === "all" ? t("findings.filter.all") : t(`common.severity.${s}`)}
                    {s !== "all" && counts[s] > 0 && <span className="ml-1 opacity-70">{counts[s]}</span>}
                  </button>
                ))}
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-230px)] min-h-[420px] pr-2 max-lg:h-auto">
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {visibleFindings.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Card className="border-emerald-100 bg-emerald-50/60">
                        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                          <p className="text-sm font-medium text-emerald-800">{t("findings.empty.title")}</p>
                          <p className="text-xs text-emerald-700/70">{t("findings.empty.sub")}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                  {visibleFindings.map((f) => (
                    <motion.div key={f.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
                      <FindingCard
                        finding={f}
                        selected={f.id === selectedFindingId}
                        onSelect={() => setSelectedFindingId(f.id)}
                        isAuthor={isAuthor || session.data?.role === "admin" || session.data?.role === "reviewer"}
                        busy={resolve.isPending || override.isPending || rewrite.isPending}
                        onApply={() => void onApplySuggestion(f)}
                        onGenerate={() => void onGenerateRewrite(f)}
                        onOverride={(note) => void onOverride(f, note)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline highlight rendering ──────────────────────────────────────────────

interface Segment {
  text: string;
  finding?: Finding;
}

function buildSegments(content: string, findings: Finding[]): Segment[] {
  const ranges: { start: number; end: number; finding: Finding }[] = [];
  for (const f of findings) {
    if (!f.flaggedText) continue;
    const idx = content.indexOf(f.flaggedText);
    if (idx >= 0) ranges.push({ start: idx, end: idx + f.flaggedText.length, finding: f });
  }
  ranges.sort((a, b) => a.start - b.start || b.end - a.end);
  const segs: Segment[] = [];
  let pos = 0;
  for (const r of ranges) {
    if (r.start < pos) continue;
    if (r.start > pos) segs.push({ text: content.slice(pos, r.start) });
    segs.push({ text: content.slice(r.start, r.end), finding: r.finding });
    pos = r.end;
  }
  if (pos < content.length) segs.push({ text: content.slice(pos) });
  return segs;
}

function HighlightedContent({ content, findings, selectedId, onSelect }: { content: string; findings: Finding[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const segments = useMemo(() => buildSegments(content, findings), [content, findings]);
  const paragraphs = useMemo(() => {
    const paras: Segment[][] = [[]];
    for (const seg of segments) {
      const parts = seg.text.split("\n");
      parts.forEach((p, i) => {
        if (i > 0) paras.push([]);
        if (p.length > 0) paras[paras.length - 1].push({ text: p, finding: seg.finding });
      });
    }
    return paras;
  }, [segments]);

  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
      {paragraphs.map((para, pi) => (
        <p key={pi}>
          {para.map((seg, si) =>
            seg.finding ? (
              <mark
                key={si}
                id={`hl-${seg.finding.id}`}
                onClick={() => onSelect(seg.finding!.id)}
                className={cn(
                  "cursor-pointer rounded-sm border-b-2 bg-transparent px-0.5 py-0.5 transition",
                  SEVERITY_META[seg.finding.severity].text,
                  selectedId === seg.finding.id ? "ring-2 ring-offset-1" : "hover:bg-slate-50",
                  seg.finding.severity === "critical" && (selectedId === seg.finding.id ? "ring-red-400" : "border-red-500"),
                  seg.finding.severity === "warning" && (selectedId === seg.finding.id ? "ring-amber-400" : "border-amber-500"),
                  seg.finding.severity === "minor" && (selectedId === seg.finding.id ? "ring-teal-400" : "border-teal-500")
                )}
                style={{
                  backgroundColor:
                    seg.finding.severity === "critical" ? "rgba(220,38,38,0.08)" : seg.finding.severity === "warning" ? "rgba(217,119,6,0.10)" : "rgba(13,148,136,0.08)",
                }}
              >
                {seg.text}
              </mark>
            ) : (
              <span key={si}>{seg.text}</span>
            )
          )}
        </p>
      ))}
    </div>
  );
}

function BannerAnnotator({ sub, findings, selectedId, onSelect }: { sub: { imageData: string | null; imagePalette: string[] }; findings: Finding[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const { t } = useLang();
  const colorFindings = findings.filter((f) => /^#[0-9a-fA-F]{3,8}/.test(f.flaggedText));
  const offColors = new Map(colorFindings.map((f) => [f.flaggedText.toUpperCase(), f]));
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <img src={sub.imageData ?? ""} alt={t("findings.banner.alt")} className="max-h-72 w-full object-contain" />
      </div>
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500"><Palette className="h-3.5 w-3.5 text-teal-700" /> {t("findings.banner.paletteHint")}</p>
        <div className="flex flex-wrap gap-2">
          {sub.imagePalette.map((hex) => {
            const f = offColors.get(hex.toUpperCase());
            const sev = f?.severity;
            return (
              <button
                key={hex}
                onClick={() => f && onSelect(f.id)}
                className={cn(
                  "group relative flex h-12 w-12 items-end justify-center overflow-hidden rounded-lg border-2 transition",
                  f ? (sev === "critical" ? "border-red-400" : sev === "warning" ? "border-amber-400" : "border-teal-400") : "border-slate-200",
                  f && selectedId === f.id && "ring-2 ring-offset-1 ring-slate-900"
                )}
                style={{ backgroundColor: hex }}
                title={f ? `${hex} — ${f.rationale}` : hex}
              >
                <span className="w-full bg-white/85 py-0.5 text-center font-mono text-[8px] text-slate-700">{hex}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Finding card: (a) flagged (b) citation (c) rationale (d) fix ────────────

function FindingCard({
  finding: f,
  selected,
  onSelect,
  isAuthor,
  busy,
  onApply,
  onGenerate,
  onOverride,
}: {
  finding: Finding;
  selected: boolean;
  onSelect: () => void;
  isAuthor: boolean;
  busy: boolean;
  onApply: () => void;
  onGenerate: () => void;
  onOverride: (note: string) => void;
}) {
  const { t } = useLang();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [note, setNote] = useState("");
  const meta = SEVERITY_META[f.severity];

  return (
    <Card
      onClick={onSelect}
      className={cn(
        "cursor-pointer border transition",
        selected ? "border-slate-400 shadow-md" : cn(meta.border, "hover:shadow-sm"),
        f.status !== "open" && "opacity-75"
      )}
    >
      <CardContent className="space-y-3 p-4 sm:p-5">
        {/* (a) flagged phrase */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("gap-1 border text-[10px] font-semibold uppercase tracking-wide", meta.border, meta.bg, meta.text)}>
              {t(`common.severity.${f.severity}`).split(" — ")[0]}
            </Badge>
            <Badge variant="outline" className="gap-1 border-slate-200 bg-white text-[10px] text-slate-500">
              {CATEGORY_ICON[f.category]} {t(`common.category.${f.category}`)}
            </Badge>
            {f.stage === "deterministic" && <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-400">{t("common.stage.deterministic")}</Badge>}
            {f.stage === "vision" && <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-400"><Eye className="mr-0.5 inline h-3 w-3" />{t("common.stage.vision")}</Badge>}
          </div>
          {f.status !== "open" && (
            <Badge variant="outline" className={cn("shrink-0 text-[10px]", f.status === "resolved" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-orange-200 bg-orange-50 text-orange-600")}>
              {t(`common.finding.${f.status}`)}
            </Badge>
          )}
        </div>
        <p className={cn("rounded-lg px-3 py-2 font-medium", meta.bg, meta.text)}>&ldquo;{f.flaggedText}&rdquo;</p>

        {/* (b) citation */}
        <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-600">
            <Quote className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
            <span><span className="font-semibold text-slate-700">{f.sourceDoc}</span> — {f.ruleCitation}</span>
          </p>
          {/* (c) rationale */}
          <p className="flex items-start gap-1.5 pl-[18px] text-xs leading-relaxed text-slate-500">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
            {f.rationale}
          </p>
        </div>

        {/* (d) remediation */}
        {f.status === "open" && (
          <>
            {f.suggestion ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                <p className="flex items-start gap-1.5 text-xs leading-relaxed text-emerald-900">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span><span className="font-semibold">{t("findings.fix.label")}</span> {f.suggestion}</span>
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 p-3">
                <p className="flex items-center gap-1.5 text-xs text-emerald-800">
                  <Wand2 className="h-3.5 w-3.5" /> {t("findings.rewrite.hint")}
                </p>
              </div>
            )}
            {isAuthor && (
              <div className="flex flex-wrap gap-2">
                {f.suggestion ? (
                  <Button size="sm" className="min-h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={(e) => { e.stopPropagation(); onApply(); }}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} {t("findings.action.applyFix")}
                  </Button>
                ) : (
                  <Button size="sm" className="min-h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={(e) => { e.stopPropagation(); onGenerate(); }}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} {t("findings.action.oneClickRewrite")}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="min-h-9 gap-1.5" disabled={busy} onClick={(e) => { e.stopPropagation(); setOverrideOpen(true); }}>
                  <Flag className="h-3.5 w-3.5" /> {t("findings.action.override")}
                </Button>
              </div>
            )}
          </>
        )}
        {f.status === "overridden" && f.overrideNote && (
          <p className="flex items-start gap-1.5 rounded-lg bg-orange-50 p-2.5 text-xs text-orange-700">
            <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span><span className="font-semibold">{t("findings.justification.label")}</span> {f.overrideNote}</span>
          </p>
        )}
      </CardContent>

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base"><Flag className="h-4 w-4 text-amber-600" /> {t("findings.override.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            {t("findings.override.desc")}
          </p>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("findings.override.ph")} className="min-h-[90px]" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOverrideOpen(false)}>{t("common.action.cancel")}</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={note.trim().length < 8 || busy}
              onClick={() => {
                onOverride(note.trim());
                setOverrideOpen(false);
                setNote("");
              }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t("findings.override.record")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
