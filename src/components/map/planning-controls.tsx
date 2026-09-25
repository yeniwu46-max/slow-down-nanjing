"use client";

import { useState } from "react";
import { Clock3, Footprints, LocateFixed, SlidersHorizontal } from "lucide-react";
import { MAP_POIS } from "@/lib/map/pois";
import {
  NANJING_DEFAULT_ORIGIN,
  type PlanningOptions,
  type RoutePreference,
  type WalkingAbility,
} from "@/lib/map/planning";
import { cn } from "@/lib/utils";

interface PlanningControlsProps {
  options: PlanningOptions;
  selectedIds: string[];
  onChange: (patch: Partial<PlanningOptions>) => void;
}

const WALKING_OPTIONS: { value: WalkingAbility; label: string }[] = [
  { value: "relaxed", label: "轻松走" },
  { value: "balanced", label: "正常走" },
  { value: "active", label: "比较能走" },
];

const PREFERENCE_OPTIONS: { value: RoutePreference; label: string }[] = [
  { value: "efficiency", label: "效率" },
  { value: "scenery", label: "风景" },
  { value: "culture", label: "文化" },
];

export function PlanningControls({
  options,
  selectedIds,
  onChange,
}: PlanningControlsProps) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      onChange({ originMode: "current", currentLocation: NANJING_DEFAULT_ORIGIN });
      setLocationError("定位不可用，已切换至南京市中心默认起点。");
      return;
    }

    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          originMode: "current",
          currentLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            source: "device",
          },
        });
        setLocating(false);
      },
      () => {
        onChange({ originMode: "current", currentLocation: NANJING_DEFAULT_ORIGIN });
        setLocationError("定位未授权或暂时不可用，已使用南京市中心默认起点。");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }

  function useNanjingDefault() {
    setLocationError(null);
    onChange({ originMode: "current", currentLocation: NANJING_DEFAULT_ORIGIN });
  }

  return (
    <div className="mt-3 space-y-3 rounded-2xl bg-white/50 p-3">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink">
          <LocateFixed className="h-3.5 w-3.5 text-primary" />
          从哪里出发
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-paper/80 p-1">
          <button
            type="button"
            onClick={() => onChange({ originMode: "poi" })}
            className={cn(
              "rounded-lg px-2 py-1.5 text-[11px] transition-colors",
              options.originMode === "poi" ? "bg-white text-ink shadow-sm" : "text-rock",
            )}
          >
            指定起点
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            className={cn(
              "rounded-lg px-2 py-1.5 text-[11px] transition-colors",
              options.originMode === "current" && options.currentLocation?.source !== "nanjing-default"
                ? "bg-white text-ink shadow-sm"
                : "text-rock",
            )}
          >
            {locating ? "定位中…" : options.currentLocation?.source === "device" ? "位置已获取" : "当前位置"}
          </button>
          <button
            type="button"
            onClick={useNanjingDefault}
            className={cn(
              "rounded-lg px-1 py-1.5 text-[10px] transition-colors",
              options.originMode === "current" && options.currentLocation?.source === "nanjing-default"
                ? "bg-white text-ink shadow-sm"
                : "text-rock",
            )}
          >
            南京默认
          </button>
        </div>

        {options.originMode === "poi" ? (
          <select
            value={
              options.startPoiId && selectedIds.includes(options.startPoiId)
                ? options.startPoiId
                : ""
            }
            onChange={(event) => onChange({ startPoiId: event.target.value || null })}
            disabled={selectedIds.length === 0}
            className="mt-2 w-full rounded-xl border border-cloud/70 bg-white/70 px-3 py-2 text-[11px] text-ink outline-none focus:border-primary disabled:opacity-50"
            aria-label="指定路线起点"
          >
            <option value="">{selectedIds.length ? "请选择已选地点作为起点" : "先从下方选择地点"}</option>
            {selectedIds.map((id) => {
              const poi = MAP_POIS.find((item) => item.id === id);
              return poi ? (
                <option key={id} value={id}>
                  {poi.name}
                </option>
              ) : null;
            })}
          </select>
        ) : (
          <p className="mt-2 text-[10px] leading-relaxed text-rock">
            {options.currentLocation
              ? options.currentLocation.source === "nanjing-default"
                ? "当前使用南京默认起点，适合弱网或定位被拒绝时演示。"
                : "位置只在本机用于判断最先到达的已选地点，不会上传。"
              : "获取位置后，将从距离你最近的已选地点开始。"}
          </p>
        )}
        {locationError && <p className="mt-1 text-[10px] text-red-700">{locationError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="flex items-center gap-1 text-[10px] font-medium text-ink">
            <Clock3 className="h-3 w-3 text-primary" />
            剩余时间
          </span>
          <select
            value={options.timeBudgetMinutes}
            onChange={(event) => onChange({ timeBudgetMinutes: Number(event.target.value) })}
            className="mt-1.5 w-full rounded-xl border border-cloud/70 bg-white/70 px-2 py-2 text-[11px] text-ink outline-none focus:border-primary"
          >
            <option value={45}>45 分钟</option>
            <option value={60}>1 小时</option>
            <option value={90}>1.5 小时</option>
            <option value={120}>2 小时</option>
            <option value={150}>2.5 小时</option>
            <option value={180}>3 小时</option>
            <option value={240}>4 小时</option>
          </select>
        </label>

        <div>
          <span className="flex items-center gap-1 text-[10px] font-medium text-ink">
            <Footprints className="h-3 w-3 text-primary" />
            步行能力
          </span>
          <select
            value={options.walkingAbility}
            onChange={(event) => onChange({ walkingAbility: event.target.value as WalkingAbility })}
            className="mt-1.5 w-full rounded-xl border border-cloud/70 bg-white/70 px-2 py-2 text-[11px] text-ink outline-none focus:border-primary"
            aria-label="步行能力"
          >
            {WALKING_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="flex items-center gap-1 text-[10px] font-medium text-ink">
          <SlidersHorizontal className="h-3 w-3 text-primary" />
          路线偏好
        </span>
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {PREFERENCE_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange({ preference: item.value })}
              className={cn(
                "rounded-xl px-2 py-2 text-[11px] transition-colors",
                options.preference === item.value
                  ? "bg-primary text-white"
                  : "bg-white/70 text-rock hover:bg-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
