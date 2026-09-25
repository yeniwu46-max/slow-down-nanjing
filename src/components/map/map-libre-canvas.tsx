"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import maplibregl, { type Map, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  MAP_LAYER_IDS,
  MAP_SOURCE_IDS,
  MAP_STYLE_CANDIDATES,
  NANJING_BOUNDS,
  NANJING_CENTER,
} from "@/lib/map/constants";
import { filterPois, MAP_POIS, poisToGeoJSON } from "@/lib/map/pois";
import { emptyRouteGeoJSON, routeToGeoJSON, WUTONG_ROUTE } from "@/lib/map/routes";
import {
  createAltRouteLayers,
  createHeatmapLayer,
  createPoiLayers,
  createRouteLayers,
} from "@/lib/map/style-layers";
import type { MapFilter, MapPoi, MapRoute } from "@/lib/map/types";
import { cn } from "@/lib/utils";

export interface MapLibreHandle {
  map: Map | null;
  flyToPoi: (poi: MapPoi) => void;
  fitRoute: (route: MapRoute) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetBearing: () => void;
}

export interface MapLibreCanvasProps {
  className?: string;
  filter?: MapFilter;
  showRoute?: boolean;
  showHeatmap?: boolean;
  showLabels?: boolean;
  interactive?: boolean;
  pitch?: number;
  bearing?: number;
  zoom?: number;
  center?: [number, number];
  route?: MapRoute;
  altRoute?: MapRoute | null;
  pois?: MapPoi[];
  onPoiClick?: (poi: MapPoi) => void;
  children?: ReactNode;
}

function addCustomLayers(
  map: Map,
  pois: MapPoi[],
  showRoute: boolean,
  showHeatmap: boolean,
  showLabels: boolean,
  route: MapRoute,
  altRoute: MapRoute | null,
) {
  if (!map.getSource(MAP_SOURCE_IDS.pois)) {
    map.addSource(MAP_SOURCE_IDS.pois, {
      type: "geojson",
      data: poisToGeoJSON(pois),
    });
  }

  if (!map.getSource(MAP_SOURCE_IDS.route)) {
    map.addSource(MAP_SOURCE_IDS.route, {
      type: "geojson",
      data: showRoute ? routeToGeoJSON(route) : emptyRouteGeoJSON(),
    });
  }

  if (!map.getSource(MAP_SOURCE_IDS.routeAlt)) {
    map.addSource(MAP_SOURCE_IDS.routeAlt, {
      type: "geojson",
      data: altRoute ? routeToGeoJSON(altRoute) : emptyRouteGeoJSON(),
    });
  }

  if (!map.getLayer("exploration-heatmap")) {
    map.addLayer(createHeatmapLayer());
  }
  map.setLayoutProperty(
    "exploration-heatmap",
    "visibility",
    showHeatmap ? "visible" : "none",
  );

  if (showRoute) {
    createRouteLayers().forEach((layer) => {
      if (!map.getLayer(layer.id)) map.addLayer(layer);
    });
    createAltRouteLayers().forEach((layer) => {
      if (!map.getLayer(layer.id)) map.addLayer(layer);
    });
  }

  createPoiLayers(showLabels).forEach((layer) => {
    if (!map.getLayer(layer.id)) map.addLayer(layer);
  });
}

function bindPoiInteractions(
  map: Map,
  lookup: (id: string | undefined) => MapPoi | undefined,
  onPoiClick?: (poi: MapPoi) => void,
) {
  const handleClick = (e: MapMouseEvent) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["poi-visited", "poi-planned", "poi-unexplored"],
    });
    if (features.length > 0) {
      const id = features[0].properties?.id as string | undefined;
      const poi = lookup(id);
      if (poi) onPoiClick?.(poi);
    }
  };

  map.on("click", handleClick);

  for (const layerId of ["poi-visited", "poi-planned", "poi-unexplored"]) {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }
}

export const MapLibreCanvas = forwardRef<MapLibreHandle, MapLibreCanvasProps>(
  function MapLibreCanvas(
    {
      className,
      filter = "\u5168\u90e8",
      showRoute = true,
      showHeatmap = false,
      showLabels = true,
      interactive = true,
      pitch = 0,
      bearing = 0,
      zoom = 11.8,
      center = NANJING_CENTER,
      route = WUTONG_ROUTE,
      altRoute = null,
      pois = MAP_POIS,
      onPoiClick,
      children,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const styleIndexRef = useRef(0);
    const poisRef = useRef(pois);
    poisRef.current = pois;
    const onPoiClickRef = useRef(onPoiClick);
    onPoiClickRef.current = onPoiClick;
    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [degraded, setDegraded] = useState(false);

    useImperativeHandle(ref, () => ({
      map: mapRef.current,
      flyToPoi(poi) {
        mapRef.current?.flyTo({
          center: [poi.lng, poi.lat],
          zoom: 14,
          pitch: 45,
          duration: 1200,
        });
      },
      fitRoute(nextRoute) {
        const map = mapRef.current;
        const coords = nextRoute.coordinates;
        if (!map || coords.length === 0) return;
        if (coords.length === 1) {
          map.flyTo({ center: coords[0], zoom: 14, duration: 1000 });
          return;
        }
        const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
        coords.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, { padding: 88, duration: 1100, maxZoom: 14, pitch: 36 });
      },
      resetView() {
        mapRef.current?.flyTo({
          center: NANJING_CENTER,
          zoom: 11.8,
          pitch,
          bearing: 0,
          duration: 1000,
        });
      },
      zoomIn() {
        mapRef.current?.zoomIn({ duration: 300 });
      },
      zoomOut() {
        mapRef.current?.zoomOut({ duration: 300 });
      },
      resetBearing() {
        mapRef.current?.resetNorth({ duration: 500 });
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container || mapRef.current) return;

      let cancelled = false;
      let ready = false;
      let tileErrorCount = 0;
      styleIndexRef.current = 0;

      const map = new maplibregl.Map({
        container,
        style: MAP_STYLE_CANDIDATES[0],
        center,
        zoom,
        pitch,
        bearing,
        maxBounds: NANJING_BOUNDS,
        attributionControl: false,
        interactive,
      });

      mapRef.current = map;

      if (interactive) {
        map.addControl(
          new maplibregl.AttributionControl({ compact: true }),
          "bottom-left",
        );
      }

      let interactionsBound = false;

      const tryNextStyle = () => {
        if (cancelled || ready) return;
        styleIndexRef.current += 1;
        const next = MAP_STYLE_CANDIDATES[styleIndexRef.current];
        if (next) {
          map.setStyle(next);
        } else {
          setLoadError("\u5730\u56fe\u5e95\u56fe\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u8fde\u63a5");
        }
      };

      map.on("load", () => {
        if (cancelled) return;
        try {
          addCustomLayers(map, pois, showRoute, showHeatmap, showLabels, route, altRoute);
          if (!interactionsBound) {
            bindPoiInteractions(
              map,
              (id) => poisRef.current.find((p) => p.id === id),
              (poi) => onPoiClickRef.current?.(poi),
            );
            interactionsBound = true;
          }
          map.resize();
          ready = true;
          setLoaded(true);
          setLoadError(null);
        } catch (err) {
          console.error("[MapLibre] layer setup failed:", err);
          setLoadError("\u5730\u56fe\u56fe\u5c42\u52a0\u8f7d\u5931\u8d25");
          ready = true;
          setLoaded(true);
        }
      });

      map.on("error", (e) => {
        if (cancelled) return;
        const sourceId =
          "sourceId" in e && typeof e.sourceId === "string" ? e.sourceId : undefined;
        if (sourceId?.startsWith("slow-down")) return;
        const message = e.error?.message ?? "";
        if (
          message.includes("Failed to fetch") ||
          message.includes("JSON") ||
          message.includes("sprite") ||
          message.includes("glyphs") ||
          message.includes("Source") ||
          message.includes("Tile")
        ) {
          if (ready) {
            tileErrorCount += 1;
            if (tileErrorCount >= 3) setDegraded(true);
          } else {
            tryNextStyle();
          }
        }
      });

      const resizeObserver = new ResizeObserver(() => {
        map.resize();
      });
      resizeObserver.observe(container);

      return () => {
        cancelled = true;
        resizeObserver.disconnect();
        map.remove();
        mapRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !loaded) return;

      const source = map.getSource(MAP_SOURCE_IDS.pois) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(poisToGeoJSON(filterPois(filter, pois)));
      }
    }, [filter, loaded, pois]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !loaded) return;

      const source = map.getSource(MAP_SOURCE_IDS.route) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(routeToGeoJSON(route));
      }
    }, [route, loaded]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !loaded) return;

      const source = map.getSource(MAP_SOURCE_IDS.routeAlt) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(altRoute ? routeToGeoJSON(altRoute) : emptyRouteGeoJSON());
      }
    }, [altRoute, loaded]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !loaded) return;

      const visibility = showRoute ? "visible" : "none";
      [
        "route-glow-line",
        "route-main-line",
        "route-dash-line",
        MAP_LAYER_IDS.routeAltGlow,
        MAP_LAYER_IDS.routeAltMain,
      ].forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
      });
    }, [showRoute, loaded]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !loaded) return;

      if (map.getLayer("exploration-heatmap")) {
        map.setLayoutProperty(
          "exploration-heatmap",
          "visibility",
          showHeatmap ? "visible" : "none",
        );
      }
    }, [showHeatmap, loaded]);

    return (
      <div className={cn("map-ink-wash relative h-full w-full overflow-hidden", className)}>
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        {!loaded && !loadError && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-paper/80">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-primary/30" />
              <p className="text-xs text-rock">{"\u5730\u56fe\u52a0\u8f7d\u4e2d\u2026"}</p>
            </div>
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-paper/90 px-6 text-center">
            <p className="text-sm text-rock">{loadError}。地点与路线数据已保留，可稍后重试。</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white"
            >
              重试地图
            </button>
          </div>
        )}
        {degraded && !loadError && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-amber-50/95 px-3 py-1.5 text-[10px] text-amber-800 shadow-sm">
            弱网模式：底图可能不完整，路线与地点仍可演示
          </div>
        )}
        {children}
      </div>
    );
  },
);
