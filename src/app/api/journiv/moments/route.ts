import { NextResponse } from "next/server";
import { getLocalUser, localCreateMoment, localListMoments } from "@/lib/journiv/local-store";
import { getJournivMode } from "@/lib/journiv/mode";
import {
  createMoment,
  ensureCityDiaryJournal,
  getValidAccessToken,
  listMoments,
} from "@/lib/journiv/server";
import { journivErrorResponse } from "@/lib/journiv/route-utils";
import { plainTextToDelta } from "@/lib/journiv/quill";
import type { CreateMomentPayload } from "@/lib/journiv/types";

const UNAUTH = { error: "\u672A\u767B\u5F55" };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date") ?? undefined;
    const endDate = searchParams.get("end_date") ?? undefined;
    const limit = searchParams.get("limit") ?? "50";

    const mode = await getJournivMode();
    if (mode === "local") {
      const user = await getLocalUser();
      if (!user) return NextResponse.json(UNAUTH, { status: 401 });
      const data = await localListMoments({ start_date: startDate, end_date: endDate });
      return NextResponse.json({ items: data.items.slice(0, Number(limit) || 50) });
    }

    const token = await getValidAccessToken();
    if (!token) return NextResponse.json(UNAUTH, { status: 401 });

    const data = await listMoments(token, {
      start_date: startDate,
      end_date: endDate,
      search: searchParams.get("search") ?? undefined,
      limit,
    });

    return NextResponse.json(data);
  } catch (error) {
    return journivErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      logged_date_tz?: string;
      logged_timezone?: string;
      note?: string;
      primary_mood_id?: string;
      location_json?: { name?: string };
      title?: string;
      content?: string;
      place?: string;
      journal_id?: string;
      photoDataUrl?: string;
    };

    const mode = await getJournivMode();
    if (mode === "local") {
      const user = await getLocalUser();
      if (!user) return NextResponse.json(UNAUTH, { status: 401 });
      const moment = await localCreateMoment({
        place: body.place ?? body.title ?? "\u5357\u4EAC",
        content: body.content ?? "",
        moodId: body.primary_mood_id,
        date: body.logged_date_tz,
        photoDataUrl: body.photoDataUrl,
      });
      return NextResponse.json(moment, { status: 201 });
    }

    const token = await getValidAccessToken();
    if (!token) return NextResponse.json(UNAUTH, { status: 401 });

    const journalId = body.journal_id ?? (await ensureCityDiaryJournal(token));
    const payload: CreateMomentPayload = {
      logged_date_tz: body.logged_date_tz ?? new Date().toISOString().slice(0, 10),
      logged_timezone: body.logged_timezone ?? "Asia/Shanghai",
      note: body.note,
      primary_mood_id: body.primary_mood_id,
      location_json: body.place ? { name: body.place } : body.location_json,
      entry: {
        title: body.title ?? body.place ?? "\u57CE\u5E02\u65E5\u8BB0",
        journal_id: journalId,
        content_delta: body.content ? plainTextToDelta(body.content) : { ops: [{ insert: "\n" }] },
      },
    };

    const moment = await createMoment(token, payload);
    return NextResponse.json(moment, { status: 201 });
  } catch (error) {
    return journivErrorResponse(error);
  }
}
