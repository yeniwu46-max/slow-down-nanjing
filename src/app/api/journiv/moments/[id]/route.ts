import { NextResponse } from "next/server";
import {
  getLocalUser,
  localDeleteMoment,
  localGetMoment,
  localUpdateMoment,
} from "@/lib/journiv/local-store";
import { getJournivMode } from "@/lib/journiv/mode";
import {
  deleteMoment,
  getMoment,
  getValidAccessToken,
  updateMoment,
} from "@/lib/journiv/server";
import { journivErrorResponse } from "@/lib/journiv/route-utils";
import { plainTextToDelta } from "@/lib/journiv/quill";
import type { UpdateMomentPayload } from "@/lib/journiv/types";

const UNAUTH = { error: "\u672A\u767B\u5F55" };

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = await getJournivMode();

    if (mode === "local") {
      const user = await getLocalUser();
      if (!user) return NextResponse.json(UNAUTH, { status: 401 });
      const moment = await localGetMoment(id);
      if (!moment) return NextResponse.json({ error: "\u672A\u627E\u5230" }, { status: 404 });
      return NextResponse.json(moment);
    }

    const token = await getValidAccessToken();
    if (!token) return NextResponse.json(UNAUTH, { status: 401 });
    const moment = await getMoment(token, id);
    return NextResponse.json(moment);
  } catch (error) {
    return journivErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateMomentPayload & {
      content?: string;
      place?: string;
      title?: string;
      primary_mood_id?: string;
    };

    const mode = await getJournivMode();
    if (mode === "local") {
      const user = await getLocalUser();
      if (!user) return NextResponse.json(UNAUTH, { status: 401 });
      const moment = await localUpdateMoment(id, {
        place: body.place ?? body.title,
        content: body.content,
        moodId: body.primary_mood_id,
      });
      if (!moment) return NextResponse.json({ error: "\u672A\u627E\u5230" }, { status: 404 });
      return NextResponse.json(moment);
    }

    const token = await getValidAccessToken();
    if (!token) return NextResponse.json(UNAUTH, { status: 401 });

    const payload: UpdateMomentPayload = {
      note: body.note,
      primary_mood_id: body.primary_mood_id,
      location_json: body.place ? { name: body.place } : body.location_json,
    };

    if (body.content || body.title) {
      payload.entry_update = { title: body.title };
      if (body.content) {
        payload.entry_update.content_delta = plainTextToDelta(body.content);
      }
    }

    const moment = await updateMoment(token, id, payload);
    return NextResponse.json(moment);
  } catch (error) {
    return journivErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = await getJournivMode();

    if (mode === "local") {
      const user = await getLocalUser();
      if (!user) return NextResponse.json(UNAUTH, { status: 401 });
      await localDeleteMoment(id);
      return new NextResponse(null, { status: 204 });
    }

    const token = await getValidAccessToken();
    if (!token) return NextResponse.json(UNAUTH, { status: 401 });
    await deleteMoment(token, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return journivErrorResponse(error);
  }
}
