declare module "fingerpose" {
  export enum Finger {
    Thumb = 0,
    Index = 1,
    Middle = 2,
    Ring = 3,
    Pinky = 4,
  }

  export enum FingerCurl {
    NoCurl = 0,
    HalfCurl = 1,
    FullCurl = 2,
  }

  export enum FingerDirection {
    VerticalUp = 0,
    VerticalDown = 1,
    HorizontalLeft = 2,
    HorizontalRight = 3,
    DiagonalUpLeft = 4,
    DiagonalUpRight = 5,
    DiagonalDownLeft = 6,
    DiagonalDownRight = 7,
  }

  export class GestureDescription {
    constructor(name: string);
    addCurl(finger: Finger, curl: FingerCurl, weight: number): void;
    addDirection(finger: Finger, direction: FingerDirection, weight: number): void;
  }

  export class GestureEstimator {
    constructor(gestures: GestureDescription[]);
    estimate(
      landmarks: { x: number; y: number; z?: number }[],
      minScore?: number,
    ): {
      gestures: { name: string; score: number }[];
    };
  }
}
