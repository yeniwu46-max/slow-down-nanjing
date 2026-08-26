"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { BatteryGauge } from "@/components/flow/battery-gauge";
import { SliderRow } from "@/components/flow/slider-row";
import { SLIDER_CONFIGS } from "@/lib/flow/mock";

export function BatteryForm() {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(SLIDER_CONFIGS.map((s) => [s.id, s.defaultValue])),
  );

  const batteryLevel = useMemo(() => {
    const avg =
      Object.values(values).reduce((sum, v) => sum + v, 0) /
      Object.values(values).length;
    return Math.round(100 - avg * 0.35);
  }, [values]);

  const statusText =
    batteryLevel >= 70
      ? "\u72b6\u6001\u826f\u597d\uff0c\u9002\u5408\u51fa\u53d1\u63a2\u7d22\u57ce\u5e02\u3002"
      : batteryLevel >= 40
        ? "\u9700\u8981\u4e00\u70b9\u6162\u8282\u594f\uff0c\u5357\u4eac\u4f1a\u63a5\u4f4f\u4f60\u3002"
        : "\u4eca\u5929\u9002\u5408\u7559\u767d\uff0c\u628a\u7a7a\u767d\u8fd8\u7ed9\u81ea\u5df1\u3002";

  return (
    <div className="flex flex-1 flex-col items-center gap-8 py-4">
      <BatteryGauge level={batteryLevel} statusText={statusText} />

      <div className="w-full max-w-lg space-y-3">
        {SLIDER_CONFIGS.map((config) => (
          <SliderRow
            key={config.id}
            config={config}
            value={values[config.id]}
            onChange={(v) => setValues((prev) => ({ ...prev, [config.id]: v }))}
          />
        ))}
      </div>

      <Button href="/flow/text" size="lg" className="mt-4">
        {"\u4e0b\u4e00\u6b65 \u8868\u8fbe\u6b64\u523b \u2192"}
      </Button>
    </div>
  );
}
