"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  DEFAULT_PLANNING_OPTIONS,
  walkingTimeFactor,
  type PlanningOptions,
} from "@/lib/map/planning";
import { MOCK_ROUTES, WUTONG_ROUTE } from "@/lib/map/routes";
import { recommendTwoRoutes } from "@/lib/map/recommend";
import { useVisitStore } from "@/lib/map/visit-store";
import type { MapFilter, MapPoi, MapRoute } from "@/lib/map/types";
import { cn } from "@/lib/utils";
import { useWeather } from "@/hooks/use-weather";
import { MapLibre, type MapLibreHandle } from "./map-libre";
import { PoiPhotoCarousel } from "./poi-photo-carousel";
import { RecommendPanel } from "./recommend-panel";

const FILTERS: MapFilter[] = ["全部", "文化古迹", "自然风景", "街巷小巷", "文艺生活"];

const SCENARIOS: Record<NonNullable<PlanningOptions["scenarioId"]>, {
  pickedIds: string[];
  options: Partial<PlanningOptions>;
}> = {
  "rain-short": {
    pickedIds: ["jiming-temple", "taicheng"],
    options: {
      originMode: "current",
      startPoiId: null,
      currentLocation: {
        lat: 32.0699,
        lng: 118.7969,
        source: "nanjing-default",
      },
      timeBudgetMinutes: 45,
      walkingAbility: "relaxed",
      weatherCondition: "rainy",
      preference: "efficiency",
      departureTimeMinutes: 14 * 60,
      closedPoiIds: [],
      avoidCrowds: false,
      nightMode: false,
      cultureFocusTags: [],
    },
  },
  "culture-closing": {
    pickedIds: ["xuanwu-lake", "jiming-temple", "taicheng", "nanjing-museum", "presidential-palace"],
    options: {
      startPoiId: "xuanwu-lake",
      timeBudgetMinutes: 150,
      walkingAbility: "balanced",
      weatherCondition: "cloudy",
      preference: "culture",
      departureTimeMinutes: 16 * 60 + 10,
      closedPoiIds: [],
      avoidCrowds: false,
      nightMode: false,
      cultureFocusTags: ["六朝文化"],
    },
  },
  "weekend-night": {
    pickedIds: ["1912", "presidential-palace", "confucius-temple", "laomendong", "yihe-road"],
    options: {
      startPoiId: "1912",
      timeBudgetMinutes: 180,
      walkingAbility: "balanced",
      weatherCondition: "cloudy",
      preference: "scenery",
      departureTimeMinutes: 18 * 60 + 30,
      closedPoiIds: ["presidential-palace"],
      avoidCrowds: true,
      nightMode: true,
      cultureFocusTags: [],
    },
  },
};

export function MapView({
  initialRecommendOpen = false,
}: {
  initialRecommendOpen?: boolean;
}) {
  const searchParams = useSearchParams();
  const mapRef = useRef<MapLibreHandle>(null);
  const [activeFilter, setActiveFilter] = useState<MapFilter>("全部");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<MapRoute>(WUTONG_ROUTE);
  const [altRoute, setAltRoute] = useState<MapRoute | null>(null);
  const [recommendOpen, setRecommendOpen] = useState(initialRecommendOpen);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [planningOptions, setPlanningOptions] = useState<PlanningOptions>(
    DEFAULT_PLANNING_OPTIONS,
  );
  const [recShortest, setRecShortest] = useState<MapRoute | null>(null);
  const [recScenic, setRecScenic] = useState<MapRoute | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [replanMessage, setReplanMessage] = useState<string | null>(null);
  const [dataUpdatedAt, setDataUpdatedAt] = useState("2026-09-01T08:00:00+08:00");
  const [dataStatus, setDataStatus] = useState("本地场馆与道路样本（非实时）");
  const pendingReasonRef = useRef("首次规划");
  const { weather, error: weatherError, refresh: refreshWeather } = useWeather();

  const states = useVisitStore((s) => s.states);
  const setPoiState = useVisitStore((s) => s.setPoiState);
  const clearPoiState = useVisitStore((s) => s.clearPoiState);
  const statedPois = useMemo(() => applyPoiStates(states, MAP_POIS), [states]);
  const selectedPoi = selectedId
    ? statedPois.find((p) => p.id === selectedId) ?? null
    : null;
  const stats = getMapStats(statedPois, MOCK_ROUTES.length);

  useEffect(() => {
    if (!weather || planningOptions.scenarioId) return;
    const timer = window.setTimeout(() => {
      pendingReasonRef.current = "天气数据变化";
      setDataUpdatedAt(weather.fetchedAt);
      setDataStatus(
        weather.source === "live"
          ? "南京天气接口 + 本地场馆与道路样本"
          : weather.source === "cache"
            ? "缓存天气 + 本地场馆与道路样本（非实时）"
            : "南京默认天气 + 本地场馆与道路样本（非实时）",
      );
      setPlanningOptions((current) =>
        current.weatherCondition === weather.condition
          ? current
          : { ...current, weatherCondition: weather.condition },
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [planningOptions.scenarioId, weather]);

  useEffect(() => {
    const poiId = searchParams.get("poi");
    if (!poiId) return;
    const poi = getPoiById(poiId);
    if (!poi) return;
    const timer = window.setTimeout(() => {
      setSelectedId(poi.id);
      setActiveFilter("全部");
      mapRef.current?.flyToPoi(poi);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  function handleFilter(filter: MapFilter) {
    setActiveFilter(filter);
    setSelectedId(null);
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
    pendingReasonRef.current = "地点列表变化";
    if (pickedIds.includes(id)) {
      setPickedIds(pickedIds.filter((item) => item !== id));
      if (planningOptions.startPoiId === id) {
        setPlanningOptions((current) => ({ ...current, startPoiId: null }));
      }
      return;
    }
    if (pickedIds.length >= 5) return;
    setPickedIds([...pickedIds, id]);
    if (planningOptions.originMode === "poi" && !planningOptions.startPoiId) {
      setPlanningOptions((current) => ({ ...current, startPoiId: id }));
    }
  }

  function updatePlanningOptions(patch: Partial<PlanningOptions>) {
    if ("weatherCondition" in patch) pendingReasonRef.current = "天气变化";
    else if ("timeBudgetMinutes" in patch) pendingReasonRef.current = "剩余时间变化";
    else if ("closedPoiIds" in patch) pendingReasonRef.current = "地点开放状态变化";
    else pendingReasonRef.current = "体力或偏好变化";
    setDataUpdatedAt(new Date().toISOString());
    setPlanningOptions((current) => ({ ...current, ...patch }));
  }

  const resolveStartId = useCallback((): string | null => {
    const availableIds = pickedIds.filter((id) => !planningOptions.closedPoiIds.includes(id));
    if (
      planningOptions.originMode === "poi" &&
      planningOptions.startPoiId &&
      availableIds.includes(planningOptions.startPoiId)
    ) {
      return planningOptions.startPoiId;
    }

    // Current/default coordinates are a true origin. The optimizer is free to
    // choose the first stop instead of silently forcing the nearest POI.
    if (planningOptions.originMode === "current" && planningOptions.currentLocation) return null;

    return availableIds[0] ?? null;
  }, [pickedIds, planningOptions]);

  const runRecommend = useCallback((reason: string) => {
    if (!pickedIds.length) {
      setRecShortest(null);
      setRecScenic(null);
      setReplanMessage("没有可规划的地点，请重新选择。 ");
      return;
    }
    const startedAt = performance.now();
    const savedPlannedIds = statedPois
      .filter((p) => p.state === "planned")
      .map((p) => p.id);
    const culturalIds = planningOptions.preference === "culture"
      ? statedPois.filter((poi) => pickedIds.includes(poi.id) && poi.category === "文化古迹").map((poi) => poi.id)
      : [];
    const result = recommendTwoRoutes(
      pickedIds,
      [...new Set([...savedPlannedIds, ...culturalIds])],
      {
        startId: resolveStartId(),
        preference: planningOptions.preference,
        timeBudgetMinutes: planningOptions.timeBudgetMinutes,
        walkingFactor: walkingTimeFactor(planningOptions.walkingAbility),
        weatherCondition: planningOptions.weatherCondition,
        departureTimeMinutes: planningOptions.departureTimeMinutes,
        closedPoiIds: planningOptions.closedPoiIds,
        avoidCrowds: planningOptions.avoidCrowds,
        nightMode: planningOptions.nightMode,
        cultureFocusTags: planningOptions.cultureFocusTags,
        dataUpdatedAt,
        dataStatus,
        originCoordinates: planningOptions.originMode === "current"
          ? planningOptions.currentLocation
          : null,
      },
    );
    const calculationMs = Math.max(1, Math.round(performance.now() - startedAt));
    if (!result) {
      setRecShortest(null);
      setRecScenic(null);
      setReplanMessage("当前时间、闭馆状态和预算下没有可行路线。请增加时间或恢复地点。 ");
      return;
    }
    const calculatedAt = new Date().toISOString();
    const shortest = { ...result.shortest, calculationMs, calculatedAt };
    const scenic = { ...result.scenic, calculationMs, calculatedAt };
    const preferred = planningOptions.preference === "efficiency" ? shortest : scenic;
    const alternative = preferred.id === shortest.id ? scenic : shortest;
    setRecShortest(shortest);
    setRecScenic(scenic);
    setActiveRoute(preferred);
    setAltRoute(alternative);
    setReplanMessage(`${reason}，已在 ${calculationMs}ms 内重新规划`);
    mapRef.current?.fitRoute(preferred);
  }, [dataStatus, dataUpdatedAt, pickedIds, planningOptions, resolveStartId, statedPois]);

  function generateRecommend() {
    pendingReasonRef.current = "首次规划";
    setHasGenerated(true);
  }

  useEffect(() => {
    if (!hasGenerated) return;
    const timer = window.setTimeout(() => {
      runRecommend(pendingReasonRef.current);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [hasGenerated, pickedIds, planningOptions, runRecommend]);

  function applyScenario(id: NonNullable<PlanningOptions["scenarioId"]>) {
    const scenario = SCENARIOS[id];
    pendingReasonRef.current = "验收场景变化";
    setPickedIds(scenario.pickedIds);
    setPlanningOptions({
      ...DEFAULT_PLANNING_OPTIONS,
      ...scenario.options,
      scenarioId: id,
    });
    setDataUpdatedAt(new Date().toISOString());
    setDataStatus("固定验收场景 + 本地场馆与道路样本（非实时）");
    setHasGenerated(true);
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

          </div>
        </div>
      )}

      <RecommendPanel
        open={recommendOpen}
        selectedIds={pickedIds}
        shortest={recShortest}
        scenic={recScenic}
        activeId={activeRoute.id}
        planningOptions={planningOptions}
        replanMessage={replanMessage}
        weatherError={weatherError}
        onClose={() => setRecommendOpen(false)}
        onToggle={togglePick}
        onPlanningChange={updatePlanningOptions}
        onGenerate={generateRecommend}
        onPickRoute={pickRecommended}
        onApplyScenario={applyScenario}
        onRefreshWeather={refreshWeather}
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
