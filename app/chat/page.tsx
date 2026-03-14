"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Sparkles, Bot, User, Loader2,
  RefreshCw, BookOpen, ChevronRight, Mic,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WidgetRenderer, ToolPill } from "@/components/chat/widgets";

// ─── Types ────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  widgets?: Record<string, unknown>[];
  toolsUsed?: { name: string; done: boolean }[];
  sources?: string[];
  timestamp: Date;
  isStreaming?: boolean;
}

type SSEEvent =
  | { type: "status"; message: string }
  | { type: "tool_start"; tool: string }
  | { type: "tool_done"; tool: string }
  | { type: "widget"; widget: Record<string, unknown> }
  | { type: "text_start" }
  | { type: "text_chunk"; content: string }
  | { type: "done"; sources: string[]; widgetCount: number }
  | { type: "error"; message: string };

// ─── Suggested prompts ────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  {
    category: "TCS",
    icon: "⚡",
    prompt: "What TCS will I pay on a ₹50 lakh GIFT City remittance? I've already sent ₹8L this FY.",
    short: "TCS on ₹50L",
  },
  {
    category: "TLH",
    icon: "✂️",
    prompt: "Show me all TLH opportunities in the portfolio and how much I can save.",
    short: "TLH opportunities",
  },
  {
    category: "Rates",
    icon: "📊",
    prompt: "What are the STCG and LTCG effective rates for income above ₹5 crore?",
    short: "Tax rates ₹5Cr+",
  },
  {
    category: "CG",
    icon: "📈",
    prompt: "I bought 500 units at $210 and want to sell at $245. I've held for 18 months. What's my capital gains tax?",
    short: "CG calculation",
  },
  {
    category: "Family",
    icon: "👨‍👩‍👧",
    prompt: "How should I split a ₹1.2 crore investment remittance across 3 family members to minimize TCS?",
    short: "Family TCS split",
  },
  {
    category: "Harvest",
    icon: "🔄",
    prompt: "Can I sell Mirae IFSC fund at a loss today and rebuy it tomorrow? Is there any wash sale restriction?",
    short: "Wash sale rules",
  },
  {
    category: "LRS",
    icon: "🌐",
    prompt: "Is PAN mandatory for LRS remittances? What documents does the bank require?",
    short: "LRS requirements",
  },
  {
    category: "Strategy",
    icon: "🎯",
    prompt: "I have a position with 22-month holding and it's at a loss. Should I harvest STCL now or wait for LTCL?",
    short: "STCL vs LTCL",
  },
];

const WELCOME_CONTENT = `Hi! I'm your **Agentic Tax Advisor** — I don't just answer questions, I calculate live results and show them as interactive cards.

**Try asking me:**
- *"What TCS on ₹50L remittance?"* → I'll run the exact calculation
- *"Show me TLH opportunities"* → I'll pull live portfolio data
- *"What are the rates for ₹5Cr+ income?"* → I'll generate a rate comparison card
- *"Split ₹1Cr across 3 family members"* → I'll optimize and show allocations

I have access to **5 regulatory documents** including the RBI LRS FAQ, IT Act sections, and GIFT City compliance rules — with live semantic search on every question.`;

// ─── Message Bubble ───────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} animate-fade-in`}>
      {/* Avatar */}
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border mt-0.5 ${
        isUser
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-foreground"
      }`}>
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 text-purple-400" />}
      </div>

      <div className={`flex flex-col gap-2 ${isUser ? "items-end max-w-[75%]" : "items-start flex-1 min-w-0"}`}>
        {/* Tool pills */}
        {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.toolsUsed.map((t, i) => (
              <ToolPill key={i} tool={t.name} done={t.done} />
            ))}
          </div>
        )}

        {/* Widgets */}
        {!isUser && message.widgets && message.widgets.length > 0 && (
          <div className="w-full space-y-2">
            {message.widgets.map((w, i) => (
              <WidgetRenderer key={i} widget={w} />
            ))}
          </div>
        )}

        {/* Text bubble */}
        {(message.content || message.isStreaming) && (
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card border border-border rounded-tl-sm"
          }`}>
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-li:my-0.5 prose-code:text-blue-300 prose-strong:text-foreground prose-table:text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                {message.isStreaming && (
                  <span className="inline-block h-3.5 w-0.5 bg-primary ml-0.5 animate-pulse" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground/50" suppressHydrationWarning>
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
          </span>
          {message.sources && message.sources.length > 0 && (
            <>
              <BookOpen className="h-2.5 w-2.5 text-muted-foreground/40" />
              {message.sources.map((s) => (
                <span key={s} className="text-[9px] text-blue-400/60 font-mono">{s.replace(".txt", "")}</span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status Bar ───────────────────────────────────────────────────────────

function StatusBar({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/20 bg-primary/5 animate-fade-in">
      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
      <span className="text-xs text-primary">{status}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: WELCOME_CONTENT,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setStatus("Connecting…");

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      widgets: [],
      toolsUsed: [],
      sources: [],
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMsg]);

    abortRef.current = new AbortController();

    try {
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, query: content.trim() }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to AI");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const updateMsg = (updater: (msg: Message) => Message) => {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? updater(m) : m));
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw) as SSEEvent;

            switch (event.type) {
              case "status":
                setStatus(event.message);
                break;

              case "tool_start":
                setStatus(`Running: ${event.tool.replace(/_/g, " ")}…`);
                updateMsg((m) => ({
                  ...m,
                  toolsUsed: [...(m.toolsUsed ?? []), { name: event.tool, done: false }],
                }));
                break;

              case "tool_done":
                updateMsg((m) => ({
                  ...m,
                  toolsUsed: (m.toolsUsed ?? []).map((t) =>
                    t.name === event.tool ? { ...t, done: true } : t
                  ),
                }));
                break;

              case "widget":
                updateMsg((m) => ({
                  ...m,
                  widgets: [...(m.widgets ?? []), event.widget],
                }));
                break;

              case "text_start":
                setStatus("Writing response…");
                break;

              case "text_chunk":
                updateMsg((m) => ({ ...m, content: m.content + event.content }));
                break;

              case "done":
                setStatus("");
                updateMsg((m) => ({
                  ...m,
                  isStreaming: false,
                  sources: event.sources,
                }));
                break;

              case "error":
                throw new Error(event.message);
            }
          } catch (parseErr) {
            // skip malformed events
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const errMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Unknown error"}. Please check your API key.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.filter((m) => m.id !== assistantId), errMsg]);
    } finally {
      setIsLoading(false);
      setStatus("");
      updateMsgFinal(assistantId, setMessages);
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setStatus("");
    setMessages([{
      id: "welcome-new",
      role: "assistant",
      content: "Chat cleared. Ask me anything about Indian tax optimization!",
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Main chat area ── */}
      <div className="flex flex-1 flex-col min-w-0 p-4 gap-3">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Agentic Tax Advisor</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">GPT-4o · 5 live tools · 5 regulatory documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="gain" className="text-[9px]">GPT-4o</Badge>
            <Badge variant="info" className="text-[9px]">
              <BookOpen className="h-2.5 w-2.5 mr-1" /> RAG
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {status && !isLoading && <StatusBar status={status} />}
          {isLoading && status && <StatusBar status={status} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0">
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything — I'll calculate live results and show them as cards…"
                rows={2}
                className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="h-9 w-9 rounded-xl p-0 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-[9px] text-muted-foreground/50">
              Enter to send · Shift+Enter for new line · For informational purposes only — consult a CA
            </p>
          </div>
        </div>
      </div>

      {/* ── Sidebar: suggestions ── */}
      <div className="w-64 flex-shrink-0 border-l border-border p-3 flex flex-col gap-3 overflow-y-auto">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
            Quick Prompts
          </p>
          <div className="space-y-1.5">
            {SUGGESTED_PROMPTS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s.prompt)}
                disabled={isLoading}
                className="w-full rounded-xl border border-border bg-secondary/10 p-2.5 text-left transition-all hover:border-primary/40 hover:bg-secondary/40 disabled:opacity-50 group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{s.icon}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                    s.category === "TCS" ? "bg-amber-500/20 text-amber-400" :
                    s.category === "TLH" ? "bg-rose-500/20 text-rose-400" :
                    s.category === "Rates" ? "bg-blue-500/20 text-blue-400" :
                    s.category === "CG" ? "bg-purple-500/20 text-purple-400" :
                    s.category === "Family" ? "bg-emerald-500/20 text-emerald-400" :
                    s.category === "Harvest" ? "bg-orange-500/20 text-orange-400" :
                    "bg-secondary text-muted-foreground"
                  }`}>{s.category}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">{s.short}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Knowledge base */}
        <div className="rounded-xl border border-border bg-secondary/20 p-3">
          <p className="text-[9px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Knowledge Base</p>
          <div className="space-y-1">
            {[
              { icon: "🏛️", name: "IT Act — STCG/LTCG", detail: "Sec 112, 48, surcharge" },
              { icon: "🏦", name: "RBI LRS FAQ",          detail: "Official Q&A · Apr 2023" },
              { icon: "✂️", name: "TLH India rules",      detail: "No wash sale confirmation" },
              { icon: "📋", name: "GIFT City compliance", detail: "Schedule FA, Form 67" },
              { icon: "💸", name: "LRS/TCS rules",        detail: "Budget 2025 thresholds" },
            ].map((doc) => (
              <div key={doc.name} className="flex items-start gap-2 py-1">
                <span className="text-xs mt-0.5">{doc.icon}</span>
                <div>
                  <p className="text-[9px] font-medium text-foreground">{doc.name}</p>
                  <p className="text-[8px] text-muted-foreground">{doc.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="rounded-xl border border-border bg-secondary/20 p-3">
          <p className="text-[9px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Live Tools</p>
          <div className="space-y-1">
            {[
              { icon: "⚡", name: "calculate_tcs",           desc: "TCS on any LRS amount" },
              { icon: "📊", name: "calculate_capital_gains", desc: "STCG/LTCG on any trade" },
              { icon: "👨‍👩‍👧", name: "optimize_family_tcs",  desc: "Family split optimizer" },
              { icon: "✂️", name: "get_tlh_opportunities",  desc: "Live portfolio scan" },
              { icon: "📈", name: "get_tax_rates",           desc: "Rates by income bracket" },
            ].map((t) => (
              <div key={t.name} className="flex items-start gap-2 py-1">
                <span className="text-xs mt-0.5">{t.icon}</span>
                <div>
                  <p className="text-[9px] font-mono text-primary/70">{t.name}</p>
                  <p className="text-[8px] text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// outside component to avoid closure issues
function updateMsgFinal(
  id: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) {
  setMessages((prev) =>
    prev.map((m) => m.id === id ? { ...m, isStreaming: false } : m)
  );
}
