"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Leaf,
  Map as MapIcon,
  MapPin,
  PersonStanding,
  Quote,
  Route,
  Smile,
  X,
} from "lucide-react";
import { MapMini } from "@/components/map/map-mini";
import {
  JUNE_RECORDS,
  ROUTE_ALBUM,
  heatForDay,
  recordForDay,
} from "@/lib/records/mock-data";
import { cn } from "@/lib/utils";
import type { GestureId } from "@/lib/gesture/types";
import { useGestureStore } from "@/stores/use-gesture-store";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const HEAT_COLORS = ["#e7e9e3", "#cdd8c8", "#a9bfa0", "#84a079", "#5f7d5a"];

const REVIEW = [
  { icon: Route, label: "最长慢行", value: "3.8 km" },
  { icon: Clock, label: "最多慢行时长", value: "92 min" },
  { icon: Smile, label: "情绪最放松的一天", value: "6月14日" },
];

function DailyWalkCard({ day, monthLabel }: { day: number; monthLabel: string }) {
  const record = recordForDay(day);

  if (!record) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl bg-white/40 p-8 text-center">
        <Leaf className="h-10 w-10 text-primary/30" />
        <p className="mt-4 font-serif text-base text-ink">
          {monthLabel}
          {day}日
        </p>
        <p className="mt-2 text-sm text-rock">这一天还没有慢行记录</p>
        <p className="mt-1 text-xs text-rock">出门走走，点亮这一天吧</p>
      </div>
    );
  }

  return (
    <article className="animate-fade-up space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-rock">当天慢行卡</p>
          <h2 className="font-serif text-xl font-semibold text-ink">
            {monthLabel}
            {record.day}日 · {record.routeName}
          </h2>
        </div>
        <span className="rounded-full bg-primary/12 px-3 py-1 text-xs text-primary">
          {record.mood.icon} {record.mood.name}
        </span>
      </div>

      <div className="relative h-36 overflow-hidden rounded-2xl shadow-s">
        <MapMini className="h-full w-full" showRoute zoom={12} pitch={42} />
        <div className="absolute bottom-2 left-3 rounded-full bg-white/80 px-2.5 py-1 text-[10px] text-ink backdrop-blur-sm">
          路线缩略图
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/50 p-3 text-center">
          <PersonStanding className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 font-serif text-lg font-semibold text-ink">{record.steps.toLocaleString()}</p>
          <p className="text-[10px] text-rock">步数</p>
        </div>
        <div className="rounded-xl bg-white/50 p-3 text-center">
          <Route className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 font-serif text-lg font-semibold text-ink">{record.km} km</p>
          <p className="text-[10px] text-rock">里程</p>
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          停留地点
        </p>
        <div className="flex flex-wrap gap-2">
          {record.stayLocations.map((loc) => (
            <span
              key={loc}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs text-ink"
            >
              {loc}
            </span>
          ))}
        </div>
      </div>

      {record.photos.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-ink">照片</p>
          <div className="flex gap-2">
            {record.photos.map((src, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg">
                <Image src={src} alt="" fill className="object-cover" sizes="64px" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white/50 p-4">
        <Quote className="h-4 w-4 text-primary/50" />
        <p className="mt-2 font-serif text-sm leading-relaxed text-ink">{record.diary}</p>
      </div>
    </article>
  );
}

function RouteAlbumModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#f6f3ec] p-6 shadow-l"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-ink">累计路线相册</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-rock hover:bg-white/60"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="space-y-3">
          {ROUTE_ALBUM.map((route) => (
            <li
              key={route.id}
              className="flex items-center gap-4 rounded-2xl bg-white/60 p-4"
            >
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl">
                <MapMini className="h-full w-full" showRoute zoom={11.5} pitch={30} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{route.name}</p>
                <p className="text-xs text-rock">
                  {route.km} km · 走过 {route.days} 次
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function RecordsView() {
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const monthLabel = `${monthIndex + 1}月`;
  const monthTitle = `${["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"][monthIndex]}月 ${year}`;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const todayDay = today.getDate();

  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    if (recordForDay(todayDay)) return todayDay;
    return JUNE_RECORDS[JUNE_RECORDS.length - 1]?.day ?? todayDay;
  });
  const [showAlbum, setShowAlbum] = useState(false);
  const enabled = useGestureStore((s) => s.enabled);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: GestureId }>).detail.id;
      if (id === "light_route" || id === "open_story") {
        setSelectedDay((d) => {
          const next = (d ?? todayDay) + 1;
          return next <= daysInMonth ? next : 1;
        });
      }
      if (id === "collect_today" || id === "collect_badge") {
        setShowAlbum(true);
      }
    };

    window.addEventListener("slowdown:gesture", handler);
    return () => window.removeEventListener("slowdown:gesture", handler);
  }, [enabled, todayDay, daysInMonth]);

  return (
    <section className="paper-texture relative min-h-[calc(100vh-4rem)] w-full">
      <RouteAlbumModal open={showAlbum} onClose={() => setShowAlbum(false)} />

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-8 md:px-12 lg:pl-20">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="animate-fade-up">
            <h1 className="flex items-center gap-2 font-serif text-3xl font-semibold text-ink md:text-4xl">
              我的慢行记录
              <Leaf className="h-6 w-6 text-primary/70" strokeWidth={1.5} />
            </h1>
            <div className="mt-2 flex gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
            <p className="mt-2 text-sm text-rock">每一步，都是与这座城市的温柔相遇。</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="glass-strong rounded-3xl p-6 shadow-m">
            <div className="mb-5 flex items-center justify-center gap-6">
              <button type="button" className="text-rock hover:text-ink" aria-label="上个月">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-serif text-base font-medium text-ink">{monthTitle}</span>
              <button type="button" className="text-rock hover:text-ink" aria-label="下个月">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((d) => (
                <span key={d} className="text-center text-xs text-rock">
                  {d}
                </span>
              ))}
              {Array.from({ length: startOffset }).map((_, i) => (
                <span key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const level = heatForDay(day);
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "aspect-square rounded-md transition-transform hover:scale-110",
                      isSelected && "ring-2 ring-primary ring-offset-1",
                    )}
                    style={{ backgroundColor: HEAT_COLORS[level] }}
                    title={`${monthLabel}${day}日`}
                  >
                    <span className="text-[10px] font-medium text-ink/70">{day}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-rock">
              <span className="flex items-center gap-1.5">
                少
                {HEAT_COLORS.map((c) => (
                  <span key={c} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: c }} />
                ))}
                多
              </span>
              <span>点击日期查看当天慢行卡</span>
            </div>

            <div className="mt-6">
              <p className="mb-3 font-serif text-sm font-medium text-ink">本月慢行轨迹</p>
              <div className="relative h-44 overflow-hidden rounded-2xl shadow-s">
                <MapMini className="h-full w-full" showRoute zoom={11.2} pitch={45} />
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1 text-[10px] text-ink backdrop-blur-sm">
                  {JUNE_RECORDS.length} 天慢行 · 共{" "}
                  {JUNE_RECORDS.reduce((s, r) => s + r.km, 0).toFixed(1)} km
                </div>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 shadow-m">
            {selectedDay ? (
              <DailyWalkCard day={selectedDay} monthLabel={monthLabel} />
            ) : (
              <>
                <p className="font-serif text-base font-medium text-ink">本月回顾</p>
                <ul className="mt-4 divide-y divide-cloud/60">
                  {REVIEW.map((r) => {
                    const Icon = r.icon;
                    return (
                      <li key={r.label} className="flex items-center justify-between py-3">
                        <span className="flex items-center gap-2 text-sm text-rock">
                          <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                          {r.label}
                        </span>
                        <span className="text-sm font-medium text-ink">{r.value}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 rounded-2xl bg-white/50 p-4">
                  <Quote className="h-4 w-4 text-primary/50" />
                  <p className="mt-2 font-serif text-sm leading-relaxed text-ink">
                    慢下来，才能真正看见
                    <br />
                    生活的温度。
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: PersonStanding, label: "累计慢行", value: "27", unit: "km" },
            { icon: Heart, label: "累计情绪恢复", value: "18", unit: "次" },
            { icon: MapIcon, label: "累计路线", value: "12", unit: "条", clickable: true },
          ].map((t) => {
            const Icon = t.icon;
            const inner = (
              <>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-xs text-rock">{t.label}</p>
                  <p className="font-serif text-2xl font-semibold text-ink">
                    {t.value}
                    <span className="ml-1 text-sm font-normal text-rock">{t.unit}</span>
                  </p>
                </div>
              </>
            );

            if ("clickable" in t && t.clickable) {
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setShowAlbum(true)}
                  className="glass-strong flex items-center gap-4 rounded-3xl p-5 text-left shadow-s transition hover:shadow-m hover:ring-2 hover:ring-primary/20"
                >
                  {inner}
                </button>
              );
            }

            return (
              <div
                key={t.label}
                className="glass-strong flex items-center gap-4 rounded-3xl p-5 shadow-s"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
