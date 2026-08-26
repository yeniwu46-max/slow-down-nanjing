import { NextResponse } from "next/server";
import { getValidAccessToken, signMedia, uploadMedia } from "@/lib/journiv/server";
import { journivErrorResponse } from "@/lib/journiv/route-utils";

export async function POST(request: Request) {
  try {
    const token = await getValidAccessToken();
    if (!token) return NextResponse.json({ error: "\u672A\u767B\u5F55" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    const momentId = form.get("moment_id");

    if (!(file instanceof Blob) || typeof momentId !== "string") {
      return NextResponse.json(
        { error: "\u7F3A\u5C11 file \u6216 moment_id" },
        { status: 400 },
      );
    }

    const filename = file instanceof File ? file.name : "photo.jpg";
    const uploaded = await uploadMedia(token, momentId, file, filename);

    try {
      const signed = await signMedia(token, uploaded.id);
      return NextResponse.json({ ...uploaded, signed_url: signed.signed_url });
    } catch {
      return NextResponse.json(uploaded, { status: 201 });
    }
  } catch (error) {
    return journivErrorResponse(error);
  }
}
