"use client";

import { Cloud, CloudRain, Moon, RefreshCw, Sun, Users } from "lucide-react";
import { clockLabel, type PlanningOptions } from "@/lib/map/planning";
import type { WeatherCondition } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

interface DynamicPlanningControlsProps {
  options: PlanningOptions;
  weatherError: string | null;
  onChange: (patch: Partial<PlanningOptions>) => void;
  onRefreshWeather: () => void;
}

const WEATHER_OPTIONS: {
  value: WeatherCondition;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "sunny", label: "晴", icon: Sun },
  { value: "cloudy", label: "多云", icon: Cloud },
  { value: "rainy", label: "雨天", icon: CloudRain },
];

const CULTURE_TAGS = ["六朝文化", "民国文化", "明代文化", "秦淮文化"];

function parseClock(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function DynamicPlanningControls({
  options,
  weatherError,
  onChange,
  onRefreshWeather,
}: DynamicPlanningControlsProps) {
  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-cloud/70 bg-white/45 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-ink">动态条件</p>
        <button
          type="button"
          onClick={onRefreshWeather}
          className="inline-flex items-center gap-1 text-[10px] text-rock hover:text-ink"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          更新天气
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1" aria-label="天气条件">
        {WEATHER_OPTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange({ weatherCondition: item.value })}
              className={cn(
                "flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px]",
                options.weatherCondition === item.value
                  ? "bg-primary text-white"
                  : "bg-white/70 text-rock hover:bg-white",
              )}
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>
      {weatherError && (
        <p className="text-[10px] leading-relaxed text-amber-700" role="status">
          天气接口暂不可用，正在使用缓存或南京默认样本；路线仍可计算。
        </p>
      )}

      <label className="flex items-center justify-between gap-3 text-[10px] text-rock">
        <span>计划出发时间</span>
        <input
          type="time"
          value={clockLabel(options.departureTimeMinutes)}
          onChange={(event) => onChange({ departureTimeMinutes: parseClock(event.target.value) })}
          className="rounded-lg border border-cloud/70 bg-white/80 px-2 py-1 text-[11px] text-ink outline-none focus:border-primary"
        />
      </label>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          aria-pressed={options.avoidCrowds}
          onClick={() => onChange({ avoidCrowds: !options.avoidCrowds })}
          className={cn(
            "flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px]",
            options.avoidCrowds ? "bg-primary text-white" : "bg-white/70 text-rock",
          )}
        >
          <Users className="h-3 w-3" aria-hidden="true" />
          避开拥挤
        </button>
        <button
          type="button"
          aria-pressed={options.nightMode}
          onClick={() => onChange({ nightMode: !options.nightMode })}
          className={cn(
            "flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px]",
            options.nightMode ? "bg-ink text-paper" : "bg-white/70 text-rock",
          )}
        >
          <Moon className="h-3 w-3" aria-hidden="true" />
          城市夜游
        </button>
      </div>

      {options.preference === "culture" && (
        <div>
          <p className="text-[10px] text-rock">文化主题重点</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {CULTURE_TAGS.map((tag) => {
              const active = options.cultureFocusTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({
                    cultureFocusTags: active
                      ? options.cultureFocusTags.filter((item) => item !== tag)
                      : [...options.cultureFocusTags, tag],
                  })}
                  className={cn(
                    "rounded-full px-2 py-1 text-[10px]",
                    active ? "bg-gold text-white" : "bg-white/75 text-rock",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
