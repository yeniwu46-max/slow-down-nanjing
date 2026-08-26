import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherFromOpenMeteo } from "@/lib/weather/open-meteo";
import { NANJING_COORDS } from "@/lib/weather/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  const lat = latParam ? parseFloat(latParam) : NANJING_COORDS.lat;
  const lng = lngParam ? parseFloat(lngParam) : NANJING_COORDS.lng;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "无效的坐标参数" }, { status: 400 });
  }

  try {
    const weather = await fetchWeatherFromOpenMeteo(lat, lng);
    return NextResponse.json(weather);
  } catch (err) {
    const message = err instanceof Error ? err.message : "天气获取失败";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
