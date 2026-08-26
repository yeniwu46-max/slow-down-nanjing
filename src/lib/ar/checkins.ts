export interface ArCheckinRecord {
  spotId: string;
  badgeId: string;
  at: string;
  certHash: string;
  letterTitle: string;
}

const CHECKINS_KEY = "slowdown:ar:checkins";

export function readArCheckins(): ArCheckinRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHECKINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArCheckinRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasArBadge(badgeId: string) {
  return readArCheckins().some((c) => c.badgeId === badgeId);
}

export function getArCheckinByBadge(badgeId: string) {
  return readArCheckins().find((c) => c.badgeId === badgeId);
}
