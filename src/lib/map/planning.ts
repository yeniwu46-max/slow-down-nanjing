import type { MapRoute } from "./types";
import type { WeatherCondition } from "../weather/types";
import type { SemanticIntent } from "../semantic/types";

export type OriginMode = "poi" | "current";
export type WalkingAbility = "relaxed" | "balanced" | "active";
export type RoutePreference = "efficiency" | "scenery" | "culture";

export interface CurrentLocation {
  lat: number;
  lng: number;
  source?: "device" | "nanjing-default";
}

export interface PlanningOptions {
  originMode: OriginMode;
  startPoiId: string | null;
  currentLocation: CurrentLocation | null;
  timeBudgetMinutes: number;
  walkingAbility: WalkingAbility;
  preference: RoutePreference;
  weatherCondition: WeatherCondition;
  departureTimeMinutes: number;
  closedPoiIds: string[];
  avoidCrowds: boolean;
  nightMode: boolean;
  cultureFocusTags: string[];
  cultureFocusEntityIds: string[];
  semanticIntent: SemanticIntent | null;
  scenarioId: "rain-short" | "culture-closing" | "weekend-night" | null;
}

export const NANJING_DEFAULT_ORIGIN: CurrentLocation = {
  lat: 32.0417,
  lng: 118.7848,
  source: "nanjing-default",
};

export const DEFAULT_PLANNING_OPTIONS: PlanningOptions = {
  originMode: "poi",
  startPoiId: null,
  currentLocation: null,
  timeBudgetMinutes: 120,
  walkingAbility: "balanced",
  preference: "scenery",
  weatherCondition: "cloudy",
  departureTimeMinutes: 14 * 60,
  closedPoiIds: [],
  avoidCrowds: false,
  nightMode: false,
  cultureFocusTags: [],
  cultureFocusEntityIds: [],
  semanticIntent: null,
  scenarioId: null,
};

const WALKING_TIME_FACTOR: Record<WalkingAbility, number> = {
  relaxed: 1.2,
  balanced: 1,
  active: 0.88,
};

export function walkingTimeFactor(ability: WalkingAbility): number {
  return WALKING_TIME_FACTOR[ability];
}

export function clockLabel(minutes: number): string {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const rest = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function durationToMinutes(duration: string): number {
  const hours = Number(duration.match(/(\d+)小时/)?.[1] ?? 0);
  const minutes = Number(duration.match(/(\d+)(?:分|min)/)?.[1] ?? 0);
  return hours * 60 + minutes;
}

function formatDuration(minutes: number): string {
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) return `约 ${rounded}min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest ? `约 ${hours}小时${rest}分` : `约 ${hours}小时`;
}

export function applyWalkingAbility(
  route: MapRoute,
  ability: WalkingAbility,
): MapRoute {
  const factor = WALKING_TIME_FACTOR[ability];
  if (route.metrics) {
    const walkingMinutes = Math.max(1, Math.round(route.metrics.walkingMinutes * factor));
    const metrics = {
      ...route.metrics,
      walkingMinutes,
      energyCost: Math.min(100, Math.round(route.metrics.energyCost * factor)),
    };
    return {
      ...route,
      metrics,
      duration: formatDuration(walkingMinutes + metrics.stayMinutes),
      explanations: route.explanations?.map((explanation) =>
        explanation.id === "walking-time"
          ? {
              ...explanation,
              text: `按当前体力状态，步行约 ${walkingMinutes} 分钟；另建议预留 ${metrics.stayMinutes} 分钟游览`,
            }
          : explanation,
      ),
    };
  }

  const minutes = durationToMinutes(route.duration);
  if (!minutes) return route;
  return {
    ...route,
    duration: formatDuration(minutes * factor),
  };
}
