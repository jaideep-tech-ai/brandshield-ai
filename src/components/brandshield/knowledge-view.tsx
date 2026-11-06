"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Database,
  FileText,
  FileUp,
  History,
  Image as ImageIcon,
  Layers,
  Loader2,
  Maximize2,
  Palette,
  Plus,
  Trash2,
  Type,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import {
  useSession,
  useGuidelines,
  useCreateGuideline,
  useDeleteGuideline,
  useVisualTokens,
  useCreateVisualToken,
  useDeleteVisualToken,
} from "@/lib/brandshield/client";
import type { GuidelineDoc, VisualToken } from "@/lib/brandshield/types";
import { cn, timeAgo, readableOn } from "@/lib/brandshield/utils";
import { useLang } from "@/lib/brandshield/i18n";
import "@/lib/brandshield/i18n/dict-knowledge";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// ─── Meta maps ───────────────────────────────────────────────────────────────

// Display labels come from the i18n dict (`doctype.*` / `tokentype.*`); the
// maps below carry only styling so stored docType values (data) stay raw.
const DOC_TYPE_META: Record<string, { cls: string }> = {
  guideline: { cls: "bg-slate-100 text-slate-700 border-slate-200" },
  datasheet: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  terminology: { cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  banned_words: { cls: "bg-red-50 text-red-700 border-red-200" },
  trademark: { cls: "bg-amber-50 text-amber-700 border-amber-200" },
  tone: { cls: "bg-teal-50 text-teal-700 border-teal-200" },
};

const DOC_TYPE_DEFAULT_CLS = "bg-slate-100 text-slate-700 border-slate-200";

const TOKEN_TYPE_META: Record<string, { icon: typeof Palette }> = {
  color: { icon: Palette },
  typography: { icon: Type },
  logo: { icon: ImageIcon },
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: Math.min(i, 8) * 0.05 },
  };
}

function StatChip({ icon: Icon, label, value, iconCls }: { icon: typeof Layers; label: string; value: string | number; iconCls: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
      <Icon className={cn("h-3.5 w-3.5", iconCls)} />
      <span className="text-xs font-semibold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

// ─── View ────────────────────────────────────────────────────────────────────

export function KnowledgeView() {
  const { t, lang } = useLang();

  // Raw docType/tokenType values are stored data — translate only the display
  // label, falling back to the raw value when no dict entry exists.
  const docTypeLabel = (v: string) => {
    const key = `doctype.${v}`;
    return t(key) === key ? v : t(key);
  };
  const tokenTypeLabel = (v: string) => {
    const key = `tokentype.${v}`;
    return t(key) === key ? v : t(key);
  };

  const { data: session } = useSession();
  const isAdmin = session?.role === "admin";

  const guidelines = useGuidelines();
  const visualTokens = useVisualTokens();
  const createGuideline = useCreateGuideline();
  const deleteGuideline = useDeleteGuideline();
  const createToken = useCreateVisualToken();
  const deleteToken = useDeleteVisualToken();

  const docs = guidelines.data ?? [];
  const tokens = visualTokens.data ?? [];
  const totalChunks = docs.reduce((sum, d) => sum + (d.chunkCount ?? 0), 0);

  // Add-document dialog state
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("guideline");
  const [docContent, setDocContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full-document dialog + delete confirms
  const [fullDoc, setFullDoc] = useState<GuidelineDoc | null>(null);
  const [docToDelete, setDocToDelete] = useState<GuidelineDoc | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<VisualToken | null>(null);

  // Add-token dialog state
  const [addTokenOpen, setAddTokenOpen] = useState(false);
  const [tokenType, setTokenType] = useState("color");
  const [tokenName, setTokenName] = useState("");
  const [tokenValue, setTokenValue] = useState("");
  const [tokenSecondary, setTokenSecondary] = useState("");
  const [tokenNotes, setTokenNotes] = useState("");

  const colorTokens = tokens.filter((t) => t.tokenType === "color");
  const typographyTokens = tokens.filter((t) => t.tokenType === "typography");
  const logoTokens = tokens.filter((t) => t.tokenType === "logo");

  // ── File import ──
  const handleFileImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setDocContent(text);
      setDocTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim());
      toast.info(t("knowledge.toast.imported", { name: file.name }));
    };
    reader.onerror = () => toast.error(t("knowledge.toast.readFail"));
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Submit handlers ──
  const submitDoc = async () => {
    if (!docTitle.trim() || !docContent.trim()) {
      toast.error(t("knowledge.toast.docValidation"));
      return;
    }
    try {
      await createGuideline.mutateAsync({ title: docTitle.trim(), docType, content: docContent.trim() });
      toast.success(t("knowledge.toast.docIngested"));
      setAddDocOpen(false);
      setDocTitle("");
      setDocContent("knowledge.");
      setDocType("guideline");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("knowledge.toast.docFail"));
    }
  };

  const submitToken = async () => {
    if (!tokenName.trim() || !tokenValue.trim()) {
      toast.error(t("knowledge.toast.tokenValidation"));
      return;
    }
    if (tokenType === "color" && !HEX_RE.test(tokenValue.trim())) {
      toast.error(t("knowledge.toast.hexValidation"));
      return;
    }
    try {
      await createToken.mutateAsync({
        tokenType,
        name: tokenName.trim(),
        value: tokenValue.trim(),
        secondary: tokenSecondary.trim() || undefined,
        usageNotes: tokenNotes.trim() || undefined,
      });
      toast.success(t("knowledge.toast.tokenAdded"));
      setAddTokenOpen(false);
      setTokenName("");
      setTokenValue("");
      setTokenSecondary("");
      setTokenNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("knowledge.toast.tokenFail"));
    }
  };

  const resetTokenDialog = (type: string) => {
    setTokenType(type);
    setTokenName("");
    setTokenValue("");
    setTokenSecondary("");
    setTokenNotes("");
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{t("knowledge.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{t("knowledge.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatChip icon={FileText} label={t("knowledge.stat.documents")} value={guidelines.isLoading ? "…" : docs.length} iconCls="text-teal-700" />
          <StatChip icon={Layers} label={t("knowledge.stat.chunks")} value={guidelines.isLoading ? "…" : totalChunks} iconCls="text-emerald-600" />
          <StatChip icon={Palette} label={t("knowledge.stat.tokens")} value={visualTokens.isLoading ? "…" : tokens.length} iconCls="text-amber-600" />
        </div>
      </motion.div>

      {/* Read-only notice */}
      {!isAdmin && (
        <motion.div {...fadeUp(1)}>
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <Eye className="text-amber-600" />
            <AlertTitle>{t("knowledge.readonly.title")}</AlertTitle>
            <AlertDescription>{t("knowledge.readonly.body")}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="documents" className="gap-6">
        <TabsList className="h-auto w-fit rounded-xl bg-slate-100 p-1">
          <TabsTrigger
            value="documents"
            className="rounded-lg px-4 py-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4" /> {t("knowledge.tab.documents")}
          </TabsTrigger>
          <TabsTrigger
            value="tokens"
            className="rounded-lg px-4 py-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-sm"
          >
            <Palette className="h-4 w-4" /> {t("knowledge.tab.tokens")}
          </TabsTrigger>
        </TabsList>

        {/* ── Documents tab ── */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {guidelines.isLoading
                ? t("knowledge.docs.loading")
                : docs.length === 1
                  ? t("knowledge.docs.countedOne", { count: docs.length })
                  : t("knowledge.docs.countedMany", { count: docs.length })}
            </p>
            {isAdmin && (
              <Button size="sm" className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => setAddDocOpen(true)}>
                <Plus className="h-4 w-4" /> {t("knowledge.docs.add")}
              </Button>
            )}
          </div>

          {guidelines.isLoading ? (
            <div role="status" aria-label={t("knowledge.docs.loadingAria")} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="rounded-2xl border-slate-200 shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-28 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
                <Database className="h-6 w-6 text-teal-700" />
              </div>
              <p className="text-sm font-semibold text-slate-900">{t("knowledge.docs.empty.title")}</p>
              <p className="max-w-sm text-xs text-slate-500">
                {isAdmin ? t("knowledge.docs.empty.admin") : t("knowledge.docs.empty.viewer")}
              </p>
              {isAdmin && (
                <Button size="sm" className="mt-1 bg-teal-700 text-white hover:bg-teal-800" onClick={() => setAddDocOpen(true)}>
                  <Plus className="h-4 w-4" /> {t("knowledge.docs.empty.addFirst")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {docs.map((doc, i) => {
                const meta = DOC_TYPE_META[doc.docType];
                return (
                  <motion.div key={doc.id} {...fadeUp(i)}>
                    <Card className="flex h-full flex-col rounded-2xl border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                      <CardContent className="flex h-full flex-col gap-3 p-6">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("border", meta?.cls ?? DOC_TYPE_DEFAULT_CLS)}>
                            {docTypeLabel(doc.docType)}
                          </Badge>
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-500">
                            v{doc.version}
                          </Badge>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("knowledge.aria.deleteDoc", { title: doc.title })}
                              className="ml-auto h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              onClick={() => setDocToDelete(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold leading-snug text-slate-900">{doc.title}</h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-teal-600" />
                            {t("knowledge.docs.chunks", { count: doc.chunkCount })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <History className="h-3.5 w-3.5" />
                            {t("knowledge.docs.updated", { time: timeAgo(doc.updatedAt ?? doc.createdAt, lang) })}
                          </span>
                          {doc.sourceName && (
                            <span className="inline-flex max-w-full items-center gap-1 truncate">
                              <BookOpen className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{doc.sourceName}</span>
                            </span>
                          )}
                        </div>

                        <div className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 font-mono text-xs text-slate-600">
                          {doc.content.slice(0, 280)}
                          {doc.content.length > 280 ? "…" : ""}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-2 mt-auto self-start text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                          onClick={() => setFullDoc(doc)}
                        >
                          <Maximize2 className="h-3.5 w-3.5" /> {t("knowledge.docs.showFull")}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Visual Tokens tab ── */}
        <TabsContent value="tokens" className="space-y-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {visualTokens.isLoading
                ? t("knowledge.tokens.loading")
                : tokens.length === 1
                  ? t("knowledge.tokens.countedOne", { count: tokens.length })
                  : t("knowledge.tokens.countedMany", { count: tokens.length })}
            </p>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="border-teal-200 bg-white text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                onClick={() => {
                  resetTokenDialog("color");
                  setAddTokenOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> {t("knowledge.tokens.add")}
              </Button>
            )}
          </div>

          {visualTokens.isLoading ? (
            <div role="status" aria-label={t("knowledge.tokens.loadingAria")} className="space-y-6">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Approved Palette */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-teal-700" />
                  <h2 className="text-sm font-semibold text-slate-900">{t("knowledge.tokens.palette")}</h2>
                  <span className="text-xs text-slate-400">({colorTokens.length})</span>
                </div>
                {colorTokens.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-xs text-slate-500">
                    {t("knowledge.tokens.emptyColor")}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {colorTokens.map((token, i) => (
                      <motion.div key={token.id} {...fadeUp(i)}>
                        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                          <CardContent className="space-y-3 p-6">
                            <div
                              className="flex h-24 w-full items-end justify-between rounded-xl border border-black/5 p-3"
                              style={{ backgroundColor: token.value }}
                            >
                              <span className="font-mono text-xs font-semibold" style={{ color: readableOn(token.value) }}>
                                {token.value.toUpperCase()}
                              </span>
                              {isAdmin && (
                                <button
                                  aria-label={t("knowledge.aria.deleteToken", { name: token.name })}
                                  className="rounded-md p-1 transition-colors hover:bg-black/10"
                                  style={{ color: readableOn(token.value) }}
                                  onClick={() => setTokenToDelete(token)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium text-slate-900">{token.name}</p>
                              {token.secondary && (
                                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                                  <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: token.secondary }} />
                                  <span className="font-mono text-[10px] text-slate-500">{token.secondary.toUpperCase()}</span>
                                </span>
                              )}
                            </div>
                            {token.usageNotes && <p className="line-clamp-2 text-xs text-slate-500">{token.usageNotes}</p>}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* Typography */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-teal-700" />
                  <h2 className="text-sm font-semibold text-slate-900">{t("knowledge.tokens.typography")}</h2>
                  <span className="text-xs text-slate-400">({typographyTokens.length})</span>
                </div>
                {typographyTokens.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-xs text-slate-500">
                    {t("knowledge.tokens.emptyTypography")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {typographyTokens.map((token, i) => (
                      <motion.div key={token.id} {...fadeUp(i)}>
                        <Card className="rounded-2xl border-slate-200 shadow-sm">
                          <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-6">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                              <Type className="h-5 w-5 text-teal-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">{token.name}</p>
                              {token.usageNotes && <p className="truncate text-xs text-slate-500">{token.usageNotes}</p>}
                            </div>
                            <code className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-600">
                              {token.value}
                            </code>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("knowledge.aria.deleteToken", { name: token.name })}
                                className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                onClick={() => setTokenToDelete(token)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* Logo & Marks */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-teal-700" />
                  <h2 className="text-sm font-semibold text-slate-900">{t("knowledge.tokens.logos")}</h2>
                  <span className="text-xs text-slate-400">({logoTokens.length})</span>
                </div>
                {logoTokens.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-xs text-slate-500">
                    {t("knowledge.tokens.emptyLogo")}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {logoTokens.map((token, i) => (
                      <motion.div key={token.id} {...fadeUp(i)}>
                        <Card className="rounded-2xl border-slate-200 shadow-sm">
                          <CardContent className="flex items-center gap-4 p-6">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-2">
                              <img src={token.value} alt={token.name} className="h-16 w-16 object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">{token.name}</p>
                              {token.usageNotes && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{token.usageNotes}</p>}
                            </div>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("knowledge.aria.deleteToken", { name: token.name })}
                                className="h-8 w-8 shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                onClick={() => setTokenToDelete(token)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Document dialog ── */}
      <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{t("knowledge.addDoc.title")}</DialogTitle>
            <DialogDescription>{t("knowledge.addDoc.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="kb-title" className="text-slate-700">{t("knowledge.addDoc.titleLabel")}</Label>
              <Input
                id="kb-title"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder={t("knowledge.addDoc.titlePlaceholder")}
                className="border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700">{t("knowledge.addDoc.typeLabel")}</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-full border-slate-200">
                  <SelectValue placeholder={t("knowledge.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(DOC_TYPE_META).map((value) => (
                    <SelectItem key={value} value={value}>
                      {docTypeLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kb-content" className="text-slate-700">{t("knowledge.addDoc.contentLabel")}</Label>
              <Textarea
                id="kb-content"
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder={t("knowledge.addDoc.contentPlaceholder")}
                className="min-h-[220px] border-slate-200 font-mono text-xs"
              />
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center transition-colors hover:border-teal-500 hover:bg-teal-50/40">
              <FileUp className="h-5 w-5 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">{t("knowledge.addDoc.importLabel")}</span>
              <span className="text-[11px] text-slate-400">{t("knowledge.addDoc.importHint")}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown,.csv"
                className="hidden"
                onChange={handleFileImport}
              />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-slate-200" onClick={() => setAddDocOpen(false)}>
              {t("common.action.cancel")}
            </Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={createGuideline.isPending}
              onClick={submitDoc}
            >
              {createGuideline.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("knowledge.addDoc.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Full document dialog ── */}
      <Dialog open={!!fullDoc} onOpenChange={(o) => !o && setFullDoc(null)}>
        <DialogContent className="max-h-[92vh] overflow-hidden rounded-2xl sm:max-w-2xl">
          {fullDoc && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("border", DOC_TYPE_META[fullDoc.docType]?.cls ?? DOC_TYPE_DEFAULT_CLS)}>
                    {docTypeLabel(fullDoc.docType)}
                  </Badge>
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-500">
                    v{fullDoc.version}
                  </Badge>
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] text-slate-500">
                    {t("knowledge.docs.chunks", { count: fullDoc.chunkCount })}
                  </Badge>
                </div>
                <DialogTitle className="pt-1 text-slate-900">{fullDoc.title}</DialogTitle>
                <DialogDescription>{t("knowledge.fullDoc.description")}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-600">
                <div className="whitespace-pre-wrap">{fullDoc.content}</div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add Token dialog ── */}
      <Dialog open={addTokenOpen} onOpenChange={setAddTokenOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{t("knowledge.addToken.title")}</DialogTitle>
            <DialogDescription>{t("knowledge.addToken.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-700">{t("knowledge.addToken.typeLabel")}</Label>
              <Select value={tokenType} onValueChange={setTokenType}>
                <SelectTrigger className="w-full border-slate-200">
                  <SelectValue placeholder={t("knowledge.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(TOKEN_TYPE_META).map((value) => (
                    <SelectItem key={value} value={value}>
                      {tokenTypeLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tok-name" className="text-slate-700">{t("knowledge.addToken.nameLabel")}</Label>
              <Input
                id="tok-name"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder={
                  tokenType === "color"
                    ? t("knowledge.addToken.namePlaceholderColor")
                    : tokenType === "typography"
                      ? t("knowledge.addToken.namePlaceholderTypography")
                      : t("knowledge.addToken.namePlaceholderLogo")
                }
                className="border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tok-value" className="text-slate-700">
                {tokenType === "color" ? t("knowledge.addToken.valueHex") : tokenType === "typography" ? t("knowledge.addToken.valueFont") : t("knowledge.addToken.valueUrl")}
              </Label>
              {tokenType === "color" ? (
                <div className="flex items-center gap-2">
                  <Input
                    id="tok-value"
                    value={tokenValue}
                    onChange={(e) => setTokenValue(e.target.value)}
                    placeholder="#0F766E"
                    className="border-slate-200 font-mono"
                  />
                  {HEX_RE.test(tokenValue.trim()) && (
                    <span
                      className="h-9 w-9 shrink-0 rounded-md border border-slate-200"
                      style={{ backgroundColor: tokenValue.trim() }}
                      aria-hidden
                    />
                  )}
                </div>
              ) : (
                <Input
                  id="tok-value"
                  value={tokenValue}
                  onChange={(e) => setTokenValue(e.target.value)}
                  placeholder={tokenType === "typography" ? "Inter, 'Helvetica Neue', sans-serif" : "https://cdn.example.com/logo.svg"}
                  className="border-slate-200 font-mono text-xs"
                />
              )}
            </div>

            {tokenType === "color" && (
              <div className="space-y-1.5">
                <Label htmlFor="tok-secondary" className="text-slate-700">
                  {t("knowledge.addToken.secondaryLabel")} <span className="font-normal text-slate-400">{t("knowledge.optional")}</span>
                </Label>
                <Input
                  id="tok-secondary"
                  value={tokenSecondary}
                  onChange={(e) => setTokenSecondary(e.target.value)}
                  placeholder="#F0FDFA"
                  className="border-slate-200 font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="tok-notes" className="text-slate-700">
                {t("knowledge.addToken.notesLabel")} <span className="font-normal text-slate-400">{t("knowledge.optional")}</span>
              </Label>
              <Textarea
                id="tok-notes"
                value={tokenNotes}
                onChange={(e) => setTokenNotes(e.target.value)}
                placeholder={t("knowledge.addToken.notesPlaceholder")}
                className="min-h-[72px] border-slate-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-slate-200" onClick={() => setAddTokenOpen(false)}>
              {t("common.action.cancel")}
            </Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={createToken.isPending}
              onClick={submitToken}
            >
              {createToken.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("knowledge.addToken.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete document confirm ── */}
      <AlertDialog open={!!docToDelete} onOpenChange={(o) => !o && setDocToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">{t("knowledge.delDoc.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("knowledge.delDoc.body", { title: docToDelete?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200">{t("common.action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteGuideline.isPending}
              onClick={async () => {
                if (!docToDelete) return;
                try {
                  await deleteGuideline.mutateAsync(docToDelete.id);
                  toast.success(t("knowledge.toast.docDeleted"));
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : t("knowledge.toast.deleteFail"));
                }
                setDocToDelete(null);
              }}
            >
              {deleteGuideline.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete token confirm ── */}
      <AlertDialog open={!!tokenToDelete} onOpenChange={(o) => !o && setTokenToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">{t("knowledge.delTok.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("knowledge.delTok.body", { name: tokenToDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200">{t("common.action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteToken.isPending}
              onClick={async () => {
                if (!tokenToDelete) return;
                try {
                  await deleteToken.mutateAsync(tokenToDelete.id);
                  toast.success(t("knowledge.toast.tokenDeleted"));
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : t("knowledge.toast.deleteFail"));
                }
                setTokenToDelete(null);
              }}
            >
              {deleteToken.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default KnowledgeView;
