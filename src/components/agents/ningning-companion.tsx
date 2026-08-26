"use client";

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, BatteryCharging, Sparkles } from "lucide-react";
import { ChatWindow, type ChatMessage } from "@/components/agents/chat-window";
import type { AgentPersona } from "@/lib/agents/personas";

interface EmotionResult {
  moodLabel: string;
  keywords: string[];
  battery: number;
  advice: string;
  recommendAgent: string;
}

export function NingningCompanion({ persona }: { persona: AgentPersona }) {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("q") ?? undefined;
  const autoSend = searchParams.get("auto") === "1";

  const messagesRef = useRef<ChatMessage[]>([]);
  const [result, setResult] = useState<EmotionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessages = useCallback((messages: ChatMessage[]) => {
    messagesRef.current = messages;
  }, []);

  async function analyze() {
    const text = messagesRef.current
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n");

    if (!text.trim()) {
      setError("先和宁宁聊几句，再让她听听你的心情～");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/agents/emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "分析失败");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  const accent = persona.accent;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(0,340px)]">
      <ChatWindow
        persona={persona}
        className="h-[60vh] min-h-[460px]"
        welcome="嗨，我是宁宁。今天过得怎么样？不用急着说清楚，慢慢讲，我在听。"
        placeholder="说说今天的心情…"
        suggestions={
          autoSend
            ? []
            : [
                "今天好累，什么都不想做",
                "最近压力有点大",
                "想找个地方放空一下",
              ]
        }
        initialPrompt={initialPrompt}
        autoSend={autoSend}
        onMessagesChange={handleMessages}
      />

      <aside
        className="flex flex-col rounded-3xl bg-white/75 p-6 shadow-m backdrop-blur"
        style={{ border: `1px solid ${accent.to}` }}
      >
        <h2 className="flex items-center gap-2 font-serif text-lg text-charcoal">
          <Activity className="h-5 w-5" style={{ color: accent.text }} />
          情绪画像
        </h2>

        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          className="mt-4 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-white shadow-s transition-opacity disabled:opacity-50"
          style={{
            backgroundImage: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
          }}
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "宁宁正在听…" : "听听我的心情"}
        </button>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        {!result && !loading && (
          <p className="mt-6 text-center text-sm text-rock">
            和宁宁聊聊后，点击上方按钮，
            <br />
          她会为你记下此刻的心情与慢行电量。
          </p>
        )}

        {result && (
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs text-rock">当前情绪画像</p>
              <p
                className="mt-1 font-serif text-2xl font-semibold"
                style={{ color: accent.text }}
              >
                {result.moodLabel}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-rock">
                <span className="flex items-center gap-1">
                  <BatteryCharging className="h-4 w-4" /> 慢行电量
                </span>
                <span style={{ color: accent.text }}>{result.battery}%</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-cloud/50">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${result.battery}%`,
                    backgroundImage: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
                  }}
                />
              </div>
            </div>

            {result.keywords.length > 0 && (
              <div>
                <p className="text-xs text-rock">情绪关键词</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full px-3 py-1 text-xs"
                      style={{ backgroundColor: accent.soft, color: accent.text }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.advice && (
              <div
                className="rounded-2xl p-4 text-sm leading-relaxed text-charcoal/90"
                style={{ backgroundColor: accent.soft }}
              >
                {result.advice}
              </div>
            )}

            {result.recommendAgent && (
              <p className="text-xs text-rock">
                宁宁建议接下来找
                <span className="mx-1 font-medium" style={{ color: accent.text }}>
                  {result.recommendAgent}
                </span>
                陪你继续。
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
