import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getSpotOrDefault } from "@/config/spots";
import { buildWebReturnUrl } from "@/bridge/return-url";
import { animateShareCard } from "@/animations/letter-timeline";

export function SharePage() {
  const { spotId = "xuanwu-lake" } = useParams();
  const [searchParams] = useSearchParams();
  const spot = getSpotOrDefault(spotId);
  const cardRef = useRef<HTMLDivElement>(null);
  const cert = searchParams.get("cert") ?? "";

  useEffect(() => {
    animateShareCard({ shareCard: cardRef.current });
  }, []);

  const webShareUrl = buildWebReturnUrl("/records", {
    arSpot: spot.id,
    cert,
  });

  return (
    <div className="ar-page flex flex-col items-center justify-center gap-6 p-6">
      <div
        ref={cardRef}
        className="glass-strong w-full max-w-sm overflow-hidden rounded-3xl shadow-l"
      >
        <div className="h-36 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-mist-blue)]" />
        <div className="space-y-2 p-6">
          <p className="text-xs tracking-[0.15em] text-[var(--color-rock-grey)] uppercase">
            Slow down · Nanjing
          </p>
          <h1 className="font-serif text-xl font-semibold text-[var(--color-ink-cyan)]">
            {spot.name}
          </h1>
          <p className="text-sm text-[var(--color-rock-grey)]">{spot.letterBody}</p>
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          className="rounded-xl bg-[var(--color-warm-gold)] px-4 py-3 text-sm font-medium text-white"
          onClick={() => {
            void navigator.clipboard.writeText(
              `我在${spot.name}完成了「${spot.letterTitle}」AR 慢行打卡 — 宁可慢一点`,
            );
          }}
        >
          复制分享文案
        </button>
        <a
          href={webShareUrl}
          className="rounded-xl border border-[var(--color-primary)] px-4 py-3 text-center text-sm text-[var(--color-primary)]"
        >
          写入主站旅行日记
        </a>
      </div>
    </div>
  );
}
