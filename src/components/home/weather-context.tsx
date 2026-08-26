"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useWeather } from "@/hooks/use-weather";
import type { WeatherSnapshot } from "@/lib/weather/types";

interface WeatherContextValue {
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const WeatherContext = createContext<WeatherContextValue | null>(null);

export function useWeatherContext(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx) {
    throw new Error("useWeatherContext must be used within WeatherProvider");
  }
  return ctx;
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const value = useWeather();

  return (
    <WeatherContext.Provider value={value}>
      <div
        data-weather={value.weather?.condition ?? "cloudy"}
        className="weather-themed contents"
      >
        {children}
      </div>
    </WeatherContext.Provider>
  );
}
