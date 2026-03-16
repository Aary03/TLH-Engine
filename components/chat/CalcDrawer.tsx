"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Sparkles, ArrowUpRight, Send, Loader2, Calendar, Clock, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { buildCalcContext } from "@/lib/calc-context";
import { getProfile, BRACKET_LABELS } from "@/lib/user-profile";
import Link from "next/link";

export interface CalcDrawerProps {
  page: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  chips: string[];
  open: boolean;
  onClose: () => void;
}

interface DrawerMessage {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

function sseParseChunk(chunk: string): Array<{ type: string; content?: string; message?: string }> {
  const events: Array<{ type: string; content?: string; message?: string }> = [];
  const lines = chunk.split("\n");
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    try {
      const parsed = JSON.parse(line.slice(6));
      events.push(parsed);
    } catch { /* skip malformed */ }
  }
  return events;
}

// ─── Rich markdown renderer for drawer responses ─────────────────────────

function DrawerMarkdown({ content }: { content: string }) {
  const ACTION_PREFIXES: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    "today:": { label: "TODAY", color: "#DC2626", bg: "#FFF5F5", icon: <AlertCircle size={11} /> },
    "this week:": { label: "THIS WEEK", color: "#B8913A", bg: "#FFFBF0", icon: <Clock size={11} /> },
    "before march 31:": { label: "BEFORE MARCH 31", color: "#2B4A8A", bg: "#F0F6FF", icon: <Calendar size={11} /> },
  };

  const components: Components = {
    // Paragraphs — detect action lines
    p({ children }) {
      const text = String(children).toLowerCase().trim();
      for (const [prefix, style] of Object.entries(ACTION_PREFIXES)) {
        if (text.startsWith(prefix)) {
          const rest = String(children).slice(prefix.length).trim();
          return (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2 my-1.5"
              style={{ background: style.bg, border: `1px solid ${style.color}22` }}
            >
              <span className="flex-shrink-0 mt-0.5 flex items-center gap-1 font-bold text-[10px] tracking-widest" style={{ color: style.color }}>
                {style.icon}{style.label}
              </span>
              <span className="text-[13px] leading-snug" style={{ color: "#00111B", fontFamily: "'Inter', sans-serif" }}>
                {rest}
              </span>
            </div>
          );
        }
      }
      return (
        <p className="text-[13px] leading-relaxed my-1.5" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>
          {children}
        </p>
      );
    },
    // Bold — green accent
    strong({ children }) {
      return (
        <strong className="font-semibold" style={{ color: "#00111B" }}>
          {children}
        </strong>
      );
    },
    // Tables
    table({ children }) {
      return (
        <div className="my-2 overflow-x-auto rounded-xl border" style={{ borderColor: "#E8E4DE" }}>
          <table className="w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
            {children}
          </table>
        </div>
      );
    },
    thead({ children }) {
      return (
        <thead style={{ background: "#00111B" }}>
          {children}
        </thead>
      );
    },
    th({ children }) {
      return (
        <th
          className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider"
          style={{ color: "#B4E3C8", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          {children}
        </th>
      );
    },
    tbody({ children }) {
      return <tbody>{children}</tbody>;
    },
    tr({ children }) {
      return (
        <tr className="border-b last:border-0" style={{ borderColor: "#F0EDE8" }}>
          {children}
        </tr>
      );
    },
    td({ children }) {
      return (
        <td className="px-3 py-2" style={{ color: "#00111B", fontFamily: "'Inter', sans-serif" }}>
          {children}
        </td>
      );
    },
    // Lists
    ul({ children }) {
      return <ul className="my-1.5 space-y-1 pl-4">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="my-1.5 space-y-1 pl-4 list-decimal">{children}</ol>;
    },
    li({ children }) {
      return (
        <li className="text-[13px] leading-snug flex items-start gap-1.5" style={{ color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "#05A049" }} />
          <span>{children}</span>
        </li>
      );
    },
    // Headings
    h1({ children }) {
      return <h1 className="text-base font-bold mt-3 mb-1" style={{ color: "#00111B", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-sm font-bold mt-2.5 mb-1" style={{ color: "#00111B", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-[13px] font-semibold mt-2 mb-0.5" style={{ color: "#05A049" }}>{children}</h3>;
    },
    // Code
    code({ children }) {
      return (
        <code className="px-1.5 py-0.5 rounded text-[12px] font-mono" style={{ background: "#F0EDE8", color: "#00111B" }}>
          {children}
        </code>
      );
    },
    // Horizontal rule — used as section separator
    hr() {
      return <hr className="my-2" style={{ borderColor: "#E8E4DE" }} />;
    },
    // Blockquote — recommendation callout
    blockquote({ children }) {
      return (
        <div
          className="my-2 rounded-xl px-3 py-2.5 border-l-4"
          style={{ background: "#F0FAF4", borderLeftColor: "#05A049" }}
        >
          <div className="text-[13px] leading-relaxed" style={{ color: "#064E24", fontFamily: "'Inter', sans-serif" }}>
            {children}
          </div>
        </div>
      );
    },
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function CalcDrawer({ page, inputs, outputs, chips, open, onClose }: CalcDrawerProps) {
  const [messages, setMessages] = useState<DrawerMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      // Reset on close
      setMessages([]);
      setInput("");
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const calcContext = buildCalcContext(page, inputs, outputs);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: DrawerMessage = { role: "user", content: content.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      const assistantMsg: DrawerMessage = { role: "assistant", content: "", isStreaming: true };
      setMessages((prev) => [...prev, assistantMsg]);

      abortRef.current = new AbortController();

      try {
        const profile = getProfile();
        const profileContext = {
          incomeBracket: profile.incomeBracket,
          incomeBracketLabel: BRACKET_LABELS[profile.incomeBracket],
          investorType: profile.investorType,
          taxRegime: profile.taxRegime,
          familyMembersCount: profile.familyMembers.length,
          incomeAbove5Cr: profile.incomeAbove5Cr,
        };

        const history = messages.map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...history, { role: "user", content: content.trim() }],
            query: content.trim(),
            profile: profileContext,
            calcContext,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error("Failed to connect");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Only consume complete lines; keep any trailing incomplete line in the buffer
          const lastNewline = buffer.lastIndexOf("\n");
          if (lastNewline === -1) continue;
          const complete = buffer.slice(0, lastNewline + 1);
          buffer = buffer.slice(lastNewline + 1);

          const events = sseParseChunk(complete);

          for (const event of events) {
            if ((event.type === "text_chunk" || event.type === "token") && event.content) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") {
                  copy[copy.length - 1] = { ...last, content: last.content + event.content, isStreaming: true };
                }
                return copy;
              });
            } else if (event.type === "done") {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") {
                  copy[copy.length - 1] = { ...last, isStreaming: false };
                }
                return copy;
              });
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = { ...last, content: "Something went wrong. Please try again.", isStreaming: false };
            }
            return copy;
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, calcContext]
  );

  const openInFullChat = () => {
    const encoded = btoa(unescape(encodeURIComponent(calcContext)));
    return `/chat?context=${encoded}`;
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[90] flex flex-col md:left-[240px]"
        style={{
          height: "420px",
          background: "#FFFFFC",
          borderTop: "2px solid #00111B",
          boxShadow: "0 -8px 40px rgba(0,17,27,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: "#00111B", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "#B4E3C8" }} />
            <span
              className="text-sm font-bold text-white"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Ask AI about this result
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(5,160,73,0.2)", color: "#05A049" }}
            >
              {page}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={openInFullChat()}
              className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: "#B4E3C8" }}
            >
              Full chat <ArrowUpRight size={11} />
            </Link>
            <button
              onClick={onClose}
              className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 ? (
            /* Chip suggestions */
            <div>
              <p className="text-xs text-[#00111B]/40 mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                Tap a question to get started, or type your own below.
              </p>
              <div className="flex flex-col gap-2">
                {chips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(chip)}
                    className="w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: "#F7F5F0",
                      borderColor: "#E8E4DE",
                      color: "#00111B",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span style={{ color: "#05A049" }}>→</span>{" "}{chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "user" ? (
                    <div
                      className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-br-md text-sm"
                      style={{
                        background: "#00111B",
                        color: "#FFFFFC",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <div className="w-full space-y-1">
                      {msg.content ? (
                        <DrawerMarkdown content={msg.content} />
                      ) : null}
                      {msg.isStreaming && !msg.content && (
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#05A049] animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#05A049] animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#05A049] animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                      {msg.isStreaming && msg.content && (
                        <span
                          className="inline-block h-3.5 w-0.5 ml-0.5 rounded-sm animate-pulse"
                          style={{ background: "#05A049", verticalAlign: "middle" }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div
          className="flex-shrink-0 px-3 py-3 border-t"
          style={{ borderColor: "#E8E4DE", background: "#F7F5F0" }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask anything about your result…"
              className="flex-1 px-3.5 py-2 rounded-xl border bg-white text-sm outline-none transition-all focus:ring-2"
              style={{
                borderColor: "#D4D8D0",
                fontFamily: "'Inter', sans-serif",
                color: "#00111B",
              }}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
              style={{ background: "#05A049" }}
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin text-white" />
              ) : (
                <Send size={15} className="text-white" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] mt-1.5" style={{ color: "#00111B]/30" }}>
            <span style={{ color: "#00111B", opacity: 0.3 }}>Context: your exact calculator inputs and outputs are sent to the AI</span>
          </p>
        </div>
      </div>
    </>
  );
}
