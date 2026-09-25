export type WeatherCondition = "rainy" | "sunny" | "cloudy" | "other";

export interface WeatherSnapshot {
  condition: WeatherCondition;
  temperature: number;
  isDay: boolean;
  description: string;
  lat: number;
  lng: number;
  fetchedAt: string;
  source: "live" | "cache" | "fallback";
}

export const NANJING_COORDS = { lat: 32.0603, lng: 118.7969 } as const;

export const WEATHER_CACHE_KEY = "slow-down-weather-v1";
