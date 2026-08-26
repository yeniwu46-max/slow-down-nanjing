/** Nanjing center - default map viewport */
export const NANJING_CENTER: [number, number] = [118.7969, 32.055];

export const NANJING_BOUNDS: [[number, number], [number, number]] = [
  [118.70, 31.90],
  [118.99, 32.20],
];

/** Style URLs tried in order until one loads */
export const MAP_STYLE_CANDIDATES = [
  "/map/basemap-style.json",
  "/map/basemap-style-osm.json",
  "https://demotiles.maplibre.org/style.json",
  "https://tiles.openfreemap.org/styles/liberty",
] as const;

/** @deprecated use MAP_STYLE_CANDIDATES */
export const BASE_MAP_STYLE = MAP_STYLE_CANDIDATES[0];

export const MAP_COLORS = {
  primary: "#7fa79b",
  gold: "#c6a36b",
  mist: "#c8d6d4",
  ink: "#445854",
  paper: "#faf8f4",
  visited: "#7fa79b",
  planned: "#ffffff",
  unexplored: "#d9d6d0",
} as const;

export const MAP_SOURCE_IDS = {
  pois: "slow-down-pois",
  route: "slow-down-route",
  routeAlt: "slow-down-route-alt",
  routeGlow: "slow-down-route-glow",
  heatmap: "slow-down-heatmap",
} as const;

export const MAP_LAYER_IDS = {
  routeGlow: "route-glow-line",
  routeMain: "route-main-line",
  routeDash: "route-dash-line",
  routeAltGlow: "route-alt-glow-line",
  routeAltMain: "route-alt-main-line",
  poiVisited: "poi-visited",
  poiPlanned: "poi-planned",
  poiUnexplored: "poi-unexplored",
  poiLabels: "poi-labels",
  heatmap: "exploration-heatmap",
} as const;
