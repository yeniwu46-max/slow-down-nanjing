import type { WeatherCondition, WeatherSnapshot } from "./types";
import { NANJING_COORDS } from "./types";

/** WMO Weather interpretation codes (WW) → app condition */
export function wmoCodeToCondition(code: number): WeatherCondition {
  if (code === 0) return "sunny";
  if (code >= 1 && code <= 3) return "cloudy";
  if (code >= 45 && code <= 48) return "cloudy";
  if (code >= 51 && code <= 67) return "rainy";
  if (code >= 80 && code <= 82) return "rainy";
  if (code >= 95 && code <= 99) return "rainy";
  return "other";
}

const CONDITION_LABELS: Record<WeatherCondition, string> = {
  sunny: "晴",
  cloudy: "多云",
  rainy: "雨",
  other: "多变",
};

export function conditionLabel(condition: WeatherCondition): string {
  return CONDITION_LABELS[condition];
}

interface OpenMeteoCurrent {
  temperature_2m: number;
  weather_code: number;
  is_day: number;
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
}

export async function fetchWeatherFromOpenMeteo(
  lat: number = NANJING_COORDS.lat,
  lng: number = NANJING_COORDS.lng,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: "weather_code,temperature_2m,is_day",
    timezone: "Asia/Shanghai",
  });

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { next: { revalidate: 1800 } },
  );

  if (!res.ok) {
    throw new Error(`Open-Meteo 请求失败 (${res.status})`);
  }

  const data = (await res.json()) as OpenMeteoResponse;
  const condition = wmoCodeToCondition(data.current.weather_code);

  return {
    condition,
    temperature: Math.round(data.current.temperature_2m),
    isDay: data.current.is_day === 1,
    description: conditionLabel(condition),
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
  };
}
