"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Sparkles, ArrowUpRight, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
                    <div
                      className="max-w-[90%] text-sm leading-relaxed"
                      style={{ color: "#00111B", fontFamily: "'Inter', sans-serif" }}
                    >
                      {msg.content ? (
                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : null}
                      {msg.isStreaming && (
                        <span
                          className="inline-block h-3.5 w-1 ml-0.5 rounded-sm animate-pulse"
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
