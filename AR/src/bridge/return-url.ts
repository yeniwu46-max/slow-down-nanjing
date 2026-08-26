import { getWebBaseUrl } from "./storage";

export function parseReturnPath(search: string) {
  const params = new URLSearchParams(search);
  return params.get("return") ?? "/badges";
}

export function parseSpotId(search: string) {
  const params = new URLSearchParams(search);
  return params.get("spot") ?? "xuanwu-lake";
}

export function parseWebBase(search: string) {
  const params = new URLSearchParams(search);
  return params.get("webBase") ?? getWebBaseUrl();
}

export function buildWebReturnUrl(returnPath: string, query: Record<string, string> = {}) {
  const base = getWebBaseUrl().replace(/\/$/, "");
  const path = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return qs ? `${base}${path}?${qs}` : `${base}${path}`;
}

export function buildScanUrl(spotId: string, returnPath = "/badges", webBase?: string) {
  const params = new URLSearchParams({ spot: spotId, return: returnPath });
  if (webBase) params.set("webBase", webBase);
  return `/scan?${params.toString()}`;
}
