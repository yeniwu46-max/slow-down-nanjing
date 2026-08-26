import type { Metadata } from "next";
import { Suspense } from "react";
import { GameShell } from "@/components/game/game-shell";

export const metadata: Metadata = {
  title: "金陵风物收纳所 | 宁可慢一点",
  description: "在四段南京慢游记忆中收集风物碎片，生成属于自己的金陵慢游札记。",
};

function GameFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-rock">
      风物收纳所加载中…
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<GameFallback />}>
      <GameShell />
    </Suspense>
  );
}
