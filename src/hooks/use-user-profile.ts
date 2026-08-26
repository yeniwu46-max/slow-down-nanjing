"use client";

import { useCallback, useEffect, useState } from "react";
import type { JournivUser } from "@/lib/journiv/types";
import {
  type CollectedRoute,
  type ProfileOverrides,
  getCollectedRoutes,
  getProfileOverrides,
  isRouteCollected,
  removeCollectedRoute,
  saveCollectedRoute,
  saveProfileOverrides,
} from "@/lib/user/local-profile";

export function useUserProfile() {
  const [user, setUser] = useState<JournivUser | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [signature, setSignature] = useState("");
  const [routes, setRoutes] = useState<CollectedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const applyOverrides = useCallback((overrides: ReturnType<typeof getProfileOverrides>, userData?: JournivUser | null) => {
    setDisplayName(overrides.name ?? userData?.name ?? userData?.email?.split("@")[0] ?? "");
    setAvatar(overrides.avatar);
    setTags(overrides.tags ?? []);
    setSignature(overrides.signature ?? "");
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journiv/auth");
      if (res.ok) {
        const data = (await res.json()) as { authenticated: boolean; user?: JournivUser };
        setAuthenticated(data.authenticated);
        setUser(data.user ?? null);
        applyOverrides(getProfileOverrides(), data.user);
      } else {
        setAuthenticated(false);
        setUser(null);
        applyOverrides(getProfileOverrides());
      }
      setRoutes(getCollectedRoutes());
    } finally {
      setLoading(false);
    }
  }, [applyOverrides]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const collectRoute = useCallback((route: Omit<CollectedRoute, "collectedAt">) => {
    const next = saveCollectedRoute(route);
    setRoutes(next);
    return next;
  }, []);

  const uncollectRoute = useCallback((id: string) => {
    const next = removeCollectedRoute(id);
    setRoutes(next);
    return next;
  }, []);

  const updateDisplayName = useCallback((name: string) => {
    const trimmed = name.trim();
    saveProfileOverrides({ name: trimmed });
    setDisplayName(trimmed);
  }, []);

  const updateProfile = useCallback((patch: Partial<ProfileOverrides>) => {
    const next = saveProfileOverrides(patch);
    if (patch.name !== undefined) setDisplayName(patch.name.trim());
    if (patch.avatar !== undefined) setAvatar(patch.avatar);
    if (patch.tags !== undefined) setTags(patch.tags);
    if (patch.signature !== undefined) setSignature(patch.signature);
    return next;
  }, []);

  return {
    user,
    authenticated,
    displayName,
    avatar,
    tags,
    signature,
    routes,
    loading,
    refresh,
    collectRoute,
    uncollectRoute,
    isRouteCollected,
    updateDisplayName,
    updateProfile,
  };
}
