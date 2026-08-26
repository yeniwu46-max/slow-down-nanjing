export type RouteId = "xuanwu" | "wutong" | "zijin" | "qinhuai";

export type FragmentInteraction = "ripple" | "wind" | "mist" | "light";

export interface FragmentDefinition {
  id: string;
  routeId: RouteId;
  name: string;
  symbol: string;
  slotId: string;
  hint: string;
  lore: string;
  image: string;
  x: number;
  y: number;
}

export interface RouteDefinition {
  id: RouteId;
  title: string;
  subtitle: string;
  sceneMood: string;
  intro: string;
  letter: string;
  stamp: string;
  interaction: FragmentInteraction;
  gestureHint: string;
  palette: {
    bg: string;
    ink: string;
    accent: string;
    soft: string;
  };
  fragments: FragmentDefinition[];
}

export interface FragmentProgress {
  id: string;
  found: boolean;
  placed: boolean;
  placedSlotId?: string;
}

export interface RouteProgress {
  routeId: RouteId;
  fragments: FragmentProgress[];
  completed: boolean;
  completedAt?: string;
}

export interface GameProgress {
  routes: Record<RouteId, RouteProgress>;
  activeRouteId: RouteId | null;
  soundEnabled: boolean;
  lastUpdatedAt: string;
}

export type GameView = "hub" | "route" | "journal" | "poster";

export interface FragmentEventPayload {
  routeId: RouteId;
  fragmentId: string;
}
