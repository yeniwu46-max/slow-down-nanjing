"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Navigation, RefreshCw, Star } from "lucide-react";
import { MapMini } from "@/components/map/map-mini";
import {
  MOCK_ROUTE_OPTIONS,
  type MockRouteDisplay,
  pickNextMockRoute,
  pickRandomMockRoute,
} from "@/lib/flow/mock";
import { ROUTE_BY_ID } from "@/lib/map/routes";
import type { MapRoute } from "@/lib/map/types";
import { isRouteCollected, saveCollectedRoute } from "@/lib/user/local-profile";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";

function buildGoogleMapsUrl(route: MapRoute) {
  const coords = route.coordinates;
  const origin = coords[0];
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(1, -1).map(([lng, lat]) => `${lat},${lng}`).join("|");
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin[1]},${origin[0]}`,
    destination: `${destination[1]},${destination[0]}`,
    travelmode: "walking",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function RouteResultView() {
  const router = useRouter();
  const [selectedRoute, setSelectedRoute] = useState<MockRouteDisplay | null>(null);
  const mapRoute = selectedRoute ? ROUTE_BY_ID[selectedRoute.id] : undefined;
  const [collected, setCollected] = useState(false);
  const [collectMsg, setCollectMsg] = useState<string | null>(null);

  useEffect(() => {
    const route = pickRandomMockRoute();
    setSelectedRoute(route);
    setCollected(isRouteCollected(route.id));
  }, []);

  useEffect(() => {
    if (!selectedRoute) return;
    setCollected(isRouteCollected(selectedRoute.id));
    setCollectMsg(null);
  }, [selectedRoute?.id]);

  function handleNavigate() {
    if (!selectedRoute || !mapRoute) return;
    window.open(buildGoogleMapsUrl(mapRoute), "_blank", "noopener,noreferrer");
    router.push("/map");
  }

  function handleCollect() {
    if (!selectedRoute) return;
    if (collected) {
      setCollectMsg("已在收藏中，可在个人中心查看");
      return;
    }
    saveCollectedRoute({
      id: selectedRoute.id,
      name: selectedRoute.name,
      nameEn: selectedRoute.nameEn,
      duration: selectedRoute.duration,
      distance: selectedRoute.distance,
      tagline: selectedRoute.tagline,
    });
    setCollected(true);
    setCollectMsg("已收藏，可在个人中心查看");
    setTimeout(() => setCollectMsg(null), 2500);
  }

  function handleRegenerate() {
    setSelectedRoute((current) =>
      current ? pickNextMockRoute(current.id) : pickRandomMockRoute(),
    );
  }

  if (!selectedRoute || !mapRoute) {
    return (
      <div className="flex flex-1 items-center justify-center pb-6">
        <div className="h-8 w-8 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pb-6">
      <div className="grid flex-1 gap-6 lg:grid-cols-[380px_1fr]">
        <GlassPanel strong className="space-y-5 p-6 shadow-m">
          <p className="text-xs text-rock">
            AI 为你推荐的路线 · {MOCK_ROUTE_OPTIONS.findIndex((item) => item.id === selectedRoute.id) + 1} / {MOCK_ROUTE_OPTIONS.length}
          </p>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">{selectedRoute.name}</h1>
            <p className="mt-1 font-serif italic text-gold">{selectedRoute.nameEn}</p>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: selectedRoute.rating }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-route-wutong text-route-wutong" />
            ))}
          </div>
          <div className="rounded-xl bg-paper/80 p-4 text-sm">
            <div className="flex justify-between text-ink">
              <span>{selectedRoute.duration}</span>
              <span>{selectedRoute.distance}</span>
            </div>
            <p className="mt-2 text-rock">{selectedRoute.tagline}</p>
          </div>
          <div className="space-y-1 text-sm leading-relaxed text-rock">
            {selectedRoute.description.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div>
            <h2 className="mb-3 text-sm font-medium text-ink">路线亮点</h2>
            <ul className="space-y-3">
              {selectedRoute.highlights.map((item) => (
                <li key={item.title} className="text-sm">
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-rock">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative h-32 overflow-hidden rounded-xl">
            <MapMini
              className="h-full w-full rounded-xl"
              showRoute
              zoom={12}
              pitch={40}
              route={mapRoute}
            />
          </div>
        </GlassPanel>

        <div className="relative min-h-[320px] overflow-hidden rounded-3xl shadow-m lg:min-h-[480px]">
          <MapMini
            className="h-full min-h-[320px] w-full lg:min-h-[480px]"
            showRoute
            pitch={48}
            zoom={11.4}
            route={mapRoute}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper/30 to-transparent" />
          <div className="absolute right-4 top-4 rounded-full glass px-3 py-1.5 text-xs text-ink">
            22°C · 适合出行
          </div>
        </div>
      </div>

      {collectMsg && (
        <p className="text-center text-sm text-primary">{collectMsg}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" className="min-w-[140px]" onClick={handleNavigate}>
          <Navigation className="h-4 w-4" />
          开始导航
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleCollect}
          className={cn(collected && "border-primary/40 text-primary")}
        >
          <Heart className={cn("h-4 w-4", collected && "fill-primary text-primary")} />
          {collected ? "已收藏" : "收藏路线"}
        </Button>
        <Button variant="secondary" size="lg" onClick={handleRegenerate}>
          <RefreshCw className="h-4 w-4" />
          重新生成
        </Button>
      </div>
    </div>
  );
}
