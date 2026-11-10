"use client";

import { useState } from "react";
import {
  FileText,
  Figma,
  Webhook,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Send,
  Lock,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/brandshield/client";
import { cn } from "@/lib/brandshield/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitLabIntegrationCard } from "./gitlab-integration-card";

interface GoogleInspectResult {
  document: {
    title: string;
    documentId?: string;
    headingsCount: number;
    paragraphsCount: number;
  };
  audit: {
    id: string;
    passed: boolean;
    complianceScore: number;
    criticalCount: number;
    warningCount: number;
    findingsCount: number;
  };
  findings: Array<{
    category: string;
    severity: "critical" | "warning" | "minor";
    ruleCitation: string;
    flaggedText: string;
    context: string;
    suggestion: string;
  }>;
}

interface FigmaInspectResult {
  figma: {
    fileName: string;
    fileKey: string;
    nodesCount: number;
    colorsExtracted: number;
  };
  audit: {
    id: string;
    passed: boolean;
    complianceScore: number;
    criticalCount: number;
    warningCount: number;
  };
  palette: Array<{
    hex: string;
    name: string;
    occurrences: number;
    isApproved: boolean;
    closestBrandToken: string;
    deltaE: number;
  }>;
  contrastChecks: Array<{
    textHex: string;
    bgHex: string;
    ratio: number;
    passedAA: boolean;
    nodeName: string;
  }>;
  findings: Array<{
    category: string;
    severity: "critical" | "warning" | "minor";
    ruleCitation: string;
    flaggedValue: string;
    nodeName: string;
    suggestion: string;
  }>;
}

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  secretPreview: string;
  events: string[];
  active: boolean;
  deliveryCount: number;
  createdAt: string;
}

export function IntegrationsView() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("tab") === "figma" || p.get("integrations") === "figma") return "figma";
      if (p.get("tab") === "webhooks") return "webhooks";
    }
    return "gdocs";
  });

  useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("tab") === "figma" || p.get("integrations") === "figma") {
        setActiveTab("figma");
      }
    }
  });

  // ── Google Docs State ──
  const [docUrl, setDocUrl] = useState("");
  const [gdocResult, setGdocResult] = useState<GoogleInspectResult | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const googleStatusQuery = useQuery({
    queryKey: ["google-status"],
    queryFn: () =>
      api.get<{
        configured: boolean;
        connected: boolean;
        googleEmail?: string | null;
        expiresAt?: string | null;
        provider: string;
        status: string;
      }>("/api/integrations/google/status"),
  });

  const disconnectGoogle = useMutation({
    mutationFn: () => api.post<{ success: boolean }>("/api/integrations/google/disconnect"),
    onSuccess: () => {
      toast.success("Google account disconnected successfully.");
      qc.invalidateQueries({ queryKey: ["google-status"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to disconnect Google account");
    },
  });

  const inspectGdoc = useMutation({
    mutationFn: (body: { documentUrl?: string; sampleKey?: string }) =>
      api.post<GoogleInspectResult>("/api/integrations/google/inspect", body),
    onSuccess: (data) => {
      setGdocResult(data);
      toast.success(`Google Doc audited: ${data.document.title}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to inspect Google Document");
    },
  });

  // ── Figma State ──
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaResult, setFigmaResult] = useState<FigmaInspectResult | null>(null);

  const figmaStatusQuery = useQuery({
    queryKey: ["figma-status"],
    queryFn: () =>
      api.get<{
        configured: boolean;
        connected: boolean;
        figmaUserId?: string | null;
        figmaEmail?: string | null;
        figmaHandle?: string | null;
        expiresAt?: string | null;
        provider: string;
        status: string;
      }>("/api/integrations/figma/status"),
  });

  const disconnectFigma = useMutation({
    mutationFn: () => api.post<{ success: boolean }>("/api/integrations/figma/disconnect"),
    onSuccess: () => {
      toast.success("Figma account disconnected successfully.");
      qc.invalidateQueries({ queryKey: ["figma-status"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to disconnect Figma account");
    },
  });

  const inspectFigma = useMutation({
    mutationFn: (body: { fileUrl?: string; sampleKey?: string }) =>
      api.post<FigmaInspectResult>("/api/integrations/figma/inspect", body),
    onSuccess: (data) => {
      setFigmaResult(data);
      toast.success(`Figma file audited: ${data.figma.fileName}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to inspect Figma file");
    },
  });

  // ── Webhooks Query & Mutations ──
  const webhooksQuery = useQuery({
    queryKey: ["webhooks"],
    queryFn: () => api.get<{ endpoints: WebhookItem[] }>("/api/webhooks"),
  });

  const [newWhName, setNewWhName] = useState("");
  const [newWhUrl, setNewWhUrl] = useState("");

  const createWebhook = useMutation({
    mutationFn: (data: { name: string; url: string; events: string[] }) =>
      api.post<{ endpoint: WebhookItem }>("/api/webhooks", data),
    onSuccess: () => {
      toast.success("Webhook endpoint registered successfully.");
      setNewWhName("");
      setNewWhUrl("");
      qc.invalidateQueries({ queryKey: ["webhooks"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create webhook endpoint.");
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: (id: string) => api.del<{ ok: boolean }>(`/api/webhooks/${id}`),
    onSuccess: () => {
      toast.success("Webhook endpoint deleted.");
      qc.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });

  const testWebhook = useMutation({
    mutationFn: (id: string) => api.post<{ delivered: boolean; status?: number; error?: string }>(`/api/webhooks/${id}/test`),
    onSuccess: (res) => {
      if (res.delivered) {
        toast.success(`Test ping delivered! Response HTTP ${res.status}`);
      } else {
        toast.error(`Test ping failed: ${res.error || `HTTP ${res.status}`}`);
      }
      qc.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedText(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
              <Sparkles className="size-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Authoring Extensions & Webhooks
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Pre-publishing governance connectors for Google Docs, Figma Design Systems, and CI/CD Webhooks
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="gdocs" className="gap-2 rounded-lg py-2 text-xs font-semibold sm:text-sm">
            <FileText className="size-4 text-teal-700" />
            <span>Google Docs</span>
          </TabsTrigger>
          <TabsTrigger value="figma" className="gap-2 rounded-lg py-2 text-xs font-semibold sm:text-sm">
            <Figma className="size-4 text-purple-700" />
            <span>Figma Inspector</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2 rounded-lg py-2 text-xs font-semibold sm:text-sm">
            <Webhook className="size-4 text-emerald-700" />
            <span>Webhooks</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: GOOGLE DOCS ── */}
        <TabsContent value="gdocs" className="space-y-5">
          <Card className="rounded-2xl border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Google Docs Pre-Publishing Audit</CardTitle>
                    <CardDescription className="text-xs">
                      Analyze marketing copy, rule citations, tone guidelines, and prohibited claims non-destructively.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {googleStatusQuery.isLoading ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Checking connection...</span>
                    </div>
                  ) : googleStatusQuery.data?.connected ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Connected{googleStatusQuery.data.googleEmail ? `: ${googleStatusQuery.data.googleEmail}` : ""}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectGoogle.mutate()}
                        disabled={disconnectGoogle.isPending}
                        className="h-8 rounded-lg text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {disconnectGoogle.isPending ? <Loader2 className="size-3 animate-spin" /> : <LogOut className="size-3" />}
                        <span className="ml-1">Disconnect</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = "/api/integrations/google/auth";
                      }}
                      className="h-8 gap-1.5 rounded-lg text-xs"
                    >
                      <Lock className="size-3" />
                      <span>Connect Google Account</span>
                      <ExternalLink className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Paste Google Docs URL (e.g. https://docs.google.com/document/d/...)"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="h-10 rounded-xl text-xs sm:text-sm"
                />
                <Button
                  onClick={() => inspectGdoc.mutate({ documentUrl: docUrl })}
                  disabled={inspectGdoc.isPending}
                  className="h-10 shrink-0 gap-2 rounded-xl bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800"
                >
                  {inspectGdoc.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                  <span>Inspect Document</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => inspectGdoc.mutate({ sampleKey: "q3_campaign" })}
                  disabled={inspectGdoc.isPending}
                  className="h-10 shrink-0 rounded-xl text-xs"
                >
                  Load Sample Doc
                </Button>
              </div>

              {/* Document Results */}
              {gdocResult && (
                <div className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{gdocResult.document.title}</h3>
                      <p className="text-xs text-slate-500">
                        {gdocResult.document.headingsCount} headings · {gdocResult.document.paragraphsCount} paragraphs inspected
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2.5 py-1 text-xs font-bold",
                          gdocResult.audit.passed
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        )}
                      >
                        {gdocResult.audit.passed ? "COMPLIANT" : "VIOLATIONS DETECTED"}
                      </Badge>
                      <span className="text-xs font-mono font-semibold text-slate-700">
                        Score: {gdocResult.audit.complianceScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Findings list */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Governance Findings ({gdocResult.findings.length})
                    </h4>
                    {gdocResult.findings.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
                        <CheckCircle2 className="size-4" />
                        <span>All copy adheres to registered brand voice, factual claims, and naming conventions.</span>
                      </div>
                    ) : (
                      gdocResult.findings.map((f, i) => (
                        <div
                          key={i}
                          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "px-1.5 py-0 text-[10px] font-bold uppercase",
                                  f.severity === "critical"
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                )}
                              >
                                {f.severity}
                              </Badge>
                              <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-teal-800">
                                {f.ruleCitation}
                              </span>
                              <span className="text-xs font-semibold text-slate-800">
                                Flagged: &quot;{f.flaggedText}&quot;
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 italic">Context: {f.context}</p>
                            <p className="text-xs text-teal-900 font-medium">{f.suggestion}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copy(f.suggestion, `gdoc_${i}`)}
                            className="h-8 shrink-0 gap-1 rounded-lg text-xs text-slate-500 hover:text-slate-900"
                          >
                            {copiedText === `gdoc_${i}` ? <Check className="size-3 text-teal-600" /> : <Copy className="size-3" />}
                            <span>Copy Rewrite</span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: FIGMA ── */}
        <TabsContent value="figma" className="space-y-5">
          <Card className="rounded-2xl border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                    <Figma className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Figma Design Token & Contrast Auditor</CardTitle>
                    <CardDescription className="text-xs">
                      Inspect Figma frames, extract fill palettes, compute Delta-E brand token matching, and verify WCAG 2.1 contrast.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {figmaStatusQuery.isLoading ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Checking connection...</span>
                    </div>
                  ) : figmaStatusQuery.data?.connected ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-800">
                        <span className="size-2 rounded-full bg-purple-500 animate-pulse" />
                        <span>Connected{figmaStatusQuery.data.figmaHandle ? `: ${figmaStatusQuery.data.figmaHandle}` : figmaStatusQuery.data.figmaEmail ? `: ${figmaStatusQuery.data.figmaEmail}` : ""}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectFigma.mutate()}
                        disabled={disconnectFigma.isPending}
                        className="h-8 rounded-lg text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {disconnectFigma.isPending ? <Loader2 className="size-3 animate-spin" /> : <LogOut className="size-3" />}
                        <span className="ml-1">Disconnect</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = "/api/integrations/figma/auth";
                      }}
                      className="h-8 gap-1.5 rounded-lg text-xs"
                    >
                      <Lock className="size-3" />
                      <span>Connect Figma Account</span>
                      <ExternalLink className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Paste Figma File URL (e.g. https://www.figma.com/design/...)"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  className="h-10 rounded-xl text-xs sm:text-sm"
                />
                <Button
                  onClick={() => inspectFigma.mutate({ fileUrl: figmaUrl })}
                  disabled={inspectFigma.isPending}
                  className="h-10 shrink-0 gap-2 rounded-xl bg-purple-700 text-xs font-semibold text-white hover:bg-purple-800"
                >
                  {inspectFigma.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Figma className="size-3.5" />}
                  <span>Inspect File</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => inspectFigma.mutate({ sampleKey: "design_system" })}
                  disabled={inspectFigma.isPending}
                  className="h-10 shrink-0 rounded-xl text-xs"
                >
                  Load Sample UI
                </Button>
              </div>

              {/* Figma Results */}
              {figmaResult && (
                <div className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{figmaResult.figma.fileName}</h3>
                      <p className="text-xs text-slate-500">
                        {figmaResult.figma.colorsExtracted} unique colors analyzed against brand guidelines
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2.5 py-1 text-xs font-bold",
                          figmaResult.audit.passed
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        )}
                      >
                        {figmaResult.audit.passed ? "WCAG AA PASSED" : "CONTRAST/COLOR VIOLATIONS"}
                      </Badge>
                      <span className="text-xs font-mono font-semibold text-slate-700">
                        Score: {figmaResult.audit.complianceScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Palette Swatches */}
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Extracted Palette & Delta-E Brand Token Matching
                    </h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {figmaResult.palette.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
                          <span
                            className="size-8 shrink-0 rounded-lg border border-black/10 shadow-inner"
                            style={{ backgroundColor: p.hex }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-xs font-bold text-slate-800">{p.hex}</span>
                            <div className="flex items-center gap-1">
                              {p.isApproved ? (
                                <span
                                  className="truncate text-[10px] font-semibold text-emerald-700"
                                  title={`Matches approved token ${p.closestBrandToken} (ΔE = ${p.deltaE.toFixed(1)})`}
                                >
                                  Approved {p.closestBrandToken ? `(${p.closestBrandToken})` : ""}
                                </span>
                              ) : (
                                <span
                                  className="truncate text-[10px] font-semibold text-amber-700"
                                  title={`Closest approved token: ${p.closestBrandToken} (ΔE = ${p.deltaE.toFixed(1)})`}
                                >
                                  ΔE: {p.deltaE.toFixed(1)} vs {p.closestBrandToken}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contrast Matrix */}
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      WCAG 2.1 Contrast Calculations
                    </h4>
                    <div className="space-y-1.5">
                      {figmaResult.contrastChecks.map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="size-3.5 rounded border" style={{ backgroundColor: c.textHex }} />
                            <span className="font-mono font-semibold text-slate-700">{c.textHex}</span>
                            <span className="text-slate-400">on</span>
                            <span className="size-3.5 rounded border" style={{ backgroundColor: c.bgHex }} />
                            <span className="font-mono font-semibold text-slate-700">{c.bgHex}</span>
                            <span className="text-slate-500 ml-2">({c.nodeName})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{c.ratio}:1</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold",
                                c.passedAA
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-red-200 bg-red-50 text-red-700"
                              )}
                            >
                              {c.passedAA ? "AA PASS" : "FAILS AA"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Governance & Accessibility Findings */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Governance Findings ({figmaResult.findings.length})
                    </h4>
                    {figmaResult.findings.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
                        <CheckCircle2 className="size-4" />
                        <span>All Figma color tokens and contrast pairs strictly satisfy brand guidelines and WCAG 2.1 AA.</span>
                      </div>
                    ) : (
                      figmaResult.findings.map((f, i) => (
                        <div
                          key={i}
                          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "px-1.5 py-0 text-[10px] font-bold uppercase",
                                  f.severity === "critical"
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                )}
                              >
                                {f.severity}
                              </Badge>
                              <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-teal-800">
                                {f.ruleCitation}
                              </span>
                              <span className="text-xs font-semibold text-slate-800">
                                {f.nodeName}: &quot;{f.flaggedValue}&quot;
                              </span>
                            </div>
                            <p className="text-xs text-teal-900 font-medium">{f.suggestion}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copy(f.suggestion, `figma_${i}`)}
                            className="h-8 shrink-0 gap-1 rounded-lg text-xs text-slate-500 hover:text-slate-900"
                          >
                            {copiedText === `figma_${i}` ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                            <span>{copiedText === `figma_${i}` ? "Copied" : "Copy Suggestion"}</span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: WEBHOOKS & GITLAB ── */}
        <TabsContent value="webhooks" className="space-y-6">
          {/* Prominent Self-Service GitLab Integration Card */}
          <GitLabIntegrationCard />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Registered Endpoints */}
            <div className="space-y-4 lg:col-span-2">
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Active Webhook Endpoints</CardTitle>
                      <CardDescription className="text-xs">
                        Outbound events signed with HMAC-SHA256 (`x-brandshield-signature`) and protected by SSRF filtering.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => qc.invalidateQueries({ queryKey: ["webhooks"] })}
                      className="h-8 gap-1 rounded-lg text-xs"
                    >
                      <RefreshCw className="size-3" />
                      <span>Refresh</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {webhooksQuery.isLoading ? (
                    <div className="flex items-center justify-center p-8 text-xs text-slate-400">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Loading endpoints...
                    </div>
                  ) : webhooksQuery.data?.endpoints.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                      No webhook endpoints configured. Register an endpoint below to receive pre-publishing audit events.
                    </div>
                  ) : (
                    webhooksQuery.data?.endpoints.map((wh) => (
                      <div
                        key={wh.id}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{wh.name}</span>
                            <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50">
                              ACTIVE
                            </Badge>
                          </div>
                          <p className="font-mono text-xs text-slate-500 truncate max-w-sm">{wh.url}</p>
                          <p className="text-[10px] text-slate-400">
                            Secret: <span className="font-mono">{wh.secretPreview}</span> · {wh.deliveryCount} deliveries
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={testWebhook.isPending}
                            onClick={() => testWebhook.mutate(wh.id)}
                            className="h-8 gap-1 rounded-lg text-xs"
                          >
                            <Send className="size-3 text-teal-600" />
                            <span>Test Ping</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteWebhook.mutate(wh.id)}
                            className="size-8 rounded-lg text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Add Webhook Form */}
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Register New Outbound Endpoint</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newWhUrl.trim()) return;
                      createWebhook.mutate({
                        name: newWhName.trim() || "Pre-publishing Webhook",
                        url: newWhUrl.trim(),
                        events: ["*"],
                      });
                    }}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                  >
                    <Input
                      placeholder="Endpoint Name (e.g. CI/CD Gate)"
                      value={newWhName}
                      onChange={(e) => setNewWhName(e.target.value)}
                      className="h-10 rounded-xl text-xs sm:text-sm"
                    />
                    <Input
                      placeholder="Destination HTTPS URL"
                      value={newWhUrl}
                      onChange={(e) => setNewWhUrl(e.target.value)}
                      className="h-10 rounded-xl text-xs sm:text-sm"
                    />
                    <Button
                      type="submit"
                      disabled={createWebhook.isPending || !newWhUrl.trim()}
                      className="h-10 gap-1.5 rounded-xl bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800"
                    >
                      {createWebhook.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                      <span>Add Endpoint</span>
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Inbound Pre-publishing Webhook Info */}
            <div className="space-y-4">
              <Card className="rounded-2xl border-slate-200/80 bg-gradient-to-br from-slate-50 to-teal-50/30 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800">
                    <ShieldCheck className="size-4" />
                    <span>Inbound Pre-Publishing Receiver</span>
                  </div>
                  <CardTitle className="text-sm font-semibold">CI/CD & CMS Audit Webhook</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-slate-600">
                  <p>
                    Point your GitHub Actions, GitLab CI, or CMS publish triggers to this endpoint to block unapproved brand claims before publishing:
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-800 break-all select-all">
                    POST /api/webhooks/incoming/prepublish
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Payload accepts JSON with orgSlug, content, and headings. Returns immediate allowed boolean status and complianceScore.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copy(
                        `curl -X POST https://brandshield-ai-five.vercel.app/api/webhooks/incoming/prepublish -H "Content-Type: application/json" -d '{"orgSlug":"nimbus-labs","content":"Check out our new PayLinks! Guaranteed 100% risk-free.","headings":["Special Offer!!"]}'`,
                        "curl_sample"
                      )
                    }
                    className="w-full h-8 gap-1.5 rounded-xl text-xs"
                  >
                    {copiedText === "curl_sample" ? <Check className="size-3 text-teal-600" /> : <Copy className="size-3" />}
                    <span>Copy cURL Example</span>
                  </Button>
                </CardContent>
              </Card>

              {/* GitLab Pipeline Automation Architecture */}
              <Card className="rounded-2xl border-slate-200/80 bg-gradient-to-br from-slate-50 to-orange-50/20 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-700">
                    <Sparkles className="size-4 text-orange-600" />
                    <span>Automated Governance</span>
                  </div>
                  <CardTitle className="text-sm font-semibold">How BrandShield Protects GitLab Repositories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-slate-600">
                  <p>
                    When a connected project receives commits or merge requests, BrandShield automatically runs real-time compliance inspections before code is merged:
                  </p>
                  <div className="space-y-2 rounded-xl bg-white p-3 border border-slate-200">
                    <div className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">
                        1
                      </span>
                      <p className="text-[11px] text-slate-700">
                        GitLab sends webhook event to BrandShield receiver with HMAC verification and replay defense.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">
                        2
                      </span>
                      <p className="text-[11px] text-slate-700">
                        Brand governance engine scans commit messages, descriptions, and modified copy against active guidelines.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                        3
                      </span>
                      <p className="text-[11px] text-slate-700">
                        Outbound commit status (<code className="font-mono text-[10px] font-semibold text-slate-800">brandshield/governance</code>) is updated directly on GitLab. Critical violations block the merge request.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
