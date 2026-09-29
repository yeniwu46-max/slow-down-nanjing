"use client";

import { BrainCircuit, Check, LoaderCircle, Sparkles } from "lucide-react";
import { MAP_POIS } from "@/lib/map/pois";
import type { ModelLoadState, SemanticIntent } from "@/lib/semantic/types";
import { cn } from "@/lib/utils";

interface SemanticPreferencePanelProps {
  query: string;
  intent: SemanticIntent | null;
  modelState: ModelLoadState;
  analyzing: boolean;
  selectedIds: string[];
  onQueryChange: (value: string) => void;
  onAnalyze: () => void;
  onTogglePoi: (poiId: string) => void;
}

export function SemanticPreferencePanel({
  query,
  intent,
  modelState,
  analyzing,
  selectedIds,
  onQueryChange,
  onAnalyze,
  onTogglePoi,
}: SemanticPreferencePanelProps) {
  const recommendations = intent?.matches.slice(0, 5) ?? [];
  return (
    <section className="mt-3 rounded-2xl border border-gold/25 bg-white/45 p-3" aria-labelledby="semantic-title">
      <div className="flex items-start gap-2">
        <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="semantic-title" className="text-[11px] font-medium text-ink">路线偏好</h2>
        </div>
      </div>

      <label className="mt-2 block">
        <span className="sr-only">路线自然语言偏好</span>
        <textarea
          value={query}
          maxLength={120}
          rows={2}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="例如：想看六朝遗迹，少走路，雨天多安排室内"
          className="w-full resize-none rounded-xl border border-cloud/70 bg-white/75 px-3 py-2 text-[11px] leading-relaxed text-ink outline-none placeholder:text-rock/60 focus:border-gold"
        />
      </label>
      <div className="mt-1 flex items-center justify-end gap-2">
        <span className="shrink-0 text-[9px] text-rock">{query.length}/120</span>
      </div>
      {modelState.status === "loading" && (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-cloud/70" aria-label="模型加载进度">
          <div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${Math.max(4, modelState.progress)}%` }} />
        </div>
      )}
      <button
        type="button"
        disabled={analyzing || !query.trim()}
        onClick={onAnalyze}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gold px-3 py-2 text-[11px] font-medium text-white disabled:opacity-45"
      >
        {analyzing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {analyzing ? "正在理解" : "理解并推荐地点"}
      </button>

      {recommendations.length > 0 && (
        <div className="mt-3 border-t border-cloud/60 pt-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-medium text-ink">建议候选点</p>
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {recommendations.map((match) => {
              const poi = MAP_POIS.find((item) => item.id === match.poiId);
              if (!poi) return null;
              const selected = selectedIds.includes(poi.id);
              const disabled = !selected && selectedIds.length >= 5;
              return (
                <li key={poi.id} className="flex items-center gap-2 rounded-xl bg-white/65 p-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-[11px] font-medium text-ink">{poi.name}</span>
                      <span className="shrink-0 text-[10px] font-semibold text-primary">{match.score}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[9px] text-rock">{match.reasons.join(" · ")}</p>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() => onTogglePoi(poi.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px]",
                      selected ? "bg-primary text-white" : "bg-paper text-rock hover:bg-cloud/60",
                      disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {selected && <Check className="h-3 w-3" aria-hidden="true" />}
                    {selected ? "已选" : "加入"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
