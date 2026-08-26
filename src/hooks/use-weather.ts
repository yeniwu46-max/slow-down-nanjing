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

function readCache(): WeatherSnapshot | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherSnapshot;
    const age = Date.now() - new Date(parsed.fetchedAt).getTime();
    if (age > 30 * 60 * 1000) return null;
    return parsed;
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

function getGeolocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 300_000 },
    );
  });
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  const res = await fetch(`/api/weather?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "天气获取失败");
  return data as WeatherSnapshot;
}

export function useWeather(): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(() => readCache());
  const [loading, setLoading] = useState(!readCache());
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
      const coords = (await getGeolocation()) ?? NANJING_COORDS;
      const snapshot = await fetchWeather(coords.lat, coords.lng);
      writeCache(snapshot);
      setWeather(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "天气获取失败");
      setWeather((prev) =>
        prev ?? {
          condition: "cloudy",
          temperature: 22,
          isDay: true,
          description: "多云",
          lat: NANJING_COORDS.lat,
          lng: NANJING_COORDS.lng,
          fetchedAt: new Date().toISOString(),
        },
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    weather,
    loading,
    error,
    refresh: () => void load(true),
  };
}
