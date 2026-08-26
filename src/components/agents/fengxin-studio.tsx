"use client";

import { useState } from "react";
import { Check, Copy, Sparkles, X } from "lucide-react";
import type { AgentPersona } from "@/lib/agents/personas";

interface CopyResult {
  poem: string;
  postcardText: string;
  xhsCopy: string;
  momentText: string;
  posterTitle: string;
}

const RESULT_CARDS: { key: keyof CopyResult; label: string; emoji: string }[] = [
  { key: "posterTitle", label: "海报标题", emoji: "🏷️" },
  { key: "poem", label: "城市短诗", emoji: "🌫️" },
  { key: "xhsCopy", label: "小红书文案", emoji: "📕" },
  { key: "momentText", label: "朋友圈", emoji: "💬" },
  { key: "postcardText", label: "明信片寄语", emoji: "💌" },
];

const PRESET_MOODS = ["治愈", "怀旧", "惬意", "孤独又自由", "雨天微凉", "元气满满"];

export function FengxinStudio({ persona }: { persona: AgentPersona }) {
  const [tags, setTags] = useState<string[]>(["南京", "梧桐", "慢行"]);
  const [draft, setDraft] = useState("");
  const [mood, setMood] = useState("");
  const [result, setResult] = useState<CopyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function addTag(value: string) {
    const v = value.trim();
    if (v && !tags.includes(v) && tags.length < 8) setTags([...tags, v]);
    setDraft("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function generate() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/copy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: tags, mood }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成失败");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("复制失败，请手动选择文字复制。");
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* 输入区 */}
      <div
        className="rounded-3xl bg-white/75 p-6 shadow-m backdrop-blur"
        style={{ border: `1px solid ${persona.accent.to}` }}
      >
        <label className="text-sm font-medium text-charcoal">关键词</label>
        <p className="mt-1 text-xs text-rock">回车添加，最多 8 个</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-white"
              style={{ backgroundColor: persona.accent.text }}
            >
              {t}
              <button type="button" onClick={() => removeTag(t)} aria-label={`移除 ${t}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(draft);
            }
          }}
          placeholder="如：梧桐、玄武湖、黄昏…"
          className="mt-3 w-full rounded-xl bg-cloud/40 px-4 py-2.5 text-sm outline-none placeholder:text-rock focus:bg-cloud/60"
        />

        <label className="mt-6 block text-sm font-medium text-charcoal">
          想要的情绪
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(mood === m ? "" : m)}
              className="rounded-full border px-3 py-1.5 text-xs transition-colors"
              style={
                mood === m
                  ? { backgroundColor: persona.accent.text, color: "#fff", borderColor: persona.accent.text }
                  : { borderColor: persona.accent.ring, color: persona.accent.text }
              }
            >
              {m}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={loading || tags.length === 0}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-white shadow-s transition-opacity disabled:opacity-50"
          style={{
            backgroundImage: `linear-gradient(135deg, ${persona.accent.from}, ${persona.accent.to})`,
          }}
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "风信正在创作…" : "生成文案"}
        </button>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </div>

      {/* 结果区 */}
      <div className="space-y-4">
        {!result && !loading && (
          <div
            className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed p-8 text-center"
            style={{ borderColor: persona.accent.ring, backgroundColor: persona.accent.soft }}
          >
            <span className="text-5xl">{persona.emoji}</span>
            <p className="mt-4 font-serif text-lg" style={{ color: persona.accent.text }}>
              「{persona.quote}」
            </p>
            <p className="mt-2 text-sm text-rock">
              输入关键词，让风信把它写成有温度的文字。
            </p>
          </div>
        )}

        {loading && (
          <div
            className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl p-8 text-center"
            style={{ backgroundColor: persona.accent.soft }}
          >
            <span className="animate-pulse text-5xl">{persona.emoji}</span>
            <p className="mt-4 text-sm text-rock">风信正在斟酌字句…</p>
          </div>
        )}

        {result && (
          <div className="grid gap-4 sm:grid-cols-2">
            {RESULT_CARDS.map((card) => {
              const text = result[card.key];
              return (
                <div
                  key={card.key}
                  className="flex flex-col rounded-2xl bg-white/80 p-5 shadow-s backdrop-blur"
                  style={{ borderTop: `3px solid ${persona.accent.text}` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-charcoal">
                      {card.emoji} {card.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(card.key, text)}
                      className="inline-flex items-center gap-1 text-xs transition-colors"
                      style={{ color: persona.accent.text }}
                    >
                      {copied === card.key ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> 已复制
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> 复制
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-charcoal/90">
                    {text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
