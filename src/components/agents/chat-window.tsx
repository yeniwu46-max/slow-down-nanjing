"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { AgentPersona } from "@/lib/agents/personas";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  persona: AgentPersona;
  welcome: string;
  placeholder?: string;
  suggestions?: string[];
  /** URL 预填消息 */
  initialPrompt?: string;
  /** 挂载后自动发送 initialPrompt */
  autoSend?: boolean;
  /** 每次消息变化时回调（供父组件做情绪分析等） */
  onMessagesChange?: (messages: ChatMessage[]) => void;
  className?: string;
}

export function ChatWindow({
  persona,
  welcome,
  placeholder = "说点什么吧…",
  suggestions = [],
  initialPrompt,
  autoSend = false,
  onMessagesChange,
  className,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: welcome },
  ]);
  const [input, setInput] = useState(initialPrompt ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);
  const sendRef = useRef<(text: string) => Promise<void>>(async () => {});

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    setInput("");

    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: persona.id,
          messages: next.filter((m) => m.role !== "assistant" || m.content !== welcome),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "对话失败");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "对话失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  sendRef.current = send;

  useEffect(() => {
    if (!autoSend || !initialPrompt?.trim() || autoSentRef.current) return;
    autoSentRef.current = true;
    void sendRef.current(initialPrompt);
  }, [autoSend, initialPrompt]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl bg-white/70 shadow-m backdrop-blur",
        className,
      )}
      style={{ border: `1px solid ${persona.accent.to}` }}
    >
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-5"
        style={{ backgroundColor: persona.accent.soft }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex items-end gap-2",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {m.role === "assistant" && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-s">
                {persona.emoji}
              </span>
            )}
            <div
              className={cn(
                "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-s",
                m.role === "user" ? "text-white" : "bg-white text-charcoal",
              )}
              style={
                m.role === "user"
                  ? { backgroundColor: persona.accent.text }
                  : undefined
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-s">
              {persona.emoji}
            </span>
            <div className="flex gap-1 rounded-2xl bg-white px-4 py-3 shadow-s">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-2 w-2 animate-bounce rounded-full"
                  style={{
                    backgroundColor: persona.accent.ring,
                    animationDelay: `${d * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="bg-red-50 px-5 py-2 text-xs text-red-500">{error}</p>
      )}

      {suggestions.length > 0 && messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 border-t border-black/5 bg-white/80 px-4 py-3">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:text-white"
              style={{
                borderColor: persona.accent.ring,
                color: persona.accent.text,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-black/5 bg-white/90 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full bg-cloud/40 px-4 py-2.5 text-sm text-charcoal outline-none placeholder:text-rock focus:bg-cloud/60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: persona.accent.text }}
          aria-label="发送"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
