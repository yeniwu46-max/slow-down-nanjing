"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  Loader2,
  MapPin,
  MoreHorizontal,
  PenLine,
  RefreshCw,
  Sparkles,
  Trash2,
  Pencil,
} from "lucide-react";
import { DiaryEditorDialog } from "@/components/diary/diary-editor-dialog";
import { formatMomentDate, useJournivDiary } from "@/hooks/use-journiv-diary";
import {
  buildSlowSummary,
  deltaToPlainText,
  plainTextToLines,
} from "@/lib/journiv/quill";
import type { JournivMoment } from "@/lib/journiv/types";
import { cn } from "@/lib/utils";
import { useDiaryGestureNav } from "@/hooks/use-page-gesture-handlers";

function getMoodLabel(moment: JournivMoment): { emoji: string; name?: string } {
  const mood = moment.mood_activity?.find((m) => m.mood)?.mood;
  if (mood?.icon) return { emoji: mood.icon, name: mood.name };
  if (mood?.name) return { emoji: "🌿", name: mood.name };
  return { emoji: "🌿" };
}

function getPlace(moment: JournivMoment): string {
  return moment.location_json?.name ?? moment.entry?.title ?? "南京";
}

function getPlainText(moment: JournivMoment): string {
  return (
    moment.entry?.content_plain_text ??
    deltaToPlainText(moment.entry?.content_delta) ??
    moment.note ??
    ""
  );
}

export function DiaryView() {
  const diary = useJournivDiary();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<JournivMoment | undefined>();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  async function handleSave(payload: {
    place: string;
    content: string;
    moodId?: string;
    date?: string;
    photo?: File;
  }) {
    if (editing) {
      await diary.updateEntry(editing.id, payload);
    } else {
      await diary.createEntry(payload);
    }
  }

  function openCreate() {
    setEditing(undefined);
    setEditorOpen(true);
  }

  function openEdit(moment: JournivMoment) {
    setEditing(moment);
    setEditorOpen(true);
    setMenuOpen(null);
  }

  useDiaryGestureNav(
    () => diary.prevMonth(),
    () => diary.nextMonth(),
  );

  return (
    <section className="paper-texture relative min-h-[calc(100vh-4rem)] w-full">
      <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-8 md:px-12 lg:pl-20">
        {/* 标题区 */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="animate-fade-up">
            <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold text-ink md:text-4xl">
              我的城市日记
              <Leaf className="h-6 w-6 text-primary/70" strokeWidth={1.5} />
              <span className="text-base text-primary">City Diary</span>
            </h1>
            <p className="mt-2 text-sm text-rock">
              记录每一次慢行，收藏城市的温柔。
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                {diary.mode === "local" ? "本地日记模式" : "Journiv 云端"}
              </span>
            </p>
            {diary.user && (
              <p className="mt-1 text-xs text-rock">
                {diary.mode === "local" ? "本地已登录" : "已同步"} · {diary.user.email}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void diary.refresh()}
              className="flex h-10 w-10 items-center justify-center rounded-full glass-strong text-rock shadow-s transition hover:text-ink"
              aria-label="刷新"
            >
              <RefreshCw className={cn("h-4 w-4", diary.loading && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={openCreate}
              disabled={!diary.authenticated}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-m transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <PenLine className="h-4 w-4" />
              写一篇
            </button>
          </div>
        </div>

        {/* 状态横幅 */}
        {diary.mode === "local" && diary.modeMessage && (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink">
            <p className="font-medium">{diary.modeMessage}</p>
            <p className="mt-1 text-xs text-rock">
              日记保存在本地服务器内存中，重启 dev 后会重置。登录任意账号即可使用。
            </p>
          </div>
        )}

        {!diary.loading && diary.authenticated === false && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl glass-strong px-4 py-3 shadow-s">
            <p className="text-sm text-rock">登录后即可将城市日记同步至 Journiv 私有日记库</p>
            <Link
              href="/login?redirect=/diary"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              登录 / 注册
            </Link>
          </div>
        )}

        {diary.error && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{diary.error}</div>
        )}

        {/* 日记本 */}
        <div className="relative mt-8 rounded-3xl bg-[#f6f3ec] p-5 shadow-l md:p-8 md:pl-14">
          <div className="absolute left-3 top-10 hidden flex-col gap-10 md:flex">
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className="h-6 w-6 rounded-full border-[3px] border-[#b9b4a8] bg-gradient-to-b from-white to-[#d9d4c8] shadow-inner"
              />
            ))}
          </div>

          {diary.loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-rock">
              <Loader2 className="h-5 w-5 animate-spin" />
              从 Journiv 加载中…
            </div>
          ) : diary.moments.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-ink">本月还没有日记</p>
              <p className="mt-2 text-sm text-rock">写下一篇，记录与南京的温柔相遇</p>
              {diary.authenticated && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 rounded-full bg-primary px-5 py-2 text-sm text-white hover:bg-primary-hover"
                >
                  写第一篇
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-cloud/70">
              {diary.moments.map((moment) => {
                const { day, weekday } = formatMomentDate(moment.logged_date_tz);
                const place = getPlace(moment);
                const plainText = getPlainText(moment);
                const lines = plainTextToLines(plainText);
                const mood = getMoodLabel(moment);
                const summary = buildSlowSummary(place, plainText, mood.name);
                const thumb = moment.media?.[0];

                return (
                  <article
                    key={moment.id}
                    className="grid animate-fade-up gap-5 py-7 md:grid-cols-[64px_1fr] lg:grid-cols-[64px_1.1fr_auto_0.9fr]"
                  >
                    <div className="relative flex flex-row items-center gap-2 md:flex-col md:items-start">
                      <p className="font-serif text-2xl font-semibold text-primary">{day}</p>
                      <p className="text-xs text-rock">{weekday}</p>
                      <span className="absolute -right-2 top-2 hidden h-2.5 w-2.5 rounded-full bg-primary md:block" />
                    </div>

                    <div className="md:border-l md:border-cloud/60 md:pl-6">
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex items-center gap-2 font-serif text-lg text-ink">
                          <MapPin className="h-4 w-4 text-primary" strokeWidth={1.6} />
                          {place}
                          <span className="text-lg">{mood.emoji}</span>
                        </p>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpen(menuOpen === moment.id ? null : moment.id)
                            }
                            className="rounded-full p-1 text-rock hover:bg-white/60 hover:text-ink"
                            aria-label="更多操作"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuOpen === moment.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 min-w-[7rem] rounded-xl bg-white py-1 shadow-l">
                              <button
                                type="button"
                                onClick={() => openEdit(moment)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ink hover:bg-cloud/30"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                编辑
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("确定删除这篇日记？")) {
                                    void diary.deleteEntry(moment.id);
                                  }
                                  setMenuOpen(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                删除
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 font-serif text-sm leading-relaxed text-charcoal/85">
                        {lines.length > 0 ? (
                          lines.map((line, lineIdx) => (
                            <p key={`${moment.id}-${lineIdx}`}>{line}</p>
                          ))
                        ) : (
                          <p className="text-rock">（无正文）</p>
                        )}
                      </div>
                    </div>

                    <div className="relative mx-auto w-full max-w-[260px] lg:w-60">
                      <span className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 rotate-1 rounded-sm bg-primary/15" />
                      <div className="rotate-[-1deg] rounded-sm bg-white p-2 shadow-m">
                        {thumb?.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb.thumbnail_url}
                            alt=""
                            className="aspect-[4/3] w-full rounded-sm object-cover"
                          />
                        ) : (
                          <div className="ink-wash aspect-[4/3] w-full rounded-sm" />
                        )}
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-[#eef2ec] p-4 shadow-s">
                      <div
                        className="pointer-events-none absolute -bottom-2 right-0 h-16 w-28 opacity-50"
                        style={{
                          backgroundImage:
                            "radial-gradient(60% 100% at 80% 100%, rgba(127,167,155,0.4) 0%, transparent 70%)",
                        }}
                      />
                      <div className="relative flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                          慢行解读
                          <Sparkles className="h-3.5 w-3.5 text-warm-gold" />
                        </p>
                      </div>
                      <p className="relative mt-3 text-xs leading-relaxed text-rock">{summary}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* 月份翻页 */}
        <div className="mt-8 flex items-center justify-center gap-4 text-rock">
          <Leaf className="h-4 w-4 text-primary/50" strokeWidth={1.5} />
          <button
            type="button"
            onClick={diary.prevMonth}
            className="transition-colors hover:text-ink"
            aria-label="上个月"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-serif text-sm text-ink">{diary.monthLabel}</span>
          <button
            type="button"
            onClick={diary.nextMonth}
            className="transition-colors hover:text-ink"
            aria-label="下个月"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <Leaf className="h-4 w-4 -scale-x-100 text-primary/50" strokeWidth={1.5} />
        </div>
      </div>

      <DiaryEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        moods={diary.moods}
        initial={editing}
        onSave={handleSave}
      />
    </section>
  );
}
