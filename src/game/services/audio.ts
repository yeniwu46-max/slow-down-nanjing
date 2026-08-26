import { Howler } from "howler";

export type FeedbackTone = "paper" | "water" | "bell";

let enabled = false;

export function setGameAudioEnabled(nextEnabled: boolean) {
  enabled = nextEnabled;
  Howler.mute(!enabled);
  Howler.volume(enabled ? 0.35 : 0);
}

export function getGameAudioEnabled() {
  return enabled;
}

export function playSoftFeedback(tone: FeedbackTone = "paper") {
  if (!enabled || typeof window === "undefined") return;

  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequencies: Record<FeedbackTone, number> = {
    paper: 392,
    water: 523,
    bell: 659,
  };

  oscillator.type = "sine";
  oscillator.frequency.value = frequencies[tone];
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.04, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.36);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
