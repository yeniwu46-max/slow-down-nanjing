"use client";

import { usePathname } from "next/navigation";
import { GestureOverlay } from "@/components/gesture/gesture-overlay";

const GESTURE_EXCLUDED_PREFIXES = ["/experience", "/game", "/emotion-weather"];

export function GestureShell() {
  const pathname = usePathname();

  if (GESTURE_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return <GestureOverlay />;
}
