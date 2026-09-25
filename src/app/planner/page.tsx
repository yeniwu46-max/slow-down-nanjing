import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/layout/nav";
import { MapView } from "@/components/map/map-view";

export const metadata: Metadata = {
  title: "智能路线规划 | 宁可慢一点",
  description: "选择 2 至 5 个南京文旅地点，生成少走路与更慢、更有风景的路线方案。",
};

function PlannerFallback() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-sm text-rock">
      路线规划器加载中…
    </div>
  );
}

export default function PlannerPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-16">
        <Suspense fallback={<PlannerFallback />}>
          <MapView initialRecommendOpen />
        </Suspense>
      </main>
    </>
  );
}
