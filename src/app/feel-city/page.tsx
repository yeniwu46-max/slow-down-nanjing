"use client";

import Link from "next/link";
import { ArrowLeft, CloudRain, CloudSun, Loader2, Sun, Umbrella } from "lucide-react";
import { Nav } from "@/components/layout/nav";
import { WeatherProvider, useWeatherContext } from "@/components/home/weather-context";
import {
  getWeatherRouteRecommendation,
  getWeatherTips,
} from "@/lib/weather/recommendations";
import type { WeatherCondition } from "@/lib/weather/types";

const CONDITION_ICONS: Record<WeatherCondition, typeof Sun> = {
  sunny: Sun,
  rainy: CloudRain,
  cloudy: CloudSun,
  other: Umbrella,
};

function FeelCityContent() {
  const { weather, loading, error } = useWeatherContext();

  if (loading && !weather) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-rock">
        <Loader2 className="h-5 w-5 animate-spin" />
        正在读取今日天气…
      </div>
    );
  }

  if (!weather) {
    return (
      <p className="py-24 text-center text-rock">
        {error ?? "暂时无法获取天气，请稍后再试。"}
      </p>
    );
  }

  const Icon = CONDITION_ICONS[weather.condition];
  const tips = getWeatherTips(weather.condition, weather.temperature);
  const rec = getWeatherRouteRecommendation(weather.condition);

  return (
    <div className="space-y-8">
      {/* 今日概况 */}
      <section className="glass-strong relative overflow-hidden rounded-3xl p-8 shadow-m">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              weather.condition === "rainy"
                ? "radial-gradient(circle at 20% 80%, #52627a 0%, transparent 50%)"
                : "radial-gradient(circle at 80% 20%, #60776c 0%, transparent 50%)",
          }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest text-rock uppercase">
              感受城市 · 南京
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-ink md:text-4xl">
              {tips.headline}
            </h1>
            <p className="mt-3 text-lg text-rock">
              当前 {weather.temperature}°C · {weather.description}
              {!weather.isDay && " · 夜间"}
            </p>
          </div>
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/50">
            <Icon className="h-10 w-10 text-primary" strokeWidth={1.25} />
          </span>
        </div>
      </section>

      {/* 温馨提示 */}
      <section className="glass rounded-3xl p-6 shadow-s md:p-8">
        <h2 className="font-serif text-xl font-medium text-ink">天气温馨提示</h2>
        <ul className="mt-4 space-y-3">
          {tips.tips.map((tip) => (
            <li key={tip} className="flex gap-3 text-sm leading-relaxed text-rock">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {tip}
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-2xl bg-white/50 px-4 py-3 text-sm text-ink">
          {tips.travelAdvice}
        </p>
      </section>

      {/* 路线推荐 */}
      <section className="glass rounded-3xl p-6 shadow-s md:p-8">
        <h2 className="font-serif text-xl font-medium text-ink">今日慢游推荐</h2>
        <Link
          href={rec.href}
          className="mt-4 flex items-center justify-between rounded-2xl bg-white/50 px-5 py-4 transition-colors hover:bg-white/70"
        >
          <div>
            <p className="font-serif text-lg text-ink">{rec.title}</p>
            <p className="mt-1 text-sm text-rock">{rec.subtitle}</p>
          </div>
          <span className="text-sm text-primary">进入路线 →</span>
        </Link>
      </section>

      {/* 情绪气象局入口 */}
      <section className="text-center">
        <p className="text-sm text-rock">也想看看心里的天气？</p>
        <Link
          href="/emotion-weather"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
        >
          前往情绪气象局 →
        </Link>
      </section>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-rock transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>
    </div>
  );
}

export default function FeelCityPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-20 md:px-10 md:pt-24">
        <WeatherProvider>
          <FeelCityContent />
        </WeatherProvider>
      </main>
    </>
  );
}
