import type * as THREE from "three";

export interface MindARThreeInstance {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  addAnchor: (index: number) => { group: THREE.Group; onTargetFound: (cb: () => void) => void; onTargetLost: (cb: () => void) => void };
  start: () => Promise<void>;
  stop: () => void;
  switchCamera: () => Promise<void>;
}

export interface MindARThreeOptions {
  container: HTMLElement;
  imageTargetSrc: string;
  maxTrack?: number;
  uiLoading?: string;
  uiScanning?: string;
  uiError?: string;
}

declare module "mind-ar/dist/mindar-image-three.prod.js" {
  export class MindARThree implements MindARThreeInstance {
    constructor(options: MindARThreeOptions);
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    addAnchor(index: number): {
      group: THREE.Group;
      onTargetFound(cb: () => void): void;
      onTargetLost(cb: () => void): void;
    };
    start(): Promise<void>;
    stop(): void;
    switchCamera(): Promise<void>;
  }
}
