import { NextResponse } from "next/server";
import { getJournivMode } from "@/lib/journiv/mode";

export async function GET() {
  const mode = await getJournivMode(true);
  if (mode === "remote") {
    return NextResponse.json({ ok: true, mode: "remote" });
  }
  return NextResponse.json({
    ok: true,
    mode: "local",
    message:
      "Journiv Demo \u4E0D\u53EF\u8FBE\uFF0C\u5DF2\u81EA\u52A8\u5207\u6362\u4E3A\u672C\u5730\u65E5\u8BB0\u6A21\u5F0F",
  });
}
