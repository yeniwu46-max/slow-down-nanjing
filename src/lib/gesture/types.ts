export type GestureId =
  | "release_wind"
  | "light_route"
  | "collect_badge"
  | "open_story"
  | "switch_scenery"
  | "embrace_city"
  | "collect_today"
  | "start_journey";

export interface GestureEvent {
  id: GestureId;
  confidence: number;
  timestamp: number;
  position?: { x: number; y: number };
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type ExperienceScene =
  | "home"
  | "guide"
  | "wind"
  | "route"
  | "badge";

export interface GestureHint {
  gestureId: GestureId;
  label: string;
  description: string;
}

export const GESTURE_HINTS: Record<GestureId, GestureHint> = {
  release_wind: {
    gestureId: "release_wind",
    label: "\u5f20\u5f00\u624b\u638c",
    description: "\u91ca\u653e\u98ce\uff0c\u8ba9\u8def\u7ebf\u6d41\u52a8",
  },
  light_route: {
    gestureId: "light_route",
    label: "\u624b\u638c\u4e0a\u6ed1",
    description: "\u9010\u6bb5\u70b9\u4eae\u6162\u884c\u8def\u7ebf",
  },
  collect_badge: {
    gestureId: "collect_badge",
    label: "\u53cc\u624b\u5408\u62e2",
    description: "\u6536\u96c6\u5fbd\u7ae0\uff0c\u5c01\u5b58\u8bb0\u5fc6",
  },
  open_story: {
    gestureId: "open_story",
    label: "\u98df\u6307\u70b9\u51fb",
    description: "\u5f00\u542f\u666f\u70b9\u6545\u4e8b",
  },
  switch_scenery: {
    gestureId: "switch_scenery",
    label: "\u6325\u624b",
    description: "\u5207\u6362\u57ce\u5e02\u98ce\u666f",
  },
  embrace_city: {
    gestureId: "embrace_city",
    label: "\u62e5\u62b1\u57ce\u5e02",
    description: "\u4e0e\u57ce\u5e02\u5efa\u7acb\u8fde\u63a5",
  },
  collect_today: {
    gestureId: "collect_today",
    label: "\u6536\u85cf\u4eca\u5929",
    description: "\u5c01\u5b58\u4eca\u65e5\u6162\u884c",
  },
  start_journey: {
    gestureId: "start_journey",
    label: "\u5f00\u542f\u65c5\u7a0b",
    description: "\u5f20\u5f00\u624b\u638c\uff0c\u5411\u524d\u542f\u7a0b",
  },
};

export const SCENE_GESTURES: Record<ExperienceScene, GestureId[]> = {
  home: ["release_wind", "start_journey", "embrace_city"],
  guide: [
    "release_wind",
    "light_route",
    "collect_badge",
    "open_story",
    "switch_scenery",
  ],
  wind: ["release_wind", "start_journey"],
  route: ["light_route", "release_wind", "open_story", "switch_scenery"],
  badge: ["collect_badge", "collect_today", "release_wind"],
};

export const OVERLAY_GESTURES: Record<string, GestureId[]> = {
  "/map": ["light_route", "open_story", "switch_scenery"],
  "/badges": ["collect_badge", "switch_scenery"],
  "/records": ["open_story", "collect_today"],
  "/diary": ["open_story", "switch_scenery"],
  "/share": ["collect_today", "open_story"],
};
