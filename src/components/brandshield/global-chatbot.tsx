"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  X,
  RotateCcw,
  Bot,
  UserRound,
  ShieldAlert,
  ChevronDown,
  BookOpen,
  Palette,
  CheckCircle2,
  Minimize2,
  Maximize2,
  History,
  Plus,
  Trash2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession, getStoredToken } from "@/lib/brandshield/client";
import { useLang } from "@/lib/brandshield/i18n";
import { useUIStore } from "@/lib/brandshield/store";
import { cn } from "@/lib/brandshield/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface SessionItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

const QUICK_QUESTIONS = [
  { label: "What claims are banned?", query: "What claims and words are strictly prohibited in our brand guidelines?" },
  { label: "Check button contrast ratio", query: "What are the WCAG 2.1 AA/AAA contrast ratios required for brand buttons and cards?" },
  { label: "Explain critical findings", query: "Explain what makes a finding critical versus a warning in BrandShield AI." },
  { label: "Trademark rules (®/™)", query: "What are our official trademark glyph rules for master brand naming?" },
];

export function GlobalChatbotWidget() {
  const session = useSession();
  const { lang } = useLang();
  const { chatbotOpen, setChatbotOpen } = useUIStore();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>("New Conversation");
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionsList, setSessionsList] = useState<SessionItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your **BrandShield Conversational Chatbot**. Ask me anything about your organization's brand guidelines, prohibited claims, WCAG color contrast, or how to resolve compliance findings.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    if (chatbotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [chatbotOpen, messages]);

  // Load chat sessions when history is opened
  const loadSessions = async () => {
    setLoadingHistory(true);
    try {
      const token = getStoredToken();
      const res = await fetch("/api/chat", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSessionsList(data.sessions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectSession = async (sid: string) => {
    setLoading(true);
    setShowHistory(false);
    try {
      const token = getStoredToken();
      const res = await fetch(`/api/chat?sessionId=${sid}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session.id);
        setSessionTitle(data.session.title || "Chat Session");
        const loaded: ChatMessage[] = (data.messages || []).map((m: { id: string; role: "user" | "assistant"; content: string; citations?: Citation[]; createdAt: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          citations: m.citations,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setMessages(
          loaded.length > 0
            ? loaded
            : [
                {
                  id: "welcome-" + Date.now(),
                  role: "assistant",
                  content: "This conversation has no prior messages. Ask anything about brand guidelines!",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]
        );
      }
    } catch {
      toast.error("Failed to load conversation history.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setSessionId(null);
    setSessionTitle("New Conversation");
    setShowHistory(false);
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content:
          "Started a fresh conversation! Ask me anything about your brand guidelines, WCAG color contrast, or pre-flight scan results.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleDeleteSession = async (sid: string) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`/api/chat?sessionId=${sid}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        toast.success("Conversation deleted.");
        setSessionsList((prev) => prev.filter((s) => s.id !== sid));
        if (sessionId === sid) {
          handleNewConversation();
        }
      }
    } catch {
      toast.error("Failed to delete conversation.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  if (!session.data) return null;

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    setInput("");
    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = getStoredToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionId || undefined,
          lang: lang === "hi" ? "hi" : "en",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Chatbot service temporarily unavailable.");
      }

      const data = await res.json();
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
        setSessionTitle(trimmed.slice(0, 36) + (trimmed.length > 36 ? "..." : ""));
      }

      const botMsg: ChatMessage = {
        id: data.messageId || "b-" + Date.now(),
        role: "assistant",
        content: data.reply,
        citations: data.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network error";
      toast.error(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `⚠️ **Chatbot Notice**: ${errMsg}. Please verify that guidelines are indexed or retry your request.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  // Keyboard shortcut: Escape closes chatbot
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setChatbotOpen(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6" onKeyDown={handleKeyDown}>
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!chatbotOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChatbotOpen(true)}
            aria-label="Open BrandShield AI Conversational Chatbot"
            className="flex items-center gap-2.5 rounded-full bg-teal-700 px-4 py-3 text-white shadow-xl shadow-teal-900/20 ring-2 ring-teal-500/30 transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <div className="relative">
              <MessageSquare className="size-5" />
              <span className="absolute -right-0.5 -top-0.5 flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
            </div>
            <span className="text-xs font-bold tracking-wide">BrandShield AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-out / Pop-up Chat Window */}
      <AnimatePresence>
        {chatbotOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 transition-all duration-200",
              isExpanded
                ? "fixed inset-3 md:inset-auto md:bottom-6 md:right-6 md:h-[680px] md:w-[620px]"
                : "h-[540px] w-[calc(100vw-32px)] max-w-[440px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-teal-800 via-teal-700 to-teal-800 px-4 py-3 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <Bot className="size-4.5 text-teal-200" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold leading-tight">{sessionTitle}</h3>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-teal-200">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    <span>Gemini Vector RAG Active</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory) loadSessions();
                  }}
                  title="Conversation History"
                  aria-label="Conversation History"
                  className={cn(
                    "size-8 text-teal-200 hover:bg-white/10 hover:text-white",
                    showHistory && "bg-white/20 text-white"
                  )}
                >
                  <History className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewConversation}
                  title="New Conversation"
                  aria-label="New Conversation"
                  className="size-8 text-teal-200 hover:bg-white/10 hover:text-white"
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse" : "Expand"}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  className="hidden md:flex size-8 text-teal-200 hover:bg-white/10 hover:text-white"
                >
                  {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatbotOpen(false)}
                  title="Close chatbot"
                  aria-label="Close chatbot"
                  className="size-8 text-teal-200 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Content area: History Drawer or Chat Messages */}
            {showHistory ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-teal-700" />
                    <span className="text-xs font-bold text-slate-800">Past Conversations</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewConversation}
                    className="h-7 text-xs border-teal-200 text-teal-800 hover:bg-teal-50"
                  >
                    <Plus className="size-3 mr-1" />
                    New Chat
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-3">
                  {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                      <Loader2 className="size-5 animate-spin text-teal-600 mb-2" />
                      <span className="text-xs">Loading conversations...</span>
                    </div>
                  ) : sessionsList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No past conversations found. Send a message to start!
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {sessionsList.map((s) => (
                        <div
                          key={s.id}
                          className={cn(
                            "group flex items-center justify-between rounded-xl border p-2.5 transition text-left text-xs",
                            s.id === sessionId
                              ? "border-teal-300 bg-teal-50/70 text-teal-900"
                              : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50 text-slate-800"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => selectSession(s.id)}
                            className="flex-1 min-w-0 pr-2"
                          >
                            <p className="font-semibold truncate">{s.title || "Untitled Chat"}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(s.updatedAt).toLocaleDateString()} · {s.messageCount} messages
                            </p>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(s.id);
                            }}
                            title="Delete conversation"
                            className="size-7 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <>
                {/* Message Area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3.5">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "flex gap-2.5 text-xs sm:text-sm",
                          m.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold",
                            m.role === "user" ? "bg-teal-700" : "bg-slate-700"
                          )}
                        >
                          {m.role === "user" ? <UserRound className="size-3.5" /> : <Bot className="size-3.5" />}
                        </div>

                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-xs",
                            m.role === "user"
                              ? "bg-teal-700 text-white rounded-tr-none"
                              : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none"
                          )}
                        >
                          <div className={cn("prose prose-xs max-w-none break-words", m.role === "user" && "prose-invert text-white")}>
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>

                          {/* Verbatim Citations */}
                          {m.citations && m.citations.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                                Verified Ground-Truth Sources:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {m.citations.map((c, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setExpandedCitation(expandedCitation === idx ? null : idx)}
                                    className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-800 border border-teal-200/80 hover:bg-teal-100 transition"
                                  >
                                    <BookOpen className="size-2.5" />
                                    <span>{c.documentTitle}</span>
                                    {c.ruleTag && <span className="font-mono text-teal-600 font-bold">({c.ruleTag})</span>}
                                  </button>
                                ))}
                              </div>
                              {expandedCitation !== null && m.citations[expandedCitation] && (
                                <div className="mt-1.5 rounded-lg bg-teal-50/70 p-2 text-[11px] text-teal-900 border border-teal-200">
                                  <p className="font-semibold text-teal-800">
                                    {m.citations[expandedCitation].documentTitle} · Page {m.citations[expandedCitation].pageNumber}
                                  </p>
                                  <p className="mt-0.5 italic text-slate-600">&quot;{m.citations[expandedCitation].textSnippet}&quot;</p>
                                </div>
                              )}
                            </div>
                          )}

                          <span className={cn("mt-1 block text-[10px]", m.role === "user" ? "text-teal-200 text-right" : "text-slate-500")}>
                            {m.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex gap-2.5 text-xs">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white">
                          <Bot className="size-3.5" />
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                          <Loader2 className="size-3.5 animate-spin text-teal-700" />
                          <span>Consulting brand policies & RAG knowledge...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Quick Prompts Bar */}
                {messages.length <= 3 && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-2">
                    <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Quick Topics
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {QUICK_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(q.query)}
                          className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 transition shadow-2xs"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Bar */}
                <form onSubmit={onSubmit} className="border-t border-slate-100 p-2.5 bg-white">
                  <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/20">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about brand rules, contrast, claims..."
                      aria-label="Message BrandShield AI Chatbot"
                      className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input.trim() || loading}
                      aria-label="Send message"
                      className="size-8 shrink-0 rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40"
                    >
                      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
