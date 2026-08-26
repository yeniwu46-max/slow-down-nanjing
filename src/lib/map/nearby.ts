import { MAP_POIS } from "@/lib/map/pois";
import type { MapPoi } from "@/lib/map/types";
import { NANJING_COORDS } from "@/lib/weather/types";
import { haversineKm } from "./geo";

const QUIET_KEYWORDS = ["咖啡", "书店", "餐厅", "茶", "慢生活"];

function isQuietSpot(poi: MapPoi): boolean {
  if (poi.category === "文艺生活") return true;
  return QUIET_KEYWORDS.some(
    (kw) => poi.name.includes(kw) || (poi.description?.includes(kw) ?? false),
  );
}

export function getQuietSpots(): MapPoi[] {
  return MAP_POIS.filter(isQuietSpot);
}

export function findNearestQuietSpot(
  lat: number,
  lng: number,
): { poi: MapPoi; distanceKm: number } | null {
  const spots = getQuietSpots();
  if (spots.length === 0) return null;

  let nearest = spots[0];
  let minDist = haversineKm(lat, lng, nearest.lat, nearest.lng);

  for (const poi of spots.slice(1)) {
    const dist = haversineKm(lat, lng, poi.lat, poi.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = poi;
    }
  }

  return { poi: nearest, distanceKm: minDist };
}

export function getGeolocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(NANJING_COORDS);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(NANJING_COORDS),
      { timeout: 8000, maximumAge: 300_000 },
    );
  });
}

export async function recommendNearestQuietSpot(): Promise<{
  poi: MapPoi;
  distanceKm: number;
}> {
  const coords = await getGeolocation();
  const result = findNearestQuietSpot(coords.lat, coords.lng);
  if (!result) {
    const fallback = MAP_POIS.find((p) => p.id === "1912") ?? MAP_POIS[0];
    return { poi: fallback, distanceKm: 0 };
  }
  return result;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
