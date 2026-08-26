"use client";

import { useCallback, useEffect, useState } from "react";
import type { JournivMoment, JournivMood, JournivUser } from "@/lib/journiv/types";

function monthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

const WEEKDAYS = [
  "\u661F\u671F\u65E5",
  "\u661F\u671F\u4E00",
  "\u661F\u671F\u4E8C",
  "\u661F\u671F\u4E09",
  "\u661F\u671F\u56DB",
  "\u661F\u671F\u4E94",
  "\u661F\u671F\u516D",
];

export function formatMomentDate(loggedDateTz: string) {
  const d = new Date(`${loggedDateTz}T12:00:00`);
  return {
    day: `${d.getMonth() + 1}.${d.getDate()}`,
    weekday: WEEKDAYS[d.getDay()],
    label: `${d.getFullYear()}\u5E74${d.getMonth() + 1}\u6708`,
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useJournivDiary(initialYear?: number, initialMonth?: number) {
  const now = new Date();
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);

  const [mode, setMode] = useState<"remote" | "local" | null>(null);
  const [modeMessage, setModeMessage] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<JournivUser | null>(null);
  const [moments, setMoments] = useState<JournivMoment[]>([]);
  const [moods, setMoods] = useState<JournivMood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/journiv/health");
      const data = (await res.json()) as {
        ok: boolean;
        mode?: "remote" | "local";
        message?: string;
      };
      setMode(data.mode ?? "local");
      setModeMessage(data.message ?? null);
      return data.ok;
    } catch {
      setMode("local");
      setModeMessage("Journiv \u4E0D\u53EF\u8FBE\uFF0C\u5DF2\u5207\u6362\u672C\u5730\u65E5\u8BB0\u6A21\u5F0F");
      return true;
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/journiv/auth");
      if (!res.ok) {
        setAuthenticated(false);
        setUser(null);
        return false;
      }
      const data = (await res.json()) as {
        authenticated: boolean;
        user?: JournivUser;
        mode?: "remote" | "local";
      };
      setAuthenticated(data.authenticated);
      setUser(data.user ?? null);
      if (data.mode) setMode(data.mode);
      return data.authenticated;
    } catch {
      setAuthenticated(false);
      return false;
    }
  }, []);

  const loadMoods = useCallback(async () => {
    const res = await fetch("/api/journiv/moods");
    if (res.ok) {
      setMoods((await res.json()) as JournivMood[]);
    }
  }, []);

  const loadMoments = useCallback(async () => {
    const { start, end } = monthRange(year, month);
    const res = await fetch(`/api/journiv/moments?start_date=${start}&end_date=${end}&limit=50`);
    if (!res.ok) throw new Error("\u52A0\u8F7D\u65E5\u8BB0\u5931\u8D25");
    const data = (await res.json()) as { items: JournivMoment[] };
    setMoments(data.items ?? []);
  }, [year, month]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await checkHealth();
      const authed = await checkSession();
      if (!authed) {
        setMoments([]);
        return;
      }
      await Promise.all([loadMoments(), loadMoods()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "\u52A0\u8F7D\u5931\u8D25");
    } finally {
      setLoading(false);
    }
  }, [checkHealth, checkSession, loadMoments, loadMoods]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const createEntry = async (payload: {
    place: string;
    content: string;
    moodId?: string;
    date?: string;
    photo?: File;
  }) => {
    const photoDataUrl = payload.photo ? await fileToDataUrl(payload.photo) : undefined;
    const res = await fetch("/api/journiv/moments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place: payload.place,
        content: payload.content,
        primary_mood_id: payload.moodId,
        logged_date_tz: payload.date ?? new Date().toISOString().slice(0, 10),
        title: payload.place,
        photoDataUrl,
      }),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      throw new Error(err.error ?? "\u521B\u5EFA\u5931\u8D25");
    }
    await loadMoments();
    return (await res.json()) as JournivMoment;
  };

  const updateEntry = async (
    id: string,
    payload: { place?: string; content?: string; moodId?: string },
  ) => {
    const res = await fetch(`/api/journiv/moments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place: payload.place,
        content: payload.content,
        primary_mood_id: payload.moodId,
        title: payload.place,
      }),
    });
    if (!res.ok) throw new Error("\u66F4\u65B0\u5931\u8D25");
    await loadMoments();
  };

  const deleteEntry = async (id: string) => {
    const res = await fetch(`/api/journiv/moments/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("\u5220\u9664\u5931\u8D25");
    await loadMoments();
  };

  return {
    year,
    month,
    monthLabel: `${year}\u5E74${month}\u6708`,
    mode,
    modeMessage,
    authenticated,
    user,
    moments,
    moods,
    loading,
    error,
    prevMonth,
    nextMonth,
    refresh,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
