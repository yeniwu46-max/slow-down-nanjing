"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGestureStore } from "@/stores/use-gesture-store";

export function ExhibitionModeToggle() {
  const exhibitionMode = useGestureStore((s) => s.exhibitionMode);
  const setExhibitionMode = useGestureStore((s) => s.setExhibitionMode);
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.toggle("exhibition-mode", exhibitionMode);
    return () => document.body.classList.remove("exhibition-mode");
  }, [exhibitionMode]);

  if (!pathname.startsWith("/experience")) return null;

  return (
    <button
      type="button"
      onClick={() => setExhibitionMode(!exhibitionMode)}
      className={cn(
        "fixed top-4 right-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full glass shadow-s transition-colors hover:bg-white/60",
      )}
      aria-label={
        exhibitionMode
          ? "\u9000\u51fa\u5c55\u89c8\u6a21\u5f0f"
          : "\u5c55\u89c8\u6a21\u5f0f"
      }
    >
      {exhibitionMode ? (
        <Minimize2 className="h-4 w-4 text-ink" />
      ) : (
        <Maximize2 className="h-4 w-4 text-ink" />
      )}
    </button>
  );
}
