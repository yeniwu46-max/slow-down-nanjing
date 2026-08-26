import { NextResponse } from "next/server";
import { JournivApiError } from "@/lib/journiv/server";

function parseJournivDetail(body?: string): string | null {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    const { detail } = parsed;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg?: unknown }).msg ?? "");
          }
          return "";
        })
        .filter(Boolean);
      if (messages.length) return messages.join("?");
    }
  } catch {
    if (body.trim()) return body.trim();
  }
  return null;
}

function mapAuthErrorMessage(status: number, detail: string | null, pathHint?: string): string {
  const text = (detail ?? "").toLowerCase();

  if (text.includes("already") && (text.includes("email") || text.includes("registered"))) {
    return "??????????????????";
  }
  if (text.includes("invalid email")) return "??????????";
  if (text.includes("name cannot be empty")) return "??????";
  if (status === 401 || text.includes("incorrect") || text.includes("invalid credentials")) {
    return "???????";
  }
  if (status === 403) return "????????";
  if (status === 503) return "???? Journiv ????????";

  if (pathHint?.includes("/auth/register")) return detail ?? "????????????";
  if (pathHint?.includes("/auth/login")) return detail ?? "?????????????";

  return detail ?? "??????????";
}

export function journivErrorResponse(error: unknown) {
  if (error instanceof JournivApiError) {
    const detail = parseJournivDetail(error.body);
    const pathMatch = error.message.match(/Journiv (\S+)/);
    const pathHint = pathMatch?.[1];
    const message = mapAuthErrorMessage(error.status, detail, pathHint);

    return NextResponse.json(
      { error: message, detail: error.body },
      { status: error.status >= 400 && error.status < 600 ? error.status : 500 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "???????" }, { status: 500 });
}
