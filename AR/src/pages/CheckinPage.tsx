import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getSpotOrDefault } from "@/config/spots";
import { buildWebReturnUrl, parseReturnPath } from "@/bridge/return-url";
import { animateCheckinDone } from "@/animations/letter-timeline";

export function CheckinPage() {
  const { spotId = "xuanwu-lake" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const spot = getSpotOrDefault(spotId);
  const cert = searchParams.get("cert") ?? "";
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animateCheckinDone({ checkinBadge: badgeRef.current });
  }, []);

  const returnPath = parseReturnPath(searchParams.toString());
  const webBadgesUrl = buildWebReturnUrl(returnPath, {
    earned: spot.badgeId,
    cert,
  });

  return (
    <div className="ar-page flex flex-col items-center justify-center gap-6 p-6">
      <div
        ref={badgeRef}
        className="glass-strong flex h-40 w-40 flex-col items-center justify-center rounded-full shadow-l"
      >
        <span className="text-3xl">🍃</span>
        <p className="mt-2 font-serif text-sm font-semibold text-[var(--color-ink-cyan)]">
          {spot.letterTitle}
        </p>
      </div>

      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl font-semibold text-[var(--color-ink-cyan)]">
          打卡完成
        </h1>
        <p className="mt-2 text-sm text-[var(--color-rock-grey)]">
          你已在 {spot.name} 领取「{spot.letterTitle}」数字徽章。
        </p>
        {cert && (
          <p className="mt-3 break-all text-[10px] text-[var(--color-rock-grey)]">
            凭证 #{cert.slice(0, 16)}…
          </p>
        )}
      </div>

      <div className="flex w-full max-w-md flex-col gap-3">
        <a
          href={webBadgesUrl}
          className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-center text-sm font-medium text-white"
        >
          返回主站徽章馆
        </a>
        <button
          type="button"
          className="rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm text-[var(--color-primary)]"
          onClick={() =>
            navigate(`/share/${spot.id}?return=${encodeURIComponent(returnPath)}&cert=${cert}`)
          }
        >
          生成旅行分享
        </button>
        <Link to={`/scan?spot=${spot.id}`} className="text-center text-xs text-[var(--color-rock-grey)]">
          重新体验
        </Link>
      </div>
    </div>
  );
}
