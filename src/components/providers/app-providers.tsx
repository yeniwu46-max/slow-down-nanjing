"use client";

import { type ReactNode } from "react";
import { useLenisScroll } from "@/hooks/use-lenis-scroll";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion";

export function AppProviders({ children }: { children: ReactNode }) {
  useLenisScroll(true);
  useReducedMotionPreference();
  return <>{children}</>;
}
