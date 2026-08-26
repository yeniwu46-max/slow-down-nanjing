import { NextResponse } from "next/server";
import {
  ensureCityDiaryJournal,
  getValidAccessToken,
  listJournals,
} from "@/lib/journiv/server";
import { journivErrorResponse } from "@/lib/journiv/route-utils";

export async function GET() {
  try {
    const token = await getValidAccessToken();
    if (!token) return NextResponse.json({ error: "\u672A\u767B\u5F55" }, { status: 401 });

    const journals = await listJournals(token);
    const cityJournalId = await ensureCityDiaryJournal(token);
    return NextResponse.json({ journals, cityJournalId });
  } catch (error) {
    return journivErrorResponse(error);
  }
}
