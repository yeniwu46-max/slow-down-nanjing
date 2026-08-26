const CHECKINS_KEY = "slowdown:ar:checkins";
const WEB_BASE_KEY = "slowdown:ar:webBase";

export interface ArCheckinRecord {
  spotId: string;
  badgeId: string;
  at: string;
  certHash: string;
  letterTitle: string;
}

function randomHash() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function readCheckins(): ArCheckinRecord[] {
  try {
    const raw = localStorage.getItem(CHECKINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArCheckinRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCheckin(record: Omit<ArCheckinRecord, "at" | "certHash"> & Partial<Pick<ArCheckinRecord, "at" | "certHash">>) {
  const existing = readCheckins();
  const entry: ArCheckinRecord = {
    ...record,
    at: record.at ?? new Date().toISOString(),
    certHash: record.certHash ?? randomHash(),
  };
  const next = [entry, ...existing.filter((c) => c.spotId !== entry.spotId)];
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(next));
  return entry;
}

export function hasCheckin(spotId: string) {
  return readCheckins().some((c) => c.spotId === spotId);
}

export function setWebBaseUrl(url: string) {
  localStorage.setItem(WEB_BASE_KEY, url);
}

export function getWebBaseUrl() {
  return localStorage.getItem(WEB_BASE_KEY) ?? import.meta.env.VITE_WEB_BASE_URL ?? "http://localhost:3005";
}
