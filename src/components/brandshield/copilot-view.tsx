"use client";

import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  FileText,
  ShieldCheck,
  RotateCcw,
  Bot,
  UserRound,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Palette,
  AlertCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  Square,
  MessageSquare,
  History,
  Layers,
  ArrowRight,
  FileSearch,
  CheckCircle2,
  Lock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useSession } from "@/lib/brandshield/client";
import { useLang } from "@/lib/brandshield/i18n";
import { useUIStore, type ViewKey } from "@/lib/brandshield/store";
import { cn } from "@/lib/brandshield/utils";
import type { Role } from "@/lib/brandshield/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Citation {
  documentTitle: string;
  pageNumber: number;
  ruleTag: string | null;
  textSnippet: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: string;
}

interface ChatSessionItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

// ─── Role-Specific Prompt Starters ───────────────────────────────────────────

const ROLE_PROMPTS: Record<Role, { icon: typeof Sparkles; label: string; labelHi: string; query: string }[]> = {
  admin: [
    {
      icon: ShieldCheck,
      label: "Summarize org compliance health",
      labelHi: "संगठन अनुपालन स्वास्थ्य का सारांश",
      query: "Summarize our organization-wide compliance health and active audit chains.",
    },
    {
      icon: Layers,
      label: "How to connect GitLab webhook?",
      labelHi: "GitLab वेबहुक कैसे कनेक्ट करें?",
      query: "How do I connect our GitLab repository for automated pre-publishing audits?",
    },
    {
      icon: AlertCircle,
      label: "Explain rule friction radar",
      labelHi: "नियम घर्षण रडार को समझाइए",
      query: "Explain what rule friction means and how ambiguous brand rules are detected.",
    },
    {
      icon: BookOpen,
      label: "Approved visual tokens",
      labelHi: "स्वीकृत दृश्य टोकन",
      query: "List all approved brand color tokens and typography specifications.",
    },
  ],
  reviewer: [
    {
      icon: AlertCircle,
      label: "Explain critical claim violations",
      labelHi: "गंभीर दावा उल्लंघनों को समझाइए",
      query: "Explain the critical claim rules and how FACT PD-09 applies to performance metrics.",
    },
    {
      icon: Palette,
      label: "Check button contrast ratio",
      labelHi: "बटन कंट्रास्ट अनुपात की जाँच करें",
      query: "Check contrast for primary button (#0F766E on #FFFFFF) against WCAG 2.1 AA.",
    },
    {
      icon: FileSearch,
      label: "How do I override a finding?",
      labelHi: "निष्कर्ष को कैसे ओवरराइड करें?",
      query: "What is the procedure for recording an override with audit justification?",
    },
    {
      icon: ShieldCheck,
      label: "Trademark glyph rules (® / ™)",
      labelHi: "ट्रेडमार्क ग्लिफ़ नियम (® / ™)",
      query: "What are our official registered trademark glyph requirements for NimbusPay?",
    },
  ],
  creator: [
    {
      icon: Sparkles,
      label: "Help me improve headline copy",
      labelHi: "हेडलाइन कॉपी सुधारने में मदद करें",
      query: "How can I rewrite this promotional headline to be friendly-expert and avoid banned words?",
    },
    {
      icon: Layers,
      label: "How do I upload a banner image?",
      labelHi: "बैनर चित्र कैसे अपलोड करें?",
      query: "How do I upload a creative banner image and review its contrast inspection?",
    },
    {
      icon: AlertCircle,
      label: "Explain my latest scan score",
      labelHi: "मेरा नवीनतम स्कैन स्कोर समझाइए",
      query: "What causes an asset compliance score to drop below 85, and how do I fix it?",
    },
    {
      icon: CheckCircle2,
      label: "How to submit for approval?",
      labelHi: "अनुमोदन हेतु कैसे सबमिट करें?",
      query: "What are the steps to submit my cleaned draft to the Review Desk for approval?",
    },
  ],
  contractor: [
    {
      icon: ShieldCheck,
      label: "Explain the cryptographic audit chain",
      labelHi: "क्रिप्टोग्राफिक ऑडिट चेन समझाइए",
      query: "Explain how the SHA-256 tamper-evident audit log works for client governance.",
    },
    {
      icon: FileSearch,
      label: "Summarize latest findings",
      labelHi: "नवीनतम निष्कर्षों का सारांश",
      query: "What are the most common findings flagged during pre-flight evaluation?",
    },
    {
      icon: Palette,
      label: "Client-approved color tokens",
      labelHi: "क्लाइंट-स्वीकृत रंग टोकन",
      query: "What are the client's official approved brand colors and WCAG requirements?",
    },
    {
      icon: Lock,
      label: "Can I edit assets in the sandbox?",
      labelHi: "क्या मैं सैंडबॉक्स में बदलाव कर सकता हूँ?",
      query: "Explain the read-only sandbox safety guarantees for agency deliverables.",
    },
  ],
};

export function CopilotView() {
  const session = useSession();
  const { t, lang } = useLang();
  const setView = useUIStore((s) => s.setView);
  const user = session.data;
  const role: Role = user?.role ?? "creator";
  const isHindi = lang === "hi";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>("New Conversation");
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starters = useMemo(() => ROLE_PROMPTS[role] ?? ROLE_PROMPTS.creator, [role]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: isHindi
            ? `👋 **AI ब्रांड शासन कोपायलट में आपका स्वागत है!**

मैं आपका वास्तविक समय अनुपालन सहायक हूँ, जो आपकी संस्था के इंडेक्स किए गए दिशानिर्देशों, विज़ुअल टोकन और WCAG 2.1 मानकों से सीधे जुड़ा है।

**आपकी भूमिका**: \`${role.toUpperCase()}\`। मुझसे ब्रांड आवाज़, स्वीकृत रंग पैलेट, टाइपोग्राफी, दावों के सत्यापन या ट्रेडमार्क नियमों के बारे में कुछ भी पूछें।`
            : `👋 **Welcome to the AI Brand Governance Copilot!**

I am your real-time compliance assistant, wired directly to your organization's indexed guideline rulebooks, brand visual tokens, and WCAG 2.1 criteria.

**Your Role**: \`${role.toUpperCase()}\`. Ask me anything about brand voice, approved color palettes, typography specifications, claim verification, or step-by-step app navigation.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [role, isHindi]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch session list
  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/copilot/chat");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSessions(data);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [sessionId]);

  // Load a session
  const loadSession = async (id: string) => {
    setLoading(true);
    setHistoryOpen(false);
    try {
      const res = await fetch(`/api/copilot/chat?sessionId=${id}`);
      if (!res.ok) throw new Error("Could not load session");
      const data = await res.json();
      setSessionId(data.id);
      setSessionTitle(data.title || "Conversation");
      setMessages(
        data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          citations: m.citations,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  // Start fresh conversation
  const handleNewConversation = () => {
    setSessionId(null);
    setSessionTitle("New Conversation");
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content: isHindi
          ? `👋 **नया सत्र शुरू हुआ।** आज मैं आपकी ब्रांड अनुपालन या WCAG पहुंच मानकों में कैसे सहायता कर सकता हूँ?`
          : `👋 **Fresh Brand Governance Session Started.** How can I assist you with brand compliance, claim verification, or WCAG accessibility today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.info(isHindi ? "नया सत्र प्रारंभ हुआ" : "Started new conversation");
  };

  // Delete session
  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/copilot/chat?sessionId=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete session");
      toast.success(isHindi ? "सत्र हटा दिया गया" : "Conversation deleted");
      if (sessionId === id) handleNewConversation();
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  // Rename session
  const handleRenameSession = async () => {
    if (!sessionId || !renameText.trim()) return;
    try {
      const res = await fetch("/api/copilot/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, title: renameText.trim() }),
      });
      if (!res.ok) throw new Error("Could not rename");
      setSessionTitle(renameText.trim());
      setRenameModalOpen(false);
      fetchSessions();
      toast.success("Conversation renamed");
    } catch (err: any) {
      toast.error(err.message || "Failed to rename");
    }
  };

  // Stop generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      toast.info("Response generation stopped");
    }
  };

  // Send message
  async function handleSend(queryText?: string) {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    setInput("");
    setLastUserMessage(textToSend);

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          sessionId: sessionId || undefined,
          lang: isHindi ? "hi" : "en",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to query brand copilot.");
      }

      const data = await res.json();
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
        setSessionTitle(textToSend.slice(0, 32));
      }

      const assistantMsg: ChatMessage = {
        id: data.messageId || "a-" + Date.now(),
        role: "assistant",
        content: data.reply,
        citations: data.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      const errMsg = err instanceof Error ? err.message : "Network error";
      toast.error(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `⚠️ **Governance Query Notice**: ${errMsg}. Please check your connection or verify that brand guidelines are indexed.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }

  // Retry last message
  const handleRetry = () => {
    if (lastUserMessage) {
      handleSend(lastUserMessage);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-5xl flex-col px-3 py-2 sm:px-6 md:h-[calc(100vh-6.5rem)]">
      {/* ── Top Header Bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-700 to-emerald-600 text-white shadow-sm sm:size-10">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base md:text-lg">
                Brand Governance Copilot
              </h1>
              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[10px] font-semibold text-teal-800">
                Vector-RAG Active
              </Badge>
            </div>
            <p className="truncate text-[11px] text-slate-500 sm:text-xs">
              {sessionTitle} · <span className="uppercase text-teal-700 font-bold">{role}</span> Context
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {sessionId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRenameText(sessionTitle);
                setRenameModalOpen(true);
              }}
              className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800"
              title="Rename conversation"
            >
              <Edit2 className="size-3.5" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNewConversation}
            className="h-8 gap-1.5 border-teal-200 text-xs font-semibold text-teal-800 hover:bg-teal-50"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">{isHindi ? "नया चैट" : "New Chat"}</span>
          </Button>

          {/* Conversation History Drawer */}
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs text-slate-500 hover:text-slate-800">
                <History className="size-4" />
                <span className="hidden md:inline">{isHindi ? "इतिहास" : "History"}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[310px] sm:w-[380px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <History className="size-4 text-teal-700" />
                  {isHindi ? "बातचीत इतिहास" : "Conversation History"}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                <Button
                  onClick={() => {
                    handleNewConversation();
                    setHistoryOpen(false);
                  }}
                  className="w-full gap-2 bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800"
                >
                  <Plus className="size-3.5" />
                  {isHindi ? "नया सत्र शुरू करें" : "Start Fresh Conversation"}
                </Button>

                <ScrollArea className="h-[calc(100vh-160px)] pr-2">
                  <div className="space-y-1.5 pt-2">
                    {sessions.length === 0 && (
                      <p className="py-6 text-center text-xs text-slate-400">
                        {isHindi ? "कोई पूर्व बातचीत नहीं मिली" : "No previous conversations found"}
                      </p>
                    )}
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => loadSession(s.id)}
                        className={cn(
                          "group flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs transition",
                          s.id === sessionId
                            ? "border-teal-300 bg-teal-50/70 font-semibold text-teal-900 shadow-sm"
                            : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-xs text-slate-900">{s.title || "Conversation"}</p>
                          <p className="text-[10px] text-slate-400">{new Date(s.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(s.id);
                          }}
                          className="rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ── Main Chat Scroll Area ── */}
      <ScrollArea className="flex-1 pr-1 sm:pr-3">
        <div className="space-y-4 py-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-2.5 sm:gap-3",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar Icon */}
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-xl text-white shadow-sm sm:size-8",
                    isUser ? "bg-teal-700" : "bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-slate-700"
                  )}
                >
                  {isUser ? <UserRound className="size-4" /> : <Bot className="size-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "relative max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm sm:max-w-[78%] sm:p-4 sm:text-sm",
                    isUser
                      ? "rounded-tr-none bg-teal-700 text-white"
                      : "rounded-tl-none border border-slate-200/80 bg-white text-slate-800"
                  )}
                >
                  <div className="prose prose-sm max-w-none break-words text-inherit">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="mb-2 list-disc pl-4" {...props} />,
                        ol: ({ node, ...props }) => <ol className="mb-2 list-decimal pl-4" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                        code: ({ node, ...props }) => (
                          <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-[11px]" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Ground-Truth Citations Pill Strip */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-2.5">
                      <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                        <FileText className="size-3" />
                        {isHindi ? "सत्यापित स्रोत उद्धरण" : "Verified Source Citations"}
                      </p>
                      <div className="mt-1.5 space-y-1.5">
                        {msg.citations.map((c, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-teal-100 bg-teal-50/50 p-2 text-[11px] leading-snug text-slate-700 break-words"
                          >
                            <span className="font-semibold text-teal-900 break-words">{c.documentTitle}</span>
                            <span className="text-slate-400"> · Page {c.pageNumber}</span>
                            {c.ruleTag && (
                              <Badge variant="outline" className="ml-1.5 border-teal-200 bg-white text-[9px] font-bold text-teal-800">
                                {c.ruleTag}
                              </Badge>
                            )}
                            <p className="mt-0.5 italic text-slate-500 break-words">&ldquo;{c.textSnippet}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Footer: Timestamp & Copy Button */}
                  <div
                    className={cn(
                      "mt-2 flex items-center justify-between text-[10px]",
                      isUser ? "text-teal-200" : "text-slate-400"
                    )}
                  >
                    <span>{msg.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="inline-flex items-center gap-1 rounded p-1 transition hover:opacity-100 opacity-70"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm sm:size-8">
                <Bot className="size-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
                <Loader2 className="size-4 animate-spin text-teal-700" />
                <span>{isHindi ? "ब्रांड दिशानिर्देशों का विश्लेषण हो रहा है..." : "Auditing brand guidelines & synthesizing response..."}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* ── Role-Specific Starter Chips ── */}
      {messages.length <= 2 && (
        <div className="mb-2 shrink-0">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {isHindi ? "सुझाए गए प्रश्न" : "Suggested Prompts"} · <span className="text-teal-700">{role.toUpperCase()}</span>
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
            {starters.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(item.query)}
                className="flex items-start gap-2 rounded-xl border border-slate-200/90 bg-white p-2.5 text-left text-xs font-medium text-slate-700 shadow-xs transition hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-900"
              >
                <item.icon className="size-4 shrink-0 text-teal-700 mt-0.5" />
                <span className="line-clamp-2 leading-tight">{isHindi ? item.labelHi : item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Fixed Bottom Message Composer ── */}
      <div className="shrink-0 border-t border-slate-200/80 pt-2 sm:pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isHindi
                ? "ब्रांड नियम, WCAG कंट्रास्ट या दिशानिर्देशों के बारे में पूछें..."
                : `Ask Copilot about brand guidelines, WCAG contrast, or app navigation...`
            }
            disabled={loading}
            className="min-h-11 rounded-xl border-slate-200 pr-24 text-xs shadow-xs focus-visible:ring-teal-600 sm:text-sm"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            {loading ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleStop}
                className="min-h-8 gap-1 rounded-lg px-2 text-xs"
              >
                <Square className="size-3 fill-white" />
                <span className="hidden sm:inline">Stop</span>
              </Button>
            ) : (
              <>
                {lastUserMessage && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRetry}
                    className="min-h-8 px-1.5 text-slate-400 hover:text-slate-700"
                    title="Retry last message"
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim()}
                  className="min-h-8 rounded-lg bg-teal-700 px-3 text-white hover:bg-teal-800"
                >
                  <Send className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-red-600">Delete Conversation?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-500">
            Are you sure you want to delete this chat session? All messages and citations will be removed permanently.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteConfirmId && handleDeleteSession(deleteConfirmId)}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Rename Conversation</DialogTitle>
          </DialogHeader>
          <Input
            value={renameText}
            onChange={(e) => setRenameText(e.target.value)}
            placeholder="Enter title..."
            className="text-xs"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRenameSession} className="bg-teal-700 text-white hover:bg-teal-800">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
