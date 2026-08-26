"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PoiPhotoCarousel({
  name,
  photos,
}: {
  name: string;
  photos: string[];
}) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const total = photos.length;
  const current = photos[index] ?? "/images/mist-bg.jpg";
  const src = failed[index] ? "/images/mist-bg.jpg" : current;

  if (total === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="relative aspect-[16/10] bg-cloud/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${name} 实景 ${index + 1}`}
          className="h-full w-full object-cover"
          onError={() => setFailed((f) => ({ ...f, [index]: true }))}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/45 to-transparent px-3 py-2">
          <p className="text-[10px] text-white/90">
            实景 {index + 1} / {total} · 公开图源
          </p>
        </div>
      </div>
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + total) % total)}
            className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink shadow-s"
            aria-label="上一张"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % total)}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink shadow-s"
            aria-label="下一张"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/50",
                )}
                aria-label={`第 ${i + 1} 张`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
