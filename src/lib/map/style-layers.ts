import type { FilterSpecification, LayerSpecification } from "maplibre-gl";
import { MAP_COLORS, MAP_LAYER_IDS, MAP_SOURCE_IDS } from "./constants";

const visitedFilter: FilterSpecification = [
  "==",
  ["get", "state"],
  "visited",
];
const plannedFilter: FilterSpecification = [
  "==",
  ["get", "state"],
  "planned",
];
const unexploredFilter: FilterSpecification = [
  "==",
  ["get", "state"],
  "unexplored",
];

export function createAltRouteLayers(): LayerSpecification[] {
  return [
    {
      id: MAP_LAYER_IDS.routeAltGlow,
      type: "line",
      source: MAP_SOURCE_IDS.routeAlt,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": MAP_COLORS.gold,
        "line-width": 10,
        "line-opacity": 0.16,
        "line-blur": 5,
      },
    },
    {
      id: MAP_LAYER_IDS.routeAltMain,
      type: "line",
      source: MAP_SOURCE_IDS.routeAlt,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": MAP_COLORS.gold,
        "line-width": 3.5,
        "line-opacity": 0.9,
        "line-dasharray": [2, 1.4],
      },
    },
  ];
}

export function createRouteLayers(): LayerSpecification[] {
  return [
    {
      id: MAP_LAYER_IDS.routeGlow,
      type: "line",
      source: MAP_SOURCE_IDS.route,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": MAP_COLORS.primary,
        "line-width": 12,
        "line-opacity": 0.18,
        "line-blur": 6,
      },
    },
    {
      id: MAP_LAYER_IDS.routeMain,
      type: "line",
      source: MAP_SOURCE_IDS.route,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": MAP_COLORS.primary,
        "line-width": 4,
        "line-opacity": 0.85,
      },
    },
    {
      id: MAP_LAYER_IDS.routeDash,
      type: "line",
      source: MAP_SOURCE_IDS.route,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": MAP_COLORS.gold,
        "line-width": 2,
        "line-opacity": 0.55,
        "line-dasharray": [1.5, 1.5],
      },
    },
  ];
}

export function createPoiLayers(showLabels = true): LayerSpecification[] {
  const layers: LayerSpecification[] = [
    {
      id: MAP_LAYER_IDS.poiUnexplored,
      type: "circle",
      source: MAP_SOURCE_IDS.pois,
      filter: unexploredFilter,
      paint: {
        "circle-radius": 7,
        "circle-color": MAP_COLORS.unexplored,
        "circle-stroke-width": 2,
        "circle-stroke-color": MAP_COLORS.ink,
        "circle-stroke-opacity": 0.35,
        "circle-opacity": 0.75,
      },
    },
    {
      id: MAP_LAYER_IDS.poiPlanned,
      type: "circle",
      source: MAP_SOURCE_IDS.pois,
      filter: plannedFilter,
      paint: {
        "circle-radius": 8,
        "circle-color": MAP_COLORS.planned,
        "circle-stroke-width": 3,
        "circle-stroke-color": MAP_COLORS.primary,
        "circle-opacity": 1,
      },
    },
    {
      id: MAP_LAYER_IDS.poiVisited,
      type: "circle",
      source: MAP_SOURCE_IDS.pois,
      filter: visitedFilter,
      paint: {
        "circle-radius": 9,
        "circle-color": MAP_COLORS.visited,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 1,
      },
    },
  ];

  if (showLabels) {
    layers.push({
      id: MAP_LAYER_IDS.poiLabels,
      type: "symbol",
      source: MAP_SOURCE_IDS.pois,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": 11,
        "text-offset": [0, 1.4],
        "text-anchor": "top",
        "text-max-width": 8,
      },
      paint: {
        "text-color": MAP_COLORS.ink,
        "text-halo-color": "rgba(250, 248, 244, 0.85)",
        "text-halo-width": 1.5,
      },
    });
  }

  return layers;
}

export function createHeatmapLayer(): LayerSpecification {
  return {
    id: MAP_LAYER_IDS.heatmap,
    type: "heatmap",
    source: MAP_SOURCE_IDS.pois,
    filter: visitedFilter,
    paint: {
      "heatmap-weight": 1,
      "heatmap-intensity": 0.6,
      "heatmap-radius": 28,
      "heatmap-opacity": 0.45,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(127, 167, 155, 0)",
        0.4,
        "rgba(127, 167, 155, 0.35)",
        0.7,
        "rgba(198, 163, 107, 0.45)",
        1,
        "rgba(127, 167, 155, 0.55)",
      ],
    },
  };
}
