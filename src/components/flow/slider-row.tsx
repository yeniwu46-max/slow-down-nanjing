"use client";

import { Cloud, Footprints, Sun, Users } from "lucide-react";
import type { SliderConfig } from "@/lib/flow/mock";
import { GlassPanel } from "@/components/ui/glass-panel";

const iconMap = {
  cloud: Cloud,
  sun: Sun,
  users: Users,
  footprints: Footprints,
};

interface SliderRowProps {
  config: SliderConfig;
  value: number;
  onChange: (value: number) => void;
}

export function SliderRow({ config, value, onChange }: SliderRowProps) {
  const Icon = iconMap[config.icon];

  return (
    <GlassPanel className="flex items-center gap-4 rounded-full px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-ink" strokeWidth={1.5} />
      <span className="hidden w-20 shrink-0 text-sm text-ink sm:block">{config.label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-cloud accent-primary"
        aria-label={config.label}
      />
      <div className="shrink-0 text-right">
        <span className="text-sm font-medium text-ink">{value}</span>
        <span className="ml-2 hidden text-xs text-rock sm:inline">
          {config.getDescription(value)}
        </span>
      </div>
    </GlassPanel>
  );
}
