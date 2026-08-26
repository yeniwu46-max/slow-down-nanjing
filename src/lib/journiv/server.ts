import { cookies } from "next/headers";
import type {
  AuthLoginResponse,
  CreateMomentPayload,
  JournivJournal,
  JournivMood,
  JournivMoment,
  MomentPageResponse,
  UpdateMomentPayload,
} from "./types";

export const JOURNIV_ACCESS_COOKIE = "journiv_access_token";
export const JOURNIV_REFRESH_COOKIE = "journiv_refresh_token";
export const CITY_DIARY_JOURNAL_COOKIE = "journiv_city_journal_id";
export const CITY_DIARY_JOURNAL_TITLE = "\u6211\u7684\u57CE\u5E02\u65E5\u8BB0";

const BASE = () =>
  process.env.JOURNIV_API_URL ?? "https://demo.almostadatacenter.com/api/v1";

export class JournivApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "JournivApiError";
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new JournivApiError("Invalid JSON from Journiv", res.status, text);
  }
}

export async function journivFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (rest.body && !headers.has("Content-Type") && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${BASE()}${path}`, { ...rest, headers, cache: "no-store" });
  } catch (cause) {
    throw new JournivApiError(
      cause instanceof Error ? cause.message : "\u65E0\u6CD5\u8FDE\u63A5 Journiv \u670D\u52A1",
      503,
    );
  }

  if (!res.ok) {
    const body = await res.text();
    throw new JournivApiError(`Journiv ${path} \u2192 ${res.status}`, res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return parseJson<T>(res);
}

export async function getTokensFromCookies(): Promise<{
  accessToken?: string;
  refreshToken?: string;
}> {
  const jar = await cookies();
  return {
    accessToken: jar.get(JOURNIV_ACCESS_COOKIE)?.value,
    refreshToken: jar.get(JOURNIV_REFRESH_COOKIE)?.value,
  };
}

export async function getValidAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken } = await getTokensFromCookies();
  if (accessToken) return accessToken;

  if (!refreshToken) return null;

  try {
    const data = await journivFetch<{ access_token: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const jar = await cookies();
    jar.set(JOURNIV_ACCESS_COOKIE, data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });
    return data.access_token;
  } catch {
    return null;
  }
}

export async function journivHealth(): Promise<{ ok: boolean; message?: string }> {
  try {
    const root = BASE().replace(/\/api\/v1\/?$/, "");
    const res = await fetch(`${root}/health`, { cache: "no-store" });
    return { ok: res.ok };
  } catch {
    return { ok: false, message: "Journiv \u672A\u542F\u52A8" };
  }
}

export async function journivLogin(email: string, password: string): Promise<AuthLoginResponse> {
  return journivFetch<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function journivRegister(
  email: string,
  password: string,
  name: string,
): Promise<AuthLoginResponse> {
  await journivFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  return journivLogin(email, password);
}

export async function listJournals(token: string): Promise<JournivJournal[]> {
  return journivFetch<JournivJournal[]>("/journals/", { token });
}

export async function createJournal(token: string, title: string): Promise<JournivJournal> {
  return journivFetch<JournivJournal>("/journals/", {
    method: "POST",
    token,
    body: JSON.stringify({
      title,
      description: "\u5357\u4EAC\u6162\u884C\u57CE\u5E02\u65E5\u8BB0",
      color: "#7FA79B",
      icon: "\uD83C\uDF3F",
    }),
  });
}

export async function ensureCityDiaryJournal(token: string): Promise<string> {
  const jar = await cookies();
  const cached = jar.get(CITY_DIARY_JOURNAL_COOKIE)?.value;
  if (cached) {
    try {
      await journivFetch(`/journals/${cached}`, { token });
      return cached;
    } catch {
      /* fall through */
    }
  }

  const journals = await listJournals(token);
  const existing = journals.find((j) => j.title === CITY_DIARY_JOURNAL_TITLE);
  const journal = existing ?? (await createJournal(token, CITY_DIARY_JOURNAL_TITLE));

  jar.set(CITY_DIARY_JOURNAL_COOKIE, journal.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return journal.id;
}

export async function listMoments(
  token: string,
  params: Record<string, string | number | undefined>,
): Promise<MomentPageResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return journivFetch<MomentPageResponse>(`/moments${suffix}`, { token });
}

export async function getMoment(token: string, id: string): Promise<JournivMoment> {
  return journivFetch<JournivMoment>(`/moments/${id}`, { token });
}

export async function createMoment(
  token: string,
  payload: CreateMomentPayload,
): Promise<JournivMoment> {
  return journivFetch<JournivMoment>("/moments", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateMoment(
  token: string,
  id: string,
  payload: UpdateMomentPayload,
): Promise<JournivMoment> {
  return journivFetch<JournivMoment>(`/moments/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteMoment(token: string, id: string): Promise<void> {
  await journivFetch<void>(`/moments/${id}`, { method: "DELETE", token });
}

export async function listMoods(token: string): Promise<JournivMood[]> {
  return journivFetch<JournivMood[]>("/moods/", { token });
}

export async function uploadMedia(
  token: string,
  momentId: string,
  file: Blob,
  filename: string,
): Promise<{ id: string }> {
  const form = new FormData();
  form.append("file", file, filename);
  form.append("moment_id", momentId);
  return journivFetch<{ id: string }>("/media/upload", {
    method: "POST",
    token,
    body: form,
  });
}

export async function signMedia(token: string, mediaId: string): Promise<{ signed_url: string }> {
  return journivFetch<{ signed_url: string }>(`/media/${mediaId}/sign`, { token });
}
