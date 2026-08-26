export type JournivMode = "remote" | "local";

let cached: { mode: JournivMode; at: number } | null = null;
const CACHE_MS = 30_000;

function apiBase(): string {
  return process.env.JOURNIV_API_URL ?? "https://demo.almostadatacenter.com/api/v1";
}

export async function getJournivMode(force = false): Promise<JournivMode> {
  if (process.env.JOURNIV_FORCE_LOCAL === "true") return "local";
  if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.mode;

  const base = apiBase().replace(/\/api\/v1\/?$/, "");
  const urls = [`${base}/api/v1/health`, `${base}/health`];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      const res = await fetch(url, { cache: "no-store", signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        cached = { mode: "remote", at: Date.now() };
        return "remote";
      }
    } catch {
      /* try next */
    }
  }

  cached = { mode: "local", at: Date.now() };
  return "local";
}

export function clearJournivModeCache() {
  cached = null;
}
