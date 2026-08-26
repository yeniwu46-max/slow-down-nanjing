export interface CollectedRoute {
  id: string;
  name: string;
  nameEn?: string;
  duration: string;
  distance: string;
  tagline?: string;
  collectedAt: string;
}

export interface ProfileOverrides {
  name?: string;
  avatar?: string;
  tags?: string[];
  signature?: string;
}

const ROUTES_KEY = "slowdown_collected_routes";
const PROFILE_KEY = "slowdown_profile_overrides";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCollectedRoutes(): CollectedRoute[] {
  return readJson<CollectedRoute[]>(ROUTES_KEY, []);
}

export function saveCollectedRoute(route: Omit<CollectedRoute, "collectedAt">): CollectedRoute[] {
  const routes = getCollectedRoutes();
  if (routes.some((r) => r.id === route.id)) return routes;
  const next = [{ ...route, collectedAt: new Date().toISOString() }, ...routes];
  writeJson(ROUTES_KEY, next);
  return next;
}

export function removeCollectedRoute(id: string): CollectedRoute[] {
  const next = getCollectedRoutes().filter((r) => r.id !== id);
  writeJson(ROUTES_KEY, next);
  return next;
}

export function isRouteCollected(id: string): boolean {
  return getCollectedRoutes().some((r) => r.id === id);
}

export function getProfileOverrides(): ProfileOverrides {
  return readJson<ProfileOverrides>(PROFILE_KEY, {});
}

export function saveProfileOverrides(overrides: Partial<ProfileOverrides>): ProfileOverrides {
  const next = { ...getProfileOverrides(), ...overrides };
  writeJson(PROFILE_KEY, next);
  return next;
}
