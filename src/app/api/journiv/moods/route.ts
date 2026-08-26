import { NextResponse } from "next/server";
import { getLocalUser, localListMoods } from "@/lib/journiv/local-store";
import { getJournivMode } from "@/lib/journiv/mode";
import { getValidAccessToken, listMoods } from "@/lib/journiv/server";
import { journivErrorResponse } from "@/lib/journiv/route-utils";

export async function GET() {
  try {
    const mode = await getJournivMode();
    if (mode === "local") {
      const user = await getLocalUser();
      if (!user) return NextResponse.json({ error: "\u672A\u767B\u5F55" }, { status: 401 });
      return NextResponse.json(await localListMoods());
    }

    const token = await getValidAccessToken();
    if (!token) return NextResponse.json({ error: "\u672A\u767B\u5F55" }, { status: 401 });
    const moods = await listMoods(token);
    return NextResponse.json(moods);
  } catch (error) {
    return journivErrorResponse(error);
  }
}
