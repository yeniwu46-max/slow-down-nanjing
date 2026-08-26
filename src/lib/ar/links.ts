import { buildScanUrl } from "./scan-url";

const AR_BASE =
  process.env.NEXT_PUBLIC_AR_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3006";

export function getArScanUrl(
  spotId: string,
  returnPath = "/badges",
  webBase?: string,
) {
  const path = buildScanUrl(spotId, returnPath);
  const base = webBase ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:3005");
  return `${AR_BASE}${path}${path.includes("?") ? "&" : "?"}webBase=${encodeURIComponent(base)}`;
}

export const AR_ENABLED_SPOTS = ["xuanwu-lake"] as const;

export function isArEnabledSpot(poiId: string) {
  return (AR_ENABLED_SPOTS as readonly string[]).includes(poiId);
}
