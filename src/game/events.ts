import type { FragmentEventPayload, RouteId } from "@/game/types";

type GameEventMap = {
  "fragment-found": FragmentEventPayload;
  "fragment-placed": FragmentEventPayload;
  "fragment-unplaced": FragmentEventPayload;
  "route-complete": { routeId: RouteId };
  "open-journal": undefined;
  "open-poster": { routeId: RouteId };
  "play-feedback": { tone?: "paper" | "water" | "bell" };
};

const target = new EventTarget();

export function emitGameEvent<T extends keyof GameEventMap>(
  type: T,
  detail: GameEventMap[T],
) {
  target.dispatchEvent(new CustomEvent(type, { detail }));
}

export function onGameEvent<T extends keyof GameEventMap>(
  type: T,
  handler: (detail: GameEventMap[T]) => void,
) {
  const listener = (event: Event) => {
    handler((event as CustomEvent<GameEventMap[T]>).detail);
  };

  target.addEventListener(type, listener);
  return () => target.removeEventListener(type, listener);
}
