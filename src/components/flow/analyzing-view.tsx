"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AudioLines, ImageIcon, Leaf, MapPin } from "lucide-react";
import { MapMini } from "@/components/map/map-mini";
import { ANALYSIS_STEPS } from "@/lib/flow/mock";
import { FooterBar } from "@/components/layout/footer-bar";
import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";

const iconMap = {
  leaf: Leaf,
  audio: AudioLines,
  image: ImageIcon,
  route: MapPin,
};

export function AnalyzingView() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers = ANALYSIS_STEPS.map((_, i) =>
      setTimeout(() => setActiveStep(i), (i + 1) * 900),
    );

    const redirect = setTimeout(() => router.push("/flow/result"), 4500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <>
      <div className="grid flex-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-medium text-ink md:text-3xl">
              正在为你铺一条金陵慢路
            </h1>
            <p className="mt-2 text-sm text-rock">
              请稍等片刻，把今天的心情交给这座城…
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-m">
            <MapMini className="h-full w-full" showRoute pitch={38} zoom={11} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          </div>
        </div>

        <div className="space-y-4">
          {ANALYSIS_STEPS.map((step, index) => {
            const Icon = iconMap[step.icon];
            const isDone = activeStep > index;
            const isActive = activeStep === index;

            return (
              <GlassPanel
                key={step.title}
                strong
                className={cn(
                  "flex items-start gap-4 p-5 shadow-m transition-opacity",
                  !isDone && !isActive && "opacity-60",
                )}
              >
                <Icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="font-medium text-ink">{step.title}</p>
                  <p className="mt-1 text-sm text-rock">{step.subtitle}</p>
                </div>
                <span
                  className={cn(
                    "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                    isDone || isActive ? "bg-primary" : "bg-cloud",
                    isActive && "animate-pulse",
                  )}
                />
              </GlassPanel>
            );
          })}
        </div>
      </div>

      <FooterBar
        backHref="/flow/photo"
        slogan={"\u6162\u4e00\u70b9\uff0c\u624d\u4f1a\u9047\u89c1\u57ce\u5e02\u7684\u6e29\u5ea6"}
      />
    </>
  );
}
