"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanSearch,
  FileText,
  ImageIcon,
  Loader2,
  ShieldCheck,
  Zap,
  BrainCircuit,
  Eye,
  AlertTriangle,
  CircleCheck,
  Gauge,
  ArrowRight,
  Info,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useCreateSubmission,
  useScanSubmission,
  useSession,
  useSubmissions,
  ApiRequestError,
} from "@/lib/brandshield/client";
import { useUIStore } from "@/lib/brandshield/store";
import { cn, extractImagePalette, timeAgo } from "@/lib/brandshield/utils";
import { SEVERITY_META, type StageAResult, type StageBResult, type Severity } from "@/lib/brandshield/types";

interface ScanOutcome {
  submissionId: string;
  score: number;
  stageA: StageAResult;
  stageB: StageBResult;
  counts: Record<Severity, number>;
  durationMs: number;
}

export function ScannerView() {
  const session = useSession();
  const setView = useUIStore((s) => s.setView);
  const createSubmission = useCreateSubmission();
  const scan = useScanSubmission();
  const submissions = useSubmissions();

  const [tab, setTab] = useState("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [pipelineStep, setPipelineStep] = useState(0); // 0 idle, 1 stage A, 2 stage B, 3 done
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const onFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a PNG, JPG or WebP banner image");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Image must be under 6 MB");
      return;
    }
    try {
      const { palette: p, dataUrl } = await extractImagePalette(file);
      setImageData(dataUrl);
      setPalette(p);
      toast.success(`Banner loaded — ${p.length} dominant colors extracted`);
    } catch {
      toast.error("Could not read that image");
    }
  }, []);

  const runScan = async () => {
    if (!outcome && tab === "text" && !title.trim()) {
      toast.error("Give your draft a title first");
      return;
    }
    if (!outcome && tab === "banner" && (!title.trim() || !imageData)) {
      toast.error("Add a title and upload a banner image first");
      return;
    }
    setOutcome(null);
    setPipelineStep(1);
    const timer1 = setTimeout(() => setPipelineStep((p) => (p < 2 ? 2 : p)), 600);
    try {
      let submissionId: string;
      if (outcome) {
        submissionId = outcome.submissionId;
      } else {
        const sub = await createSubmission.mutateAsync({
          title: title.trim(),
          contentType: tab,
          content: tab === "text" ? content : `Banner headline: ${title.trim()}`,
          imageData: imageData ?? undefined,
          imagePalette: palette.length ? palette : undefined,
          creatorNote: note.trim() || undefined,
          department: session.data?.department ?? undefined,
        });
        submissionId = sub.id;
      }
      const res = await scan.mutateAsync(submissionId);
      clearTimeout(timer1);
      setPipelineStep(3);
      const stageA = res.inspection.stageA as StageAResult;
      const stageB = res.inspection.stageB as StageBResult;
      const counts: Record<Severity, number> = { critical: 0, warning: 0, minor: 0 };
      for (const f of res.submission.findings ?? []) if (f.status === "open") counts[f.severity]++;
      setOutcome({
        submissionId,
        score: res.inspection.complianceScore,
        stageA,
        stageB,
        counts,
        durationMs: res.inspection.durationMs,
      });
      toast.success(`Pre-flight complete — compliance score ${res.inspection.complianceScore}/100`);
    } catch (e) {
      clearTimeout(timer1);
      setPipelineStep(0);
      if (e instanceof ApiRequestError && e.status === 402) {
        toast.error(e.message, {
          description: "Open Billing to upgrade your plan.",
          action: session.data?.role === "admin" ? { label: "Go to Billing", onClick: () => setView("billing") } : undefined,
          duration: 8000,
        });
      } else {
        toast.error(e instanceof Error ? e.message : "Scan failed");
      }
    }
  };

  const reset = () => {
    setOutcome(null);
    setPipelineStep(0);
    setTitle("");
    setContent("");
    setNote("");
    setImageData(null);
    setPalette([]);
  };

  const myRecent = (submissions.data ?? []).slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700">
              <ScanSearch className="h-5 w-5" />
            </span>
            Pre-Flight Scanner
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Two-stage hybrid inspection — deterministic pre-filter, then RAG claim verification &amp; vision audit.
          </p>
        </div>
        {session.data?.zeroDataRetention && (
          <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" /> ZDR On — drafts never used for model training
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Composer */}
        <Card className="min-w-0 lg:col-span-3">
          <CardContent className="p-5 sm:p-6">
            <Tabs value={tab} onValueChange={(v) => { setTab(v); reset(); }}>
              <TabsList className="grid w-full grid-cols-2 rounded-xl">
                <TabsTrigger value="text" className="gap-1.5"><FileText className="h-4 w-4" /> Copy / Document</TabsTrigger>
                <TabsTrigger value="banner" className="gap-1.5"><ImageIcon className="h-4 w-4" /> Promotional Banner</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="scan-title">Draft title</Label>
                  <Input id="scan-title" placeholder="e.g. Spring Boost Campaign — Email Hero" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="scan-content">Campaign copy (Markdown supported)</Label>
                    <span className={cn("text-xs", wordCount > 350 ? "text-amber-600" : "text-slate-400")}>{wordCount} words</span>
                  </div>
                  <Textarea
                    id="scan-content"
                    placeholder="Paste or write the copy for pre-flight inspection…&#10;&#10;Try: “Our merchants see 10x ROI — guaranteed. nimbuspay is the world's best payment platform!!!”"
                    className="min-h-[220px] font-[450] leading-relaxed"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="banner" className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="scan-banner-title">Banner title</Label>
                  <Input id="scan-banner-title" placeholder="e.g. Summer Splash — Social Banner" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onFile(f);
                    e.target.value = "";
                  }}
                />
                {!imageData ? (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/50 px-6 py-10 text-center transition hover:border-teal-400 hover:bg-teal-50"
                  >
                    <UploadCloud className="h-8 w-8 text-teal-600" />
                    <span className="text-sm font-medium text-teal-800">Upload a promotional banner</span>
                    <span className="text-xs text-teal-600/80">PNG, JPG or WebP · palette + WCAG contrast are extracted automatically</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl border border-slate-200">
                                    <img src={imageData} alt="Banner preview" className="max-h-64 w-full object-contain" />
                      <Button size="icon" variant="secondary" className="absolute right-2 top-2 h-7 w-7" onClick={() => { setImageData(null); setPalette([]); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {palette.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-slate-500">Extracted dominant palette (client-side canvas)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {palette.map((hex) => (
                            <span key={hex} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600 shadow-sm">
                              <span className="h-4 w-4 rounded border border-slate-200" style={{ backgroundColor: hex }} />
                              {hex.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="scan-note">Context note for reviewers (optional)</Label>
              <Input id="scan-note" placeholder="e.g. Hero copy for the spring re-engagement email" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={() => void runScan()} disabled={createSubmission.isPending || scan.isPending} className="min-h-11 gap-2 bg-teal-700 px-5 hover:bg-teal-800">
                {createSubmission.isPending || scan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Run Pre-Flight Scan
              </Button>
              {outcome && (
                <Button variant="ghost" onClick={reset} className="min-h-11">New scan</Button>
              )}
              <span className="text-xs text-slate-400">Stage 1 is token-free &lt;100ms · Stage 2 uses grounded LLM + vision</span>
            </div>

            {/* Pipeline progress */}
            <AnimatePresence>
              {(createSubmission.isPending || scan.isPending || pipelineStep > 0) && !outcome && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <PipelineRow active={pipelineStep >= 1} done={pipelineStep >= 3} icon={<Zap className="h-4 w-4" />} label="Stage 1 — Deterministic Pre-Filter" detail="Banned terms · trademark glyphs · claim extraction · hex discovery" />
                    <PipelineRow active={pipelineStep >= 2} done={pipelineStep >= 3} icon={<BrainCircuit className="h-4 w-4" />} label="Stage 2 — Hybrid RAG + Vision Verification" detail="Dense-sparse retrieval · claim verdicts · tone scoring · WCAG math" delay={0.1} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Right rail: results / recent */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <AnimatePresence mode="wait">
            {outcome ? (
              <motion.div key="outcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
                <ScoreCard score={outcome.score} counts={outcome.counts} durationMs={outcome.durationMs} />
                <StageACard stageA={outcome.stageA} />
                <Card>
                  <CardContent className="space-y-3 p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <BrainCircuit className="h-4 w-4 text-teal-700" /> Stage 2 — Grounded verification
                    </h3>
                    {outcome.stageB.claimVerdicts.length > 0 ? (
                      <ul className="space-y-2">
                        {outcome.stageB.claimVerdicts.map((v, i) => (
                          <li key={i} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-slate-700">{v.claim.slice(0, 70)}{v.claim.length > 70 ? "…" : ""}</span>
                              <Badge variant="outline" className={cn("shrink-0 text-[10px]", v.verdict === "SUPPORTED" && "border-emerald-200 bg-emerald-50 text-emerald-700", v.verdict === "UNSUPPORTED" && "border-red-200 bg-red-50 text-red-700", v.verdict === "UNVERIFIABLE" && "border-slate-200 bg-slate-50 text-slate-500")}>{v.verdict}</Badge>
                            </div>
                            {v.citation && <p className="mt-1 text-[11px] italic text-slate-500">“{v.citation.slice(0, 110)}{v.citation.length > 110 ? "…" : ""}”</p>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500">No numeric claims detected for RAG verification.</p>
                    )}
                    {outcome.stageB.tone && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-600">Persona voice score</span>
                          <span className={cn("font-semibold", outcome.stageB.tone.score >= 80 ? "text-emerald-600" : outcome.stageB.tone.score >= 60 ? "text-amber-600" : "text-red-600")}>{outcome.stageB.tone.score}/100</span>
                        </div>
                        <Progress value={outcome.stageB.tone.score} className="h-1.5" />
                        <p className="text-[11px] leading-relaxed text-slate-500">{outcome.stageB.tone.voiceSummary}</p>
                      </>
                    )}
                    {outcome.stageB.vision && (
                      <>
                        <Separator />
                        <div className="space-y-2 text-xs">
                          <p className="flex items-center gap-1.5 font-medium text-slate-600"><Eye className="h-3.5 w-3.5 text-teal-700" /> Vision audit</p>
                          <p className="leading-relaxed text-slate-500">{outcome.stageB.vision.summary}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {outcome.stageB.vision.dominantColors.map((hex) => {
                              const off = outcome.stageB?.vision?.offBrandColors.includes(hex);
                              return (
                                <span key={hex} className={cn("flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px]", off ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 bg-white text-slate-500")}>
                                  <span className="h-3 w-3 rounded-sm border" style={{ backgroundColor: hex }} />
                                  {hex}
                                  {off && <AlertTriangle className="h-3 w-3" />}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Button onClick={() => setView("findings", outcome.submissionId)} className="w-full min-h-11 gap-2 bg-teal-700 hover:bg-teal-800">
                  Open explainable findings <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-slate-800">Recent submissions</h3>
                    {submissions.isLoading ? (
                      <div className="mt-3 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
                    ) : myRecent.length === 0 ? (
                      <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center">
                        <Info className="h-5 w-5 text-slate-300" />
                        <p className="text-xs text-slate-400">Nothing yet — run your first pre-flight scan.</p>
                      </div>
                    ) : (
                      <ul className="mt-3 space-y-1.5">
                        {myRecent.map((s) => (
                          <li key={s.id}>
                            <button
                              onClick={() => setView("findings", s.id)}
                              className="flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-medium text-slate-700">{s.title}</span>
                                <span className="text-[10px] text-slate-400">{s.contentType === "banner" ? "Banner" : "Copy"} · {timeAgo(s.updatedAt)}</span>
                              </span>
                              {s.complianceScore !== null && (
                                <Badge variant="outline" className={cn("shrink-0 text-[10px]", s.complianceScore >= 85 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : s.complianceScore >= 60 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700")}>
                                  {s.complianceScore}
                                </Badge>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
                <Card className="mt-4 border-teal-100 bg-teal-50/50">
                  <CardContent className="flex gap-3 p-4">
                    <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                    <p className="text-xs leading-relaxed text-teal-900/80">
                      Every flag must cite a verbatim guideline clause before it can fire — no black-box scores, no arbitrary rejections.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PipelineRow({ active, done, icon, label, detail, delay = 0 }: { active: boolean; done: boolean; icon: React.ReactNode; label: string; detail: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={active ? { opacity: 1, x: 0 } : { opacity: 0.45, x: 0 }} transition={{ delay }} className="flex items-center gap-3">
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", done ? "bg-emerald-100 text-emerald-700" : active ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400")}>
        {done ? <CircleCheck className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </span>
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", active ? "text-slate-800" : "text-slate-400")}>{label}</p>
        <p className="truncate text-[11px] text-slate-400">{detail}</p>
      </div>
    </motion.div>
  );
}

function ScoreCard({ score, counts, durationMs }: { score: number; counts: Record<Severity, number>; durationMs: number }) {
  const tone = score >= 85 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";
  const ring = score >= 85 ? "stroke-emerald-500" : score >= 60 ? "stroke-amber-500" : "stroke-red-500";
  const circumference = 2 * Math.PI * 34;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="7" className="stroke-slate-100" />
            <motion.circle
              cx="40" cy="40" r="34" fill="none" strokeWidth="7" strokeLinecap="round"
              className={ring}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-xl font-bold", tone)}>{score}</span>
            <span className="text-[9px] uppercase tracking-wide text-slate-400">score</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-700"><span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_META.critical.dot)} /> {counts.critical} critical</Badge>
            <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700"><span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_META.warning.dot)} /> {counts.warning} warnings</Badge>
            <Badge variant="outline" className="gap-1 border-teal-200 bg-teal-50 text-teal-700"><span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_META.minor.dot)} /> {counts.minor} minor</Badge>
          </div>
          <p className="text-[11px] text-slate-400">Full pipeline in {(durationMs / 1000).toFixed(1)}s · strict JSON citations enforced</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StageACard({ stageA }: { stageA: StageAResult }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="flex items-center justify-between text-sm font-semibold text-slate-800">
          <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Stage 1 — Deterministic Pre-Filter</span>
          <Badge variant="outline" className="text-[10px] text-slate-500">{stageA.durationMs} ms</Badge>
        </h3>
        <ul className="mt-3 space-y-1.5">
          {stageA.checks.map((c) => (
            <li key={c.name} className="flex items-center justify-between rounded-lg bg-slate-50/70 px-2.5 py-1.5 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                {c.passed ? <CircleCheck className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                {c.name}
              </span>
              <span className="font-mono text-[10px] text-slate-400">{c.count} · {c.ms}ms</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
