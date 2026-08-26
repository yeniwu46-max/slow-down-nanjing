import { Suspense } from "react";
import { Nav } from "@/components/layout/nav";
import { SideRail } from "@/components/layout/side-rail";
import { MapView } from "@/components/map/map-view";

function MapFallback() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-sm text-rock">
      地图加载中…
    </div>
  );
}

export default function MapPage() {
  return (
    <>
      <Nav />
      <SideRail active="album" />
      <main className="flex-1 pt-16 lg:pl-16">
        <Suspense fallback={<MapFallback />}>
          <MapView />
        </Suspense>
      </main>
    </>
  );
}
