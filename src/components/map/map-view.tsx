"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Compass,
  Flame,
  Heart,
  Map as MapIcon,
  MapPin,
  Minus,
  Plus,
  Route,
  Sparkles,
  X,
} from "lucide-react";
import { applyPoiStates, getMapStats, getPoiById, MAP_POIS } from "@/lib/map/pois";
import { MOCK_ROUTES, WUTONG_ROUTE } from "@/lib/map/routes";
import { recommendTwoRoutes } from "@/lib/map/recommend";
import { useVisitStore } from "@/lib/map/visit-store";
import type { MapFilter, MapPoi, MapRoute } from "@/lib/map/types";
import { cn } from "@/lib/utils";
import { getArScanUrl, isArEnabledSpot } from "@/lib/ar/links";
import { MapGestureEnhancement } from "@/components/gesture/page-gesture-effects";
import { MapLibre, type MapLibreHandle } from "./map-libre";
import { PoiPhotoCarousel } from "./poi-photo-carousel";
import { RecommendPanel } from "./recommend-panel";

const FILTERS: MapFilter[] = ["全部", "文化古迹", "自然风景", "街巷小巷", "文艺生活"];

export function MapView() {
  const searchParams = useSearchParams();
  const mapRef = useRef<MapLibreHandle>(null);
  const [activeFilter, setActiveFilter] = useState<MapFilter>("全部");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<MapRoute>(WUTONG_ROUTE);
  const [altRoute, setAltRoute] = useState<MapRoute | null>(null);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [recShortest, setRecShortest] = useState<MapRoute | null>(null);
  const [recScenic, setRecScenic] = useState<MapRoute | null>(null);

  const states = useVisitStore((s) => s.states);
  const setPoiState = useVisitStore((s) => s.setPoiState);
  const clearPoiState = useVisitStore((s) => s.clearPoiState);
  const statedPois = applyPoiStates(states, MAP_POIS);
  const selectedPoi = selectedId
    ? statedPois.find((p) => p.id === selectedId) ?? null
    : null;
  const stats = getMapStats(statedPois, MOCK_ROUTES.length);

  useEffect(() => {
    const poiId = searchParams.get("poi");
    if (!poiId) return;
    const poi = getPoiById(poiId);
    if (!poi) return;
    setSelectedId(poi.id);
    setActiveFilter("全部");
    const timer = window.setTimeout(() => {
      mapRef.current?.flyToPoi(poi);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  function handleFilter(filter: MapFilter) {
    setActiveFilter(filter);
    setSelectedId(null);
  }

  function cycleFilter() {
    const idx = FILTERS.indexOf(activeFilter);
    handleFilter(FILTERS[(idx + 1) % FILTERS.length]);
  }

  function selectPoi(poi: MapPoi) {
    setSelectedId(poi.id);
    setMobileSidebarOpen(false);
    mapRef.current?.flyToPoi(poi);
  }

  function pickPresetRoute(route: MapRoute) {
    setActiveRoute(route);
    setAltRoute(null);
    setRecShortest(null);
    setRecScenic(null);
    mapRef.current?.fitRoute(route);
  }

  function togglePick(id: string) {
    setPickedIds((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id);
      if (ids.length >= 5) return ids;
      return [...ids, id];
    });
  }

  function generateRecommend() {
    const plannedIds = statedPois
      .filter((p) => p.state === "planned")
      .map((p) => p.id);
    const result = recommendTwoRoutes(pickedIds, plannedIds);
    if (!result) return;
    setRecShortest(result.shortest);
    setRecScenic(result.scenic);
    setActiveRoute(result.shortest);
    setAltRoute(result.scenic);
    mapRef.current?.fitRoute(result.shortest);
  }

  function pickRecommended(route: MapRoute) {
    setActiveRoute(route);
    const other =
      route.id === recShortest?.id ? recScenic : recShortest;
    setAltRoute(other);
    mapRef.current?.fitRoute(route);
  }

  function markPoi(poi: MapPoi, next: "visited" | "planned") {
    if (poi.state === next) clearPoiState(poi.id);
    else setPoiState(poi.id, next);
  }

  return (
    <section className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      <MapLibre
        ref={mapRef}
        className="h-full w-full"
        filter={activeFilter}
        pois={statedPois}
        route={activeRoute}
        altRoute={altRoute}
        showRoute
        showHeatmap={showHeatmap}
        showLabels
        interactive
        pitch={42}
        zoom={11.6}
        onPoiClick={selectPoi}
      />

      <MapGestureEnhancement
        onFilterCycle={cycleFilter}
        onRouteLight={() => mapRef.current?.resetView()}
      />

      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className={cn(
          "absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full glass-strong px-3 py-2 text-xs font-medium text-ink shadow-m md:hidden",
          mobileSidebarOpen && "hidden",
        )}
      >
        <Route className="h-3.5 w-3.5" />
        路线与推荐
      </button>

      <div
        className={cn(
          "pointer-events-none absolute left-4 top-4 z-10 w-[88vw] max-w-[300px] animate-fade-up md:left-6 md:top-6",
          !mobileSidebarOpen && "max-md:hidden",
        )}
      >
        <div className="glass-strong pointer-events-auto max-h-[calc(100vh-8rem)] space-y-4 overflow-y-auto rounded-3xl p-5 shadow-l max-md:max-h-[min(78dvh,640px)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="font-serif text-xl font-semibold text-ink">我的南京地图</h1>
              <p className="mt-1 text-xs text-rock">点开一处风物，慢慢看，慢慢走。</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-rock hover:bg-white/60 md:hidden"
              aria-label="收起路线栏"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/50 p-3 text-center">
            {[
              { label: "已到访", value: String(stats.visitedCount), unit: "处" },
              { label: "待前往", value: String(stats.plannedCount), unit: "处" },
              { label: "慢行路线", value: String(stats.routeCount), unit: "条" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-serif text-lg font-semibold text-ink">
                  {s.value}
                  <span className="ml-0.5 text-[10px] font-normal text-rock">{s.unit}</span>
                </p>
                <p className="mt-0.5 text-[10px] text-rock">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-ink">图例</p>
            <div className="grid grid-cols-2 gap-y-2 text-[11px] text-rock">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" />
                已到访
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-primary" />
                待前往
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 rounded-full bg-primary" />
                当前路线
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 rounded-full bg-gold" />
                备选路线
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setRecommendOpen(true);
              setMobileSidebarOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium transition-colors",
              recommendOpen
                ? "bg-gold text-white"
                : "bg-primary text-white hover:bg-primary-hover",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            智能推荐
          </button>

          <div>
            <p className="mb-2 text-xs font-medium text-ink">规划路线</p>
            <div className="space-y-1.5">
              {MOCK_ROUTES.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => pickPresetRoute(route)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left transition-colors",
                    activeRoute.id === route.id && !altRoute
                      ? "bg-primary/15 ring-1 ring-primary"
                      : "bg-white/50 hover:bg-white/75",
                  )}
                >
                  <p className="truncate text-sm font-medium text-ink">{route.name}</p>
                  <p className="text-[11px] text-gold">
                    {route.duration} · {route.distance}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedPoi && (
        <div className="absolute bottom-24 left-1/2 z-10 w-[88vw] max-w-sm -translate-x-1/2 animate-fade-up md:bottom-28">
          <div className="glass-strong rounded-2xl p-3 shadow-l">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-rock">{selectedPoi.category}</p>
                <h3 className="font-serif text-base font-semibold text-ink">
                  {selectedPoi.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-rock hover:bg-white/60 hover:text-ink"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2">
              <PoiPhotoCarousel key={selectedPoi.id} name={selectedPoi.name} photos={selectedPoi.photos} />
            </div>

            {selectedPoi.description && (
              <p className="mt-2 text-xs leading-relaxed text-rock">{selectedPoi.description}</p>
            )}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => markPoi(selectedPoi, "visited")}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
                  selectedPoi.state === "visited"
                    ? "bg-primary text-white"
                    : "bg-white/70 text-ink hover:bg-white",
                )}
              >
                已到访
              </button>
              <button
                type="button"
                onClick={() => markPoi(selectedPoi, "planned")}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
                  selectedPoi.state === "planned"
                    ? "bg-gold text-white"
                    : "bg-white/70 text-ink hover:bg-white",
                )}
              >
                待前往
              </button>
            </div>

            {isArEnabledSpot(selectedPoi.id) && (
              <a
                href={getArScanUrl(selectedPoi.id, "/badges")}
                className="mt-2 block rounded-full bg-primary px-3 py-1.5 text-center text-[11px] font-medium text-white hover:bg-primary-hover"
              >
                玄武湖 AR 打卡
              </a>
            )}
          </div>
        </div>
      )}

      <RecommendPanel
        open={recommendOpen}
        selectedIds={pickedIds}
        shortest={recShortest}
        scenic={recScenic}
        activeId={activeRoute.id}
        onClose={() => setRecommendOpen(false)}
        onToggle={togglePick}
        onGenerate={generateRecommend}
        onPickRoute={pickRecommended}
      />

      <button
        type="button"
        onClick={() => mapRef.current?.resetBearing()}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full glass-strong text-ink shadow-m transition-transform hover:scale-105 md:right-6 md:top-6"
        aria-label="重置方向"
      >
        <Compass className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <div
        className={cn(
          "absolute right-4 z-10 flex flex-col gap-2 md:right-6",
          selectedPoi ? "bottom-[min(48vh,26rem)] md:bottom-24" : "bottom-24",
        )}
      >
        <button
          type="button"
          onClick={() => {
            setRecommendOpen((v) => !v);
            setMobileSidebarOpen(false);
          }}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full shadow-m transition-transform hover:scale-105",
            recommendOpen ? "bg-gold text-white" : "glass-strong text-ink",
            (recommendOpen || selectedPoi) && "max-md:hidden",
          )}
          aria-label="智能推荐"
          title="智能推荐"
        >
          <Sparkles className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <div className="flex flex-col overflow-hidden rounded-full glass-strong shadow-m">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex h-10 w-10 items-center justify-center text-ink hover:bg-white/50"
            aria-label="放大"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="mx-auto h-px w-5 bg-cloud" />
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex h-10 w-10 items-center justify-center text-ink hover:bg-white/50"
            aria-label="缩小"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowHeatmap((v) => !v)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full shadow-m transition-transform hover:scale-105",
            showHeatmap ? "bg-gold text-white" : "glass-strong text-ink",
          )}
          aria-label="切换热力图"
        >
          <Flame className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.resetView()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-m hover:scale-105"
          aria-label="重置视图"
        >
          <MapIcon className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="absolute bottom-5 left-1/2 z-10 flex max-w-[92vw] -translate-x-1/2 items-center gap-1.5 overflow-x-auto rounded-full glass-strong p-1.5 shadow-m">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => handleFilter(f)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs transition-colors",
              activeFilter === f
                ? "bg-primary text-white"
                : "text-rock hover:bg-white/50 hover:text-ink",
            )}
          >
            {f === "全部" ? (
              <Route className="h-3.5 w-3.5" />
            ) : f === "文化古迹" ? (
              <MapPin className="h-3.5 w-3.5" />
            ) : f === "自然风景" ? (
              <Heart className="h-3.5 w-3.5" />
            ) : null}
            {f}
          </button>
        ))}
      </div>
    </section>
  );
}
