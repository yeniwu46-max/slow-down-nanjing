import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSpotOrDefault } from "@/config/spots";
import { parseReturnPath, parseSpotId, parseWebBase } from "@/bridge/return-url";
import { setWebBaseUrl } from "@/bridge/storage";
import { useMindAR } from "@/mindar/use-mindar";
import { animateScanFrame } from "@/animations/letter-timeline";

export function ScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const spotId = parseSpotId(searchParams.toString());
  const spot = getSpotOrDefault(spotId);
  const scanFrameRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState("请将相机对准景点立牌");

  useEffect(() => {
    setWebBaseUrl(parseWebBase(searchParams.toString()));
  }, [searchParams]);

  const handleFound = () => {
    const ret = parseReturnPath(searchParams.toString());
    navigate(`/experience/${spot.id}?return=${encodeURIComponent(ret)}`, { replace: true });
  };

  const { containerRef, tracking, ready, error } = useMindAR({
    targetSrc: spot.mindTarget,
    active: true,
    onTargetFound: handleFound,
  });

  useEffect(() => {
    const tween = animateScanFrame(scanFrameRef.current);
    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    if (tracking) setHint("识别成功，正在进入体验…");
    else if (ready) setHint("扫描中，请保持稳定");
    else if (error) setHint(error);
  }, [tracking, ready, error]);

  return (
    <div className="ar-page">
      <div ref={containerRef} className="mindar-container" />

      <div className="ar-overlay flex flex-col items-center justify-between p-6">
        <header className="glass-strong w-full max-w-md rounded-2xl p-4 text-center shadow-m">
          <p className="text-xs tracking-[0.2em] text-[var(--color-rock-grey)] uppercase">
            Slow down · AR
          </p>
          <h1 className="mt-2 font-serif text-xl font-semibold text-[var(--color-ink-cyan)]">
            {spot.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-rock-grey)]">{hint}</p>
        </header>

        <div
          ref={scanFrameRef}
          className="breath-ring h-52 w-52 rounded-3xl border-2 border-dashed border-[var(--color-primary)]"
          aria-hidden
        />

        <footer className="glass-strong w-full max-w-md space-y-3 rounded-2xl p-4 shadow-m">
          <p className="text-center text-xs leading-relaxed text-[var(--color-rock-grey)]">
            开发联调可使用 <code className="text-[var(--color-ink-cyan)]">dev-card-reference.png</code>{" "}
            图案，或点击下方演示模式。
          </p>
          <button
            type="button"
            className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white"
            onClick={() => {
              const ret = parseReturnPath(searchParams.toString());
              navigate(`/experience/${spot.id}?return=${encodeURIComponent(ret)}&demo=1`, {
                replace: true,
              });
            }}
          >
            演示模式（跳过扫描）
          </button>
        </footer>
      </div>
    </div>
  );
}
