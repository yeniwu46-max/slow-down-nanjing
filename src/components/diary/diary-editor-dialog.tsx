"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { JournivMood, JournivMoment } from "@/lib/journiv/types";
import { cn } from "@/lib/utils";

const T = {
  editTitle: "\u7F16\u8F91\u65E5\u8BB0",
  newTitle: "\u5199\u4E00\u7BC7\u57CE\u5E02\u65E5\u8BB0",
  close: "\u5173\u95ED",
  date: "\u65E5\u671F",
  place: "\u5730\u70B9",
  mood: "\u5FC3\u60C5",
  body: "\u6B63\u6587",
  photo: "\u7167\u7247\uFF08\u53EF\u9009\uFF09",
  placePh: "\u7384\u6B66\u6E56\u3001\u9889\u548C\u8DEF\u2026",
  bodyPh: "\u6CBF\u7740\u6E56\u8FB9\u6162\u6162\u5730\u8D70\uFF0C\u5FAE\u98CE\u62A1\u8FC7\u6C34\u9762\u2026",
  cancel: "\u53D6\u6D88",
  save: "\u4FDD\u5B58\u5230 Journiv",
  errRequired: "\u8BF7\u586B\u5199\u5730\u70B9\u548C\u6B63\u6587",
  errSave: "\u4FDD\u5B58\u5931\u8D25",
} as const;

interface DiaryEditorDialogProps {
  open: boolean;
  onClose: () => void;
  moods: JournivMood[];
  initial?: JournivMoment;
  onSave: (payload: {
    place: string;
    content: string;
    moodId?: string;
    date?: string;
    photo?: File;
  }) => Promise<void>;
}

export function DiaryEditorDialog({
  open,
  onClose,
  moods,
  initial,
  onSave,
}: DiaryEditorDialogProps) {
  const [place, setPlace] = useState("");
  const [content, setContent] = useState("");
  const [moodId, setMoodId] = useState<string | undefined>();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [photo, setPhoto] = useState<File | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setPlace(initial.location_json?.name ?? initial.entry?.title ?? "");
      setContent(initial.entry?.content_plain_text ?? "");
      setMoodId(initial.primary_mood_id);
      setDate(initial.logged_date_tz);
      setPhoto(undefined);
    } else {
      setPlace("");
      setContent("");
      setMoodId(moods[0]?.id);
      setDate(new Date().toISOString().slice(0, 10));
      setPhoto(undefined);
    }
    setError(null);
  }, [open, initial, moods]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!place.trim() || !content.trim()) {
      setError(T.errRequired);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ place: place.trim(), content: content.trim(), moodId, date, photo });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : T.errSave);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="diary-editor-title"
        className="w-full max-w-lg animate-fade-up rounded-3xl bg-[#f6f3ec] p-6 shadow-l"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="diary-editor-title" className="font-serif text-xl font-semibold text-ink">
            {initial ? T.editTitle : T.newTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-rock transition hover:bg-white/60 hover:text-ink"
            aria-label={T.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-rock">{T.date}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-cloud/80 bg-white/70 px-3 py-2 text-sm text-ink outline-none focus:border-primary/50"
              />
            </label>
            <label className="block">
              <span className="text-xs text-rock">{T.place}</span>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder={T.placePh}
                className="mt-1 w-full rounded-xl border border-cloud/80 bg-white/70 px-3 py-2 text-sm text-ink outline-none focus:border-primary/50"
              />
            </label>
          </div>

          {moods.length > 0 && (
            <div>
              <span className="text-xs text-rock">{T.mood}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {moods.slice(0, 8).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMoodId(m.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs transition",
                      moodId === m.id
                        ? "bg-primary text-white"
                        : "bg-white/70 text-rock hover:text-ink",
                    )}
                  >
                    {m.icon ? `${m.icon} ` : ""}
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-xs text-rock">{T.body}</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder={T.bodyPh}
              className="mt-1 w-full resize-none rounded-xl border border-cloud/80 bg-white/70 px-3 py-2 font-serif text-sm leading-relaxed text-ink outline-none focus:border-primary/50"
            />
          </label>

          {!initial && (
            <label className="block">
              <span className="text-xs text-rock">{T.photo}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0])}
                className="mt-1 block w-full text-xs text-rock file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-primary"
              />
            </label>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm text-rock hover:text-ink"
            >
              {T.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-s hover:bg-primary-hover disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {T.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
