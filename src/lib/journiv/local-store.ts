import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import type { JournivMood, JournivMoment, JournivUser } from "./types";

export const JOURNIV_LOCAL_USER_COOKIE = "journiv_local_user";

export const LOCAL_MOODS: JournivMood[] = [
  { id: "mood-calm", name: "\u5E73\u9759", icon: "\uD83C\uDF3F", score: 4 },
  { id: "mood-happy", name: "\u6109\u60A6", icon: "\uD83C\uDF1E", score: 5 },
  { id: "mood-tired", name: "\u75B2\u60EB", icon: "\uD83C\uDF19", score: 2 },
  { id: "mood-moved", name: "\u611F\u52A8", icon: "\u2728", score: 5 },
];

function moodById(id?: string) {
  return LOCAL_MOODS.find((m) => m.id === id);
}

function seedMoments(): JournivMoment[] {
  const now = new Date().toISOString();
  return [
    {
      id: "local-1",
      logged_date_tz: "2024-06-20",
      logged_at_utc: now,
      logged_timezone: "Asia/Shanghai",
      location_json: { name: "\u7384\u6B66\u6E56" },
      primary_mood_id: "mood-calm",
      mood_activity: [{ mood: LOCAL_MOODS[0] }],
      entry: {
        id: "entry-1",
        title: "\u7384\u6B66\u6E56",
        content_plain_text:
          "\u6CBF\u7740\u6E56\u8FB9\u6162\u6162\u5730\u8D70\uFF0C\u5FAE\u98CE\u62A1\u8FC7\u6C34\u9762\uFF0C\u57CE\u5899\u7684\u5F71\u5B50\u843D\u5728\u6E56\u91CC\uFF0C\u65F6\u95F4\u597D\u50CF\u4E5F\u6162\u4E86\u4E0B\u6765\u3002",
      },
      media: [],
      media_count: 0,
    },
    {
      id: "local-2",
      logged_date_tz: "2024-06-18",
      logged_at_utc: now,
      logged_timezone: "Asia/Shanghai",
      location_json: { name: "\u9889\u548C\u8DEF" },
      primary_mood_id: "mood-happy",
      mood_activity: [{ mood: LOCAL_MOODS[1] }],
      entry: {
        id: "entry-2",
        title: "\u9889\u548C\u8DEF",
        content_plain_text:
          "\u5348\u540E\u7684\u9633\u5149\u5F88\u597D\uFF0C\u8D70\u8FC7\u6850\u6811\u63A9\u6620\u7684\u8857\u5DF7\uFF0C\u8001\u623F\u5B50\u5B89\u9759\u5730\u7ACB\u5728\u90A3\u91CC\uFF0C\u50CF\u5728\u548C\u65F6\u5149\u4F4E\u58F0\u8BF4\u8BDD\u3002",
      },
      media: [],
      media_count: 0,
    },
  ];
}

/** In-memory store (persists for dev server lifetime; resets on restart) */
const store: { moments: JournivMoment[]; seeded: boolean } = {
  moments: [],
  seeded: false,
};

function ensureSeed() {
  if (!store.seeded) {
    store.moments = seedMoments();
    store.seeded = true;
  }
}

export async function localListMoods(): Promise<JournivMood[]> {
  return LOCAL_MOODS;
}

export async function localListMoments(params: {
  start_date?: string;
  end_date?: string;
}): Promise<{ items: JournivMoment[] }> {
  ensureSeed();
  let items = [...store.moments];
  if (params.start_date) {
    items = items.filter((m) => m.logged_date_tz >= params.start_date!);
  }
  if (params.end_date) {
    items = items.filter((m) => m.logged_date_tz <= params.end_date!);
  }
  items.sort((a, b) => b.logged_date_tz.localeCompare(a.logged_date_tz));
  return { items };
}

export async function localGetMoment(id: string): Promise<JournivMoment | null> {
  ensureSeed();
  return store.moments.find((m) => m.id === id) ?? null;
}

export async function localCreateMoment(input: {
  place: string;
  content: string;
  moodId?: string;
  date?: string;
  photoDataUrl?: string;
}): Promise<JournivMoment> {
  ensureSeed();
  const id = randomUUID();
  const mood = moodById(input.moodId);
  const date = input.date ?? new Date().toISOString().slice(0, 10);
  const moment: JournivMoment = {
    id,
    logged_date_tz: date,
    logged_at_utc: new Date().toISOString(),
    logged_timezone: "Asia/Shanghai",
    location_json: { name: input.place },
    primary_mood_id: input.moodId,
    mood_activity: mood ? [{ mood }] : [],
    entry: {
      id: randomUUID(),
      title: input.place,
      content_plain_text: input.content,
    },
    media: input.photoDataUrl
      ? [{ id: randomUUID(), thumbnail_url: input.photoDataUrl, mime_type: "image/jpeg" }]
      : [],
    media_count: input.photoDataUrl ? 1 : 0,
  };
  store.moments.unshift(moment);
  return moment;
}

export async function localUpdateMoment(
  id: string,
  input: { place?: string; content?: string; moodId?: string },
): Promise<JournivMoment | null> {
  ensureSeed();
  const idx = store.moments.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  const current = store.moments[idx];
  const mood = moodById(input.moodId ?? current.primary_mood_id);
  const updated: JournivMoment = {
    ...current,
    location_json: input.place ? { name: input.place } : current.location_json,
    primary_mood_id: input.moodId ?? current.primary_mood_id,
    mood_activity: mood ? [{ mood }] : current.mood_activity,
    entry: {
      ...current.entry,
      id: current.entry?.id ?? randomUUID(),
      title: input.place ?? current.entry?.title,
      content_plain_text: input.content ?? current.entry?.content_plain_text,
    },
  };
  store.moments[idx] = updated;
  return updated;
}

export async function localDeleteMoment(id: string): Promise<boolean> {
  ensureSeed();
  const before = store.moments.length;
  store.moments = store.moments.filter((m) => m.id !== id);
  return store.moments.length < before;
}

export async function setLocalUserCookie(user: JournivUser) {
  const jar = await cookies();
  jar.set(JOURNIV_LOCAL_USER_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getLocalUser(): Promise<JournivUser | null> {
  const jar = await cookies();
  const raw = jar.get(JOURNIV_LOCAL_USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JournivUser;
  } catch {
    return null;
  }
}

export async function clearLocalUser() {
  const jar = await cookies();
  jar.delete(JOURNIV_LOCAL_USER_COOKIE);
}

export function localLoginUser(email: string, name?: string): JournivUser {
  return {
    id: randomUUID(),
    email,
    name: name ?? email.split("@")[0],
  };
}
