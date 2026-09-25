"use client";

import { useCallback, useEffect, useState } from "react";
import type { WeatherSnapshot } from "@/lib/weather/types";
import { NANJING_COORDS, WEATHER_CACHE_KEY } from "@/lib/weather/types";

interface UseWeatherResult {
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function readCache(allowStale = false): WeatherSnapshot | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherSnapshot;
    const age = Date.now() - new Date(parsed.fetchedAt).getTime();
    if (!allowStale && age > 30 * 60 * 1000) return null;
    return { ...parsed, source: "cache" };
  } catch {
    return null;
  }
}

function writeCache(snapshot: WeatherSnapshot) {
  try {
    sessionStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota errors */
  }
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  const res = await fetch(`/api/weather?${params.toString()}`, {
    signal: AbortSignal.timeout(4500),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "天气获取失败");
  return data as WeatherSnapshot;
}

export function useWeather(): UseWeatherResult {
  // Keep the server render and the first client render identical. Browser-only
  // cache data is read by load() after hydration.
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (skipCache = false) => {
    if (!skipCache) {
      const cached = readCache();
      if (cached) {
        setWeather(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const snapshot = await fetchWeather(NANJING_COORDS.lat, NANJING_COORDS.lng);
      writeCache(snapshot);
      setWeather(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "天气获取失败");
      setWeather((prev) => {
        const cached = readCache(true);
        return prev ?? cached ?? {
          condition: "cloudy",
          temperature: 22,
          isDay: true,
          description: "南京默认多云样本",
          lat: NANJING_COORDS.lat,
          lng: NANJING_COORDS.lng,
          fetchedAt: "2026-09-01T08:00:00+08:00",
          source: "fallback",
        };
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return {
    weather,
    loading,
    error,
    refresh: () => void load(true),
  };
}
