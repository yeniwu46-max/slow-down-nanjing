"use client";

import { useEffect, useRef } from "react";
import type * as PhaserTypes from "phaser";
import type { FragmentProgress, RouteDefinition } from "@/game/types";

interface GameCanvasProps {
  route: RouteDefinition;
  progress: FragmentProgress[];
  reducedMotion: boolean;
}

function waitForBox(el: HTMLElement) {
  if (el.clientWidth >= 8 && el.clientHeight >= 8) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const observer = new ResizeObserver(() => {
      if (el.clientWidth >= 8 && el.clientHeight >= 8) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(el);
    window.setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 1600);
  });
}

export function GameCanvas({ route, progress, reducedMotion }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<PhaserTypes.Game | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function mountGame() {
      if (!containerRef.current) return;

      try {
        const [PhaserImport, { CollectionScene }] = await Promise.all([
          import("phaser"),
          import("@/game/scenes/collection-scene"),
        ]);

        if (cancelled || !containerRef.current) return;
        await waitForBox(containerRef.current);
        if (cancelled || !containerRef.current) return;

        gameRef.current?.destroy(true);
        gameRef.current = new PhaserImport.Game({
          type: PhaserImport.AUTO,
          parent: containerRef.current,
          backgroundColor: route.palette.bg,
          scale: {
            mode: PhaserImport.Scale.RESIZE,
            autoCenter: PhaserImport.Scale.CENTER_BOTH,
            width: Math.max(containerRef.current.clientWidth, 320),
            height: Math.max(containerRef.current.clientHeight, 420),
          },
          transparent: false,
          scene: [],
          input: {
            activePointers: 3,
          },
        });

        gameRef.current.scene.add("CollectionScene", CollectionScene, true, {
          route,
          progress,
          reducedMotion,
        });
      } catch (error) {
        console.error("Failed to mount collection scene", error);
      }
    }

    void mountGame();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // 只在进入路线时挂载；progress 变化时不重建，避免点击/拖拽被中断
  }, [route.id, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="h-[min(70vh,640px)] min-h-[420px] w-full touch-none overflow-hidden rounded-[2rem] border border-white/60 shadow-l"
      aria-label={`${route.title} 风物收纳场景`}
    />
  );
}
