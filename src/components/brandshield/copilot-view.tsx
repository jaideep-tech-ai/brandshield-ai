"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useSession } from "@/lib/brandshield/client";
import { useLang } from "@/lib/brandshield/i18n";
import { cn } from "@/lib/brandshield/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const PROMPT_STARTERS = [
  {
    icon: Palette,
    label: "Check button contrast",
    query: "Check contrast for primary button (#0F766E on #FFFFFF) against WCAG 2.1 AA",
  },
  {
    icon: ShieldCheck,
    label: "Trademark & logo rules",
    query: "What are our official trademark and logo clear-space rules?",
  },
  {
    icon: BookOpen,
    label: "Approved headline typography",
    query: "List approved headline fonts, sizing, and capitalization rules",
  },
  {
    icon: AlertCircle,
    label: "Prohibited marketing claims",
    query: "Can we guarantee 100% returns or use the word guaranteed in campaign copy?",
  },
];

export function CopilotView() {
  const session = useSession();
  const { t } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 **Welcome to the AI Brand Governance Copilot!**

I am your real-time compliance assistant, wired directly to your organization's indexed guideline rulebooks, brand visual tokens, and WCAG 2.1 criteria.

Ask me anything about brand voice, approved color palettes, typography specifications, claim verification, or trademark rules.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function handleSend(queryText?: string) {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    setInput("");
    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          sessionId: sessionId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to query brand copilot.");
      }

      const data = (await res.json()) as {
        sessionId: string;
        reply: string;
        citations: Citation[];
      };

      if (!sessionId) setSessionId(data.sessionId);

      const assistantMsg: ChatMessage = {
        id: "a-" + Date.now(),
        role: "assistant",
        content: data.reply,
        citations: data.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network error";
      toast.error(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `⚠️ **Governance Query Failed**: ${errMsg}. Please try rephrasing your query or ensure your brand guidelines are indexed.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSessionId(null);
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content: `👋 **Fresh Brand Governance Session Started.** How can I assist you with brand compliance or WCAG accessibility today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.info("Started new brand governance conversation.");
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-5xl flex-col px-3 py-2 sm:px-6 md:h-[calc(100vh-6.5rem)]">
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-700 to-emerald-600 text-white shadow-sm">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                Brand Governance Copilot
              </h1>
              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[10px] font-semibold text-teal-700">
                Vector-RAG Active
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Instant rule citations, WCAG 2.1 math & guideline compliance guidance
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-8 gap-1.5 rounded-lg border-slate-200 text-xs text-slate-600 hover:text-slate-900"
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden sm:inline">New Session</span>
        </Button>
      </div>

      {/* ── Message Thread ── */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-5">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={cn("flex items-start gap-3 text-sm", isUser ? "flex-row-reverse" : "flex-row")}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm",
                    isUser
                      ? "bg-teal-700 text-white"
                      : "border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700"
                  )}
                >
                  {isUser ? <UserRound className="size-4" /> : <Bot className="size-4" />}
                </div>

                {/* Bubble Container */}
                <div className={cn("flex max-w-[85%] flex-col gap-1 sm:max-w-[78%]", isUser ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "relative rounded-2xl px-4 py-3 leading-relaxed shadow-sm",
                      isUser
                        ? "bg-teal-700 text-white"
                        : "border border-slate-200/80 bg-white text-slate-800"
                    )}
                  >
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(m.content, m.id)}
                        className="absolute right-2.5 top-2.5 rounded p-1 text-slate-400 opacity-60 hover:text-slate-600 hover:opacity-100"
                        title="Copy response"
                      >
                        {copiedId === m.id ? <Check className="size-3.5 text-teal-600" /> : <Copy className="size-3.5" />}
                      </button>
                    )}

                    <div className={cn("prose prose-sm max-w-none break-words", isUser && "prose-invert")}>
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>

                    {/* Citations Footer */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-3.5 border-t border-slate-100 pt-2.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                          Verified Policy Citations:
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {m.citations.map((c, idx) => (
                            <div
                              key={idx}
                              className="group flex items-center gap-1.5 rounded-lg border border-teal-200/80 bg-teal-50/60 px-2.5 py-1 text-xs text-teal-900 transition hover:bg-teal-100/70"
                              title={c.textSnippet}
                            >
                              <FileText className="size-3 shrink-0 text-teal-700" />
                              <span className="font-semibold">{c.documentTitle}</span>
                              <span className="rounded bg-teal-200/60 px-1 py-0.5 text-[10px] font-mono">
                                p.{c.pageNumber}
                              </span>
                              {c.ruleTag && (
                                <span className="rounded bg-teal-700 px-1 py-0.5 text-[9px] font-bold text-white">
                                  {c.ruleTag}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="px-1 text-[10px] text-slate-400">{m.timestamp}</span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-700">
                <Bot className="size-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Loader2 className="size-4 animate-spin text-teal-600" />
                <span className="text-xs text-slate-500">Querying Vector-RAG & analyzing compliance policies...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Quick Starter Chips ── */}
      {messages.length <= 2 && (
        <div className="mb-2 shrink-0">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Suggested Inquiries
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {PROMPT_STARTERS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(s.query)}
                  className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-900 disabled:opacity-50"
                >
                  <Icon className="size-4 shrink-0 text-teal-600" />
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Input Box ── */}
      <div className="shrink-0 pt-2">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about brand guidelines, WCAG contrast, banned terms, logo rules..."
            disabled={loading}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-12 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            className="absolute right-1.5 top-1/2 size-9 -translate-y-1/2 rounded-lg bg-teal-700 text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-40"
            aria-label="Send query"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
        <p className="mt-1 text-center text-[10px] text-slate-400">
          Powered by BrandShield Vector-RAG · Citations reference official indexed guideline PDFs
        </p>
      </div>
    </div>
  );
}
