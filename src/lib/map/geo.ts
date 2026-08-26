export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function pathDistanceKm(
  points: { lat: number; lng: number }[],
): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng,
    );
  }
  return total;
}

/** Polyline distance from [lng, lat] vertices (road-following lines). */
export function coordsDistanceKm(coords: [number, number][]): number {
  return pathDistanceKm(coords.map(([lng, lat]) => ({ lat, lng })));
}

export function estimateWalk(distanceKm: number, stops: number): {
  distance: string;
  duration: string;
} {
  // 城内按慢走；出城长线按公交/骑行混行，避免「半日」显示成 7 小时。
  const pace = distanceKm > 10 ? 8 : 15;
  const minutes = Math.round(distanceKm * pace + Math.max(0, stops) * 12);
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return {
      distance: `约 ${distanceKm.toFixed(1)} km`,
      duration: m ? `约 ${h}小时${m}分` : `约 ${h}小时`,
    };
  }
  return {
    distance: `约 ${distanceKm.toFixed(1)} km`,
    duration: `约 ${minutes}min`,
  };
}
