import type { ExperienceScene, GestureId } from "./types";

/** Map detected gesture to the action gesture for the current scene */
export function normalizeGestureForScene(
  scene: ExperienceScene,
  id: GestureId,
): GestureId {
  switch (scene) {
    case "home":
      if (
        id === "release_wind" ||
        id === "start_journey" ||
        id === "open_story"
      ) {
        return "start_journey";
      }
      return id;
    case "wind":
      if (id === "start_journey" || id === "embrace_city") {
        return "release_wind";
      }
      return id;
    case "route":
      if (
        id === "release_wind" ||
        id === "start_journey" ||
        id === "switch_scenery"
      ) {
        return "light_route";
      }
      return id;
    case "badge":
      if (
        id === "release_wind" ||
        id === "collect_today" ||
        id === "embrace_city" ||
        id === "start_journey"
      ) {
        return "collect_badge";
      }
      return id;
    case "guide":
      if (id === "start_journey") return "release_wind";
      if (id === "collect_today") return "collect_badge";
      if (id === "embrace_city") return "collect_badge";
      return id;
    default:
      return id;
  }
}

export const SCENE_NEXT_ROUTE: Partial<Record<ExperienceScene, string>> = {
  home: "/experience/guide",
  guide: "/experience/wind",
  wind: "/experience/route",
  route: "/experience/badge",
  badge: "/map",
};

export function expandedAllowedGestures(scene: ExperienceScene): GestureId[] {
  const base: Record<ExperienceScene, GestureId[]> = {
    home: ["release_wind", "start_journey", "embrace_city", "open_story"],
    guide: [
      "release_wind",
      "light_route",
      "collect_badge",
      "open_story",
      "switch_scenery",
      "start_journey",
      "collect_today",
      "embrace_city",
    ],
    wind: ["release_wind", "start_journey"],
    route: [
      "light_route",
      "release_wind",
      "start_journey",
      "open_story",
      "switch_scenery",
    ],
    badge: ["collect_badge", "collect_today", "release_wind", "embrace_city"],
  };
  return base[scene];
}
