import gsap from "gsap";

export interface LetterTimelineRefs {
  scanFrame?: HTMLElement | null;
  spotTitle?: HTMLElement | null;
  letterEnvelope?: HTMLElement | null;
  letterPaper?: HTMLElement | null;
  letterText?: HTMLElement | null;
  checkinBadge?: HTMLElement | null;
  shareCard?: HTMLElement | null;
}

export function animateScanFrame(el: HTMLElement | null) {
  if (!el) return gsap.timeline();
  return gsap.fromTo(
    el,
    { scale: 0.92, opacity: 0.4 },
    { scale: 1, opacity: 1, duration: 1.8, repeat: -1, yoyo: true, ease: "sine.inOut" },
  );
}

export function animateSpotReveal(refs: LetterTimelineRefs) {
  const tl = gsap.timeline();
  if (refs.spotTitle) {
    tl.fromTo(refs.spotTitle, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" });
  }
  return tl;
}

export function animateLetterOpen(refs: LetterTimelineRefs) {
  const tl = gsap.timeline();
  if (refs.letterEnvelope) {
    tl.fromTo(
      refs.letterEnvelope,
      { rotateX: -12, scale: 0.85, opacity: 0 },
      { rotateX: 0, scale: 1, opacity: 1, duration: 1, ease: "power2.out" },
    );
    tl.to(refs.letterEnvelope, { rotateX: 75, duration: 0.8, ease: "power2.inOut" }, "+=0.2");
  }
  if (refs.letterPaper) {
    tl.fromTo(
      refs.letterPaper,
      { y: 40, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power2.out" },
      "-=0.3",
    );
  }
  if (refs.letterText) {
    tl.fromTo(
      refs.letterText,
      { opacity: 0, clipPath: "inset(0 100% 0 0)" },
      { opacity: 1, clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power1.inOut" },
      "-=0.5",
    );
  }
  return tl;
}

export function animateCheckinDone(refs: LetterTimelineRefs) {
  const tl = gsap.timeline();
  if (refs.checkinBadge) {
    tl.fromTo(
      refs.checkinBadge,
      { scale: 0.4, opacity: 0, rotate: -12 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: "back.out(1.6)" },
    );
  }
  return tl;
}

export function animateShareCard(refs: LetterTimelineRefs) {
  const tl = gsap.timeline();
  if (refs.shareCard) {
    tl.fromTo(
      refs.shareCard,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
    );
  }
  return tl;
}

export function killLetterTimelines() {
  gsap.globalTimeline.getChildren(false, true, true).forEach((t) => t.kill());
}
