import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getSpotOrDefault } from "@/config/spots";
import { parseReturnPath } from "@/bridge/return-url";
import { saveCheckin } from "@/bridge/storage";
import { useMindAR } from "@/mindar/use-mindar";
import { useXuanwuLakeScene, type XuanwuSceneEffects } from "@/scenes/xuanwu-lake/XuanwuLakeScene";
import { useArGestures } from "@/gestures/use-ar-gestures";
import { AR_GESTURE_HINTS, type ArGestureId } from "@/gestures/types";
import { useGestureKeyboardFallback } from "@/gestures/keyboard-fallback";
import {
  animateLetterOpen,
  animateSpotReveal,
} from "@/animations/letter-timeline";

type Phase = "scene" | "gesture" | "letter";

export function ExperiencePage() {
  const { spotId = "xuanwu-lake" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const spot = getSpotOrDefault(spotId);
  const isDemo = searchParams.get("demo") === "1";

  const [phase, setPhase] = useState<Phase>("scene");
  const [effects, setEffects] = useState<XuanwuSceneEffects>({
    wind: false,
    meditation: false,
    egrets: false,
  });
  const [gestureCount, setGestureCount] = useState(0);
  const [meditation, setMeditation] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const letterEnvelopeRef = useRef<HTMLDivElement>(null);
  const letterPaperRef = useRef<HTMLDivElement>(null);
  const letterTextRef = useRef<HTMLParagraphElement>(null);

  const mindarActive = phase === "scene" && !isDemo;

  const { containerRef, anchorGroup, tracking, ready, stop } = useMindAR({
    targetSrc: spot.mindTarget,
    active: mindarActive,
    onTargetFound: () => {
      if (titleRef.current) animateSpotReveal({ spotTitle: titleRef.current });
    },
  });

  useXuanwuLakeScene(anchorGroup, effects, isDemo || tracking || ready);

  useEffect(() => {
    if (isDemo && titleRef.current) {
      animateSpotReveal({ spotTitle: titleRef.current });
    }
  }, [isDemo]);

  const advanceToLetter = useCallback(() => {
    setPhase("letter");
    void stop();
    requestAnimationFrame(() => {
      animateLetterOpen({
        letterEnvelope: letterEnvelopeRef.current,
        letterPaper: letterPaperRef.current,
        letterText: letterTextRef.current,
      });
    });
  }, [stop]);

  const handleGesture = useCallback(
    (id: ArGestureId) => {
      setGestureCount((c) => c + 1);
      if (id === "open_palm") setEffects((e) => ({ ...e, wind: true }));
      if (id === "prayer") {
        setEffects((e) => ({ ...e, meditation: true }));
        setMeditation(true);
      }
      if (id === "wave") setEffects((e) => ({ ...e, egrets: true }));
      if (id === "heart") advanceToLetter();
    },
    [advanceToLetter],
  );

  const { videoRef, ready: gestureReady } = useArGestures({
    active: phase === "gesture",
    allowedGestures: spot.gestures,
    onGesture: handleGesture,
  });

  useGestureKeyboardFallback(phase === "gesture", handleGesture);

  useEffect(() => {
    if (phase !== "gesture") return;
    if (gestureCount >= 2) {
      const timer = window.setTimeout(advanceToLetter, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [advanceToLetter, gestureCount, phase]);

  const startGestures = async () => {
    await stop();
    setPhase("gesture");
  };

  const completeCheckin = () => {
    const record = saveCheckin({
      spotId: spot.id,
      badgeId: spot.badgeId,
      letterTitle: spot.letterTitle,
    });
    const ret = parseReturnPath(searchParams.toString());
    navigate(
      `/checkin/${spot.id}?return=${encodeURIComponent(ret)}&cert=${record.certHash}`,
      { replace: true },
    );
  };

  return (
    <div className="ar-page">
      {phase === "scene" && (
        <div ref={containerRef} className="mindar-container" />
      )}

      {phase === "gesture" && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
      )}

      {phase === "letter" && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-[var(--color-mist-blue)] to-[var(--color-paper-white)]"
          aria-hidden
        />
      )}

      <div className="ar-overlay flex flex-col items-center justify-between p-6">
        {phase === "scene" && (
          <>
            <header className="glass-strong w-full max-w-md rounded-2xl p-4 text-center shadow-m">
              <p className="text-xs text-[var(--color-rock-grey)]">景点已识别</p>
              <h1
                ref={titleRef}
                className="mt-1 font-serif text-2xl font-semibold text-[var(--color-ink-cyan)]"
              >
                {spot.name}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-rock-grey)]">
                {isDemo || tracking ? "湖风信笺即将展开" : "请继续对准立牌以锁定画面"}
              </p>
            </header>

            <button
              type="button"
              disabled={!isDemo && !tracking}
              className="glass-strong rounded-full px-6 py-3 text-sm font-medium text-[var(--color-ink-cyan)] shadow-m disabled:opacity-50"
              onClick={() => void startGestures()}
            >
              开始手势互动
            </button>
          </>
        )}

        {phase === "gesture" && (
          <>
            <header className="glass-strong w-full max-w-md rounded-2xl p-4 shadow-m">
              <p className="text-center text-sm font-medium text-[var(--color-ink-cyan)]">
                用手势与湖风对话
              </p>
              <ul className="mt-3 space-y-2 text-xs text-[var(--color-rock-grey)]">
                {spot.gestures.map((g) => (
                  <li key={g} className="flex justify-between gap-4">
                    <span>{AR_GESTURE_HINTS[g].label}</span>
                    <span>{AR_GESTURE_HINTS[g].description}</span>
                  </li>
                ))}
              </ul>
              {!gestureReady && (
                <p className="mt-2 text-center text-xs text-[var(--color-rock-grey)]">
                  正在启动手势识别…
                </p>
              )}
            </header>

            {meditation && (
              <div className="breath-ring rounded-full border border-[var(--color-primary)] px-8 py-6 text-center glass-strong">
                <p className="font-serif text-lg text-[var(--color-ink-cyan)]">慢呼吸</p>
                <p className="mt-1 text-xs text-[var(--color-rock-grey)]">吸气…呼气…</p>
              </div>
            )}

            <button
              type="button"
              className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm text-white"
              onClick={advanceToLetter}
            >
              跳过，展开信笺
            </button>
          </>
        )}

        {phase === "letter" && (
          <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4">
            <div
              ref={letterEnvelopeRef}
              className="relative h-40 w-full max-w-sm rounded-2xl bg-[var(--color-warm-gold)] shadow-l"
              style={{ perspective: "800px" }}
            >
              <div className="absolute inset-x-6 top-4 text-center font-serif text-white">
                {spot.letterTitle}
              </div>
            </div>
            <div
              ref={letterPaperRef}
              className="glass-strong w-full max-w-sm rounded-2xl p-6 shadow-l"
            >
              <p
                ref={letterTextRef}
                className="font-serif text-sm leading-relaxed text-[var(--color-ink-cyan)]"
              >
                {spot.letterBody}
              </p>
            </div>
            <button
              type="button"
              className="mt-4 w-full max-w-sm rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white"
              onClick={completeCheckin}
            >
              完成打卡，领取数字徽章
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
