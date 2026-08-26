"use client";

import { Hero } from "@/components/home/hero";
import { MoodSection } from "@/components/home/mood-section";
import { EmotionWeatherBanner } from "@/components/home/emotion-weather-banner";
import { RouteBanner } from "@/components/home/route-banner";
import { SlowPathBanner } from "@/components/home/slow-path-banner";
import { WeatherProvider } from "@/components/home/weather-context";
import { WeatherRecommendation } from "@/components/home/weather-recommendation";

export function HomeContent() {
  return (
    <WeatherProvider>
      <Hero />
      <div className="mt-16 space-y-16">
        <WeatherRecommendation />
        <MoodSection />
        <SlowPathBanner />
        <EmotionWeatherBanner />
        <RouteBanner />
      </div>
    </WeatherProvider>
  );
}
