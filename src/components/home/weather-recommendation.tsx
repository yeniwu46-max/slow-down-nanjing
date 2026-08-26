"use client";

import Link from "next/link";
import { CloudRain, Loader2, Sun } from "lucide-react";
import { useWeatherContext } from "@/components/home/weather-context";
import { getWeatherRouteRecommendation } from "@/lib/weather/recommendations";

export function WeatherRecommendation() {
  const { weather, loading } = useWeatherContext();

  if (loading && !weather) {
    return (
      <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4 text-sm text-rock">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在读取南京今日天气…
      </div>
    );
  }

  if (!weather) return null;

  const rec = getWeatherRouteRecommendation(weather.condition);
  const Icon = weather.condition === "rainy" ? CloudRain : Sun;

  const moodText =
    weather.condition === "rainy"
      ? "今天下雨，首页已切换雨天主题"
      : weather.condition === "sunny"
        ? "今天晴朗，首页已切换晴天主题"
        : "根据今日天气，为你推荐";

  return (
    <Link
      href={rec.href}
      className="glass group flex items-center gap-4 rounded-2xl px-5 py-4 shadow-s transition-all hover:-translate-y-0.5 hover:shadow-m"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-rock">{moodText}</p>
        <p className="font-serif text-base text-ink">
          推荐：{rec.title}
          <span className="ml-2 text-sm font-sans text-rock">
            {weather.temperature}°C · {weather.description}
          </span>
        </p>
        <p className="mt-0.5 truncate text-xs text-rock">{rec.subtitle}</p>
      </div>
      <span className="shrink-0 text-sm text-primary transition-transform group-hover:translate-x-0.5">
        去看看 →
      </span>
    </Link>
  );
}
