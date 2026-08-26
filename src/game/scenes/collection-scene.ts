import * as Phaser from "phaser";
import { emitGameEvent } from "@/game/events";
import type { FragmentDefinition, FragmentProgress, RouteDefinition } from "@/game/types";

interface CollectionSceneData {
  route: RouteDefinition;
  progress: FragmentProgress[];
  reducedMotion: boolean;
}

type SceneFragment = FragmentDefinition & FragmentProgress;

export class CollectionScene extends Phaser.Scene {
  private route!: RouteDefinition;
  private fragments: SceneFragment[] = [];
  private reducedMotion = false;
  private slotPositions = new Map<string, Phaser.Math.Vector2>();
  private draggables = new Map<
    string,
    {
      syncPosition: (x: number, y: number) => void;
      fragment: SceneFragment;
      home: Phaser.Math.Vector2;
      visuals: Phaser.GameObjects.Container;
    }
  >();

  constructor() {
    super("CollectionScene");
  }

  init(data: CollectionSceneData) {
    this.route = data.route;
    this.reducedMotion = data.reducedMotion;
    this.fragments = this.route.fragments.map((fragment) => ({
      ...fragment,
      ...(data.progress.find((item) => item.id === fragment.id) ?? {
        found: false,
        placed: false,
      }),
    }));
  }

  preload() {
    this.route.fragments.forEach((fragment) => {
      if (fragment.image) this.load.image(fragment.id, fragment.image);
    });
  }

  create() {
    this.cameras.main.setBackgroundColor(this.route.palette.bg);
    this.input.dragDistanceThreshold = 4;
    this.input.dragTimeThreshold = 80;
    this.input.topOnly = true;
    this.buildBoard();
    this.scale.on("resize", this.handleResize, this);
    this.events.once("shutdown", () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  private resizeTimer?: Phaser.Time.TimerEvent;
  private lastSize = { width: 0, height: 0 };

  private handleResize() {
    const width = Math.round(this.scale.width);
    const height = Math.round(this.scale.height);
    if (Math.abs(width - this.lastSize.width) < 6 && Math.abs(height - this.lastSize.height) < 6) {
      return;
    }
    this.resizeTimer?.remove(false);
    this.resizeTimer = this.time.delayedCall(80, () => this.buildBoard());
  }

  private buildBoard() {
    this.lastSize = {
      width: Math.round(this.scale.width),
      height: Math.round(this.scale.height),
    };
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.removeAll(true);
    this.draggables.clear();
    this.slotPositions.clear();
    this.drawSceneBackdrop();
    this.drawIntro();
    this.drawTrayHint();
    this.drawSlots();
    this.drawFragments();
  }

  private isCompact() {
    return this.scale.width < 760;
  }

  private drawTrayHint() {
    if (this.isCompact()) return;
    const { width, height } = this.scale;
    const trayY = height - 78;
    const accent = Phaser.Display.Color.HexStringToColor(this.route.palette.accent).color;

    const tray = this.add.graphics().setDepth(4);
    tray.fillStyle(0xffffff, 0.12);
    tray.lineStyle(1, accent, 0.22);
    tray.fillRoundedRect(24, trayY - 44, Math.min(width - 48, 360), 88, 22);
    tray.strokeRoundedRect(24, trayY - 44, Math.min(width - 48, 360), 88, 22);

    this.add
      .text(44, trayY - 58, "收纳托盘 · 拖入右侧留白", {
        fontFamily: "Noto Sans SC, sans-serif",
        fontSize: "11px",
        color: this.route.palette.ink,
      })
      .setAlpha(0.55)
      .setDepth(5);
  }

  private getTrayPosition(fragment: SceneFragment) {
    const unplaced = this.fragments.filter((item) => item.found && !item.placed);
    const index = Math.max(
      0,
      unplaced.findIndex((item) => item.id === fragment.id),
    );
    const gap = 96;
    if (this.isCompact()) {
      return new Phaser.Math.Vector2(56 + index * gap, this.scale.height * 0.42);
    }
    return new Phaser.Math.Vector2(88 + index * gap, this.scale.height - 72);
  }

  private drawSceneBackdrop() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();
    const bg = Phaser.Display.Color.HexStringToColor(this.route.palette.bg).color;
    const accent = Phaser.Display.Color.HexStringToColor(this.route.palette.accent).color;
    const soft = Phaser.Display.Color.HexStringToColor(this.route.palette.soft).color;
    const ink = Phaser.Display.Color.HexStringToColor(this.route.palette.ink).color;

    graphics.fillStyle(bg, 1).fillRect(0, 0, width, height);
    graphics.fillStyle(soft, 0.35).fillEllipse(width * 0.26, height * 0.22, width * 0.56, height * 0.24);
    graphics.fillStyle(accent, 0.16).fillEllipse(width * 0.74, height * 0.68, width * 0.5, height * 0.2);

    if (this.route.interaction === "ripple") {
      for (let i = 0; i < 4; i += 1) {
        graphics.lineStyle(2, accent, 0.18 - i * 0.025);
        graphics.strokeEllipse(width * 0.48, height * 0.58, width * (0.45 + i * 0.08), height * (0.12 + i * 0.03));
      }
    }

    if (this.route.interaction === "wind") {
      graphics.lineStyle(3, ink, 0.14);
      for (let i = 0; i < 5; i += 1) {
        graphics.beginPath();
        graphics.moveTo(width * 0.14, height * (0.28 + i * 0.09));
        graphics.lineTo(width * 0.4, height * (0.22 + i * 0.08));
        graphics.lineTo(width * 0.82, height * (0.32 + i * 0.07));
        graphics.strokePath();
      }
    }

    if (this.route.interaction === "mist") {
      for (let i = 0; i < 5; i += 1) {
        graphics.fillStyle(soft, 0.24);
        graphics.fillRoundedRect(width * (0.08 + i * 0.16), height * (0.34 + (i % 2) * 0.12), width * 0.36, 34, 18);
      }
      graphics.lineStyle(8, accent, 0.2).lineBetween(width * 0.18, height * 0.74, width * 0.82, height * 0.46);
    }

    if (this.route.interaction === "light") {
      graphics.fillStyle(0x10192a, 0.35).fillRect(0, 0, width, height);
      graphics.lineStyle(3, accent, 0.28).strokeEllipse(width * 0.5, height * 0.68, width * 0.7, height * 0.18);
      for (let i = 0; i < 4; i += 1) {
        graphics.fillStyle(accent, 0.16 + i * 0.04).fillCircle(width * (0.25 + i * 0.16), height * 0.58, 18 + i * 2);
      }
    }
  }

  private drawIntro() {
    const { width } = this.scale;
    const textColor = this.route.palette.ink;

    this.add
      .text(width * 0.06, 20, this.route.title, {
        fontFamily: "Noto Serif SC, serif",
        fontSize: this.isCompact() ? "18px" : "24px",
        color: textColor,
      })
      .setDepth(10);

    this.add
      .text(width * 0.06, this.isCompact() ? 46 : 64, this.route.gestureHint, {
        fontFamily: "Noto Sans SC, sans-serif",
        fontSize: "14px",
        color: textColor,
      })
      .setAlpha(0.82)
      .setDepth(10);
  }

  private drawSlots() {
    const { width, height } = this.scale;
    const compact = this.isCompact();
    const startX = compact ? width * 0.2 : width * 0.7;
    const startY = compact ? 92 : height * 0.24;
    const gap = compact ? width * 0.28 : 92;
    const accent = Phaser.Display.Color.HexStringToColor(this.route.palette.accent).color;
    const ink = Phaser.Display.Color.HexStringToColor(this.route.palette.ink).color;

    this.add
      .text(compact ? width * 0.06 : width * 0.68, compact ? 68 : height * 0.17, "慢游札记留白", {
        fontFamily: "Noto Sans SC, sans-serif",
        fontSize: "13px",
        color: this.route.palette.ink,
      })
      .setAlpha(0.72)
      .setDepth(6);

    this.route.fragments.forEach((fragment, index) => {
      const x = compact ? startX + index * gap : startX;
      const y = compact ? startY : startY + index * gap;
      this.slotPositions.set(fragment.slotId, new Phaser.Math.Vector2(x, y));

      const slot = this.add.graphics();
      slot.lineStyle(2, accent, 0.38);
      slot.fillStyle(0xffffff, 0.16);
      slot.strokeRoundedRect(x - 32, y - 32, 64, 64, 18);
      slot.fillRoundedRect(x - 32, y - 32, 64, 64, 18);

      this.add
        .text(x, y + 45, fragment.name, {
          fontFamily: "Noto Sans SC, sans-serif",
          fontSize: "12px",
          color: `#${ink.toString(16).padStart(6, "0")}`,
        })
        .setOrigin(0.5)
        .setAlpha(0.58);

      const dropZone = this.add
        .zone(x, y, 104, 104)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);

      dropZone.on("pointerup", () => {
        this.snapFragmentToSlot(fragment.id, x, y);
      });
    });
  }

  private snapFragmentToSlot(fragmentId: string, slotX: number, slotY: number) {
    const handle = this.draggables.get(fragmentId);
    const state = this.fragments.find((item) => item.id === fragmentId);
    if (!handle || !state || !state.found || state.placed) return;

    handle.syncPosition(slotX, slotY);
    state.placed = true;
    state.placedSlotId = handle.fragment.slotId;
    handle.home.set(slotX, slotY);
    emitGameEvent("fragment-placed", { routeId: this.route.id, fragmentId });
    emitGameEvent("play-feedback", { tone: "paper" });
    if (!this.reducedMotion) {
      this.tweens.add({
        targets: handle.visuals,
        scale: 1.1,
        duration: 180,
        yoyo: true,
        ease: "Back.easeOut",
      });
    }
  }

  private drawFragments() {
    this.fragments.forEach((fragment) => {
      if (!fragment.found) {
        this.drawHotspot(fragment);
        return;
      }

      const target = fragment.placed
        ? this.slotPositions.get(fragment.placedSlotId ?? fragment.slotId)
        : this.getTrayPosition(fragment);

      if (target) this.drawDraggableFragment(fragment, target.x, target.y);
    });
  }

  private drawHotspot(fragment: SceneFragment) {
    const { width, height } = this.scale;
    const x = width * fragment.x;
    const y = this.isCompact() ? Math.max(height * fragment.y, 196) : height * fragment.y;
    const accent = Phaser.Display.Color.HexStringToColor(this.route.palette.accent).color;
    const soft = Phaser.Display.Color.HexStringToColor(this.route.palette.soft).color;
    const hitSize = 140;
    const kind = this.route.interaction;

    const zone = this.add
      .zone(x, y, hitSize, hitSize)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(8);

    const halo = this.add
      .circle(x, y, kind === "light" ? 28 : 42, accent, kind === "light" ? 0.08 : 0.18)
      .setDepth(8);
    const label = this.add
      .text(x, y + 48, fragment.hint, {
        fontFamily: "Noto Sans SC, sans-serif",
        fontSize: "12px",
        color: this.route.palette.ink,
        align: "center",
        wordWrap: { width: 140 },
      })
      .setOrigin(0.5)
      .setAlpha(0.78)
      .setDepth(8);

    const fog =
      kind === "mist" ? this.add.ellipse(x, y, 132, 86, soft, 0.82).setDepth(9) : null;

    if (!this.reducedMotion && kind !== "mist") {
      this.tweens.add({
        targets: halo,
        scale: kind === "light" ? 1.06 : 1.15,
        alpha: kind === "light" ? 0.14 : 0.28,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    let revealed = false;
    let lit = kind !== "light";
    let startX = 0;
    let startY = 0;
    let swept = 0;

    const finishReveal = () => {
      if (revealed) return;
      revealed = true;
      fog?.destroy();
      this.playRevealFx(kind, x, y, accent);
      const delay = this.reducedMotion ? 80 : kind === "ripple" ? 520 : kind === "wind" ? 360 : 280;
      this.time.delayedCall(delay, () => {
        this.revealFragment(fragment, halo, label, zone);
      });
    };

    const onPointerDown = (pointer: Phaser.Input.Pointer) => {
      startX = pointer.x;
      startY = pointer.y;
      if (kind === "ripple") {
        this.spawnRipples(x, y, accent);
        this.time.delayedCall(this.reducedMotion ? 60 : 480, finishReveal);
        return;
      }
      if (kind === "light" && !lit) {
        lit = true;
        this.tweens.killTweensOf(halo);
        this.tweens.add({
          targets: halo,
          alpha: 0.85,
          scale: 1.8,
          duration: 420,
          ease: "Cubic.easeOut",
        });
        emitGameEvent("play-feedback", { tone: "bell" });
        label.setText("灯亮了，再点一次收起");
        return;
      }
      if (kind === "light" && lit) {
        finishReveal();
        return;
      }

      if (kind === "wind" || kind === "mist") {
        const onMove = (p: Phaser.Input.Pointer) => {
          if (revealed) return;
          const moved = Phaser.Math.Distance.Between(startX, startY, p.x, p.y);
          if (kind === "mist" && fog) {
            swept += Phaser.Math.Distance.Between(p.prevPosition.x, p.prevPosition.y, p.x, p.y);
            fog.setAlpha(Math.max(0.08, 0.82 - swept / 220));
            fog.setScale(Math.max(0.35, 1 - swept / 280));
            if (swept > 70) finishReveal();
          }
          if (kind === "wind" && moved > 18) {
            this.drawWindGust(startX, startY, p.x, p.y, accent);
          }
        };
        const onUp = (p: Phaser.Input.Pointer) => {
          this.input.off("pointermove", onMove);
          this.input.off("pointerup", onUp);
          if (revealed) return;
          const moved = Phaser.Math.Distance.Between(startX, startY, p.x, p.y);
          if (kind === "wind") {
            if (moved > 64) {
              this.blowToward(x, y, p.x, p.y, accent);
              finishReveal();
            } else {
              label.setText("再顺着风拖远一点");
            }
          }
          if (kind === "mist" && (moved > 40 || swept > 70)) finishReveal();
        };
        this.input.on("pointermove", onMove);
        this.input.on("pointerup", onUp);
      }
    };

    zone.on("pointerdown", onPointerDown);
  }

  private spawnRipples(x: number, y: number, accent: number) {
    for (let i = 0; i < 3; i += 1) {
      const ring = this.add.circle(x, y, 10, accent, 0).setStrokeStyle(2, accent, 0.7).setDepth(12);
      this.tweens.add({
        targets: ring,
        scale: 4 + i,
        alpha: 0,
        duration: this.reducedMotion ? 160 : 520 + i * 90,
        delay: i * 70,
        ease: "Cubic.easeOut",
        onComplete: () => ring.destroy(),
      });
    }
  }

  private drawWindGust(x1: number, y1: number, x2: number, y2: number, accent: number) {
    const line = this.add.graphics().setDepth(12);
    line.lineStyle(3, accent, 0.45);
    line.beginPath();
    line.moveTo(x1, y1);
    line.lineTo(x2, y2);
    line.strokePath();
    this.tweens.add({
      targets: line,
      alpha: 0,
      duration: 280,
      onComplete: () => line.destroy(),
    });
  }

  private blowToward(x: number, y: number, tx: number, ty: number, accent: number) {
    const leaf = this.add.circle(x, y, 8, accent, 0.8).setDepth(12);
    this.tweens.add({
      targets: leaf,
      x: tx,
      y: ty,
      alpha: 0.1,
      duration: this.reducedMotion ? 120 : 340,
      ease: "Cubic.easeOut",
      onComplete: () => leaf.destroy(),
    });
  }

  private playRevealFx(
    kind: RouteDefinition["interaction"],
    x: number,
    y: number,
    accent: number,
  ) {
    if (this.reducedMotion) return;
    if (kind === "mist") {
      const puff = this.add.ellipse(x, y, 90, 50, 0xffffff, 0.4).setDepth(12);
      this.tweens.add({
        targets: puff,
        alpha: 0,
        scale: 1.6,
        duration: 400,
        onComplete: () => puff.destroy(),
      });
    }
    if (kind === "light") {
      const glow = this.add.circle(x, y, 16, accent, 0.7).setDepth(12);
      this.tweens.add({
        targets: glow,
        scale: 3.2,
        alpha: 0,
        duration: 500,
        onComplete: () => glow.destroy(),
      });
    }
  }

  private revealFragment(
    fragment: SceneFragment,
    halo: Phaser.GameObjects.Arc,
    label: Phaser.GameObjects.Text,
    zone: Phaser.GameObjects.Zone,
  ) {
    emitGameEvent("fragment-found", { routeId: this.route.id, fragmentId: fragment.id });
    emitGameEvent("play-feedback", { tone: this.route.interaction === "light" ? "bell" : "water" });

    this.tweens.add({
      targets: [halo, label],
      alpha: 0,
      scale: 1.45,
      duration: 360,
      ease: "Cubic.easeOut",
      onComplete: () => {
        halo.destroy();
        label.destroy();
        zone.destroy();
        fragment.found = true;
        this.drawDraggableFragment(fragment, this.scale.width * fragment.x, this.scale.height * fragment.y);
      },
    });
  }

  private drawDraggableFragment(fragment: SceneFragment, x: number, y: number) {
    const accent = Phaser.Display.Color.HexStringToColor(this.route.palette.accent).color;
    const ink = this.route.palette.ink;
    const hitSize = 96;

    const visuals = this.add.container(x, y).setDepth(15);
    const paper = this.add.graphics();
    paper.fillStyle(0xfffbf0, 0.96).fillRoundedRect(-34, -34, 68, 68, 20);
    paper.lineStyle(2, accent, 0.35).strokeRoundedRect(-34, -34, 68, 68, 20);
    visuals.add(paper);

    if (this.textures.exists(fragment.id)) {
      const photo = this.add.image(0, -6, fragment.id).setDisplaySize(52, 52);
      visuals.add(photo);
    } else {
      visuals.add(
        this.add
          .text(0, -6, fragment.symbol, {
            fontFamily: "Noto Serif SC, serif",
            fontSize: "30px",
            color: ink,
          })
          .setOrigin(0.5),
      );
    }

    visuals.add(
      this.add
        .text(0, 24, fragment.name, {
          fontFamily: "Noto Sans SC, sans-serif",
          fontSize: "11px",
          color: ink,
        })
        .setOrigin(0.5)
        .setAlpha(0.75),
    );

    const zone = this.add
      .zone(x, y, hitSize, hitSize)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(16);

    this.input.setDraggable(zone);

    const home = fragment.placed
      ? this.slotPositions.get(fragment.placedSlotId ?? fragment.slotId)!.clone()
      : this.getTrayPosition(fragment);

    const syncPosition = (px: number, py: number) => {
      zone.setPosition(px, py);
      visuals.setPosition(px, py);
    };

    if (!fragment.placed) {
      this.tweens.add({
        targets: visuals,
        x: home.x,
        y: home.y,
        duration: this.reducedMotion ? 1 : 420,
        ease: "Cubic.easeOut",
        onUpdate: () => zone.setPosition(visuals.x, visuals.y),
        onComplete: () => syncPosition(home.x, home.y),
      });
    }

    const resetScale = () => {
      if (!this.reducedMotion) visuals.setScale(1);
    };

    zone.on("pointerover", () => {
      if (!this.reducedMotion) visuals.setScale(1.06);
    });
    zone.on("pointerout", resetScale);

    zone.on("dragstart", () => {
      zone.setDepth(30);
      visuals.setDepth(29);
      if (!this.reducedMotion) visuals.setScale(1.14);
    });

    zone.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      syncPosition(dragX, dragY);
    });

    zone.on("dragend", () => {
      zone.setDepth(16);
      visuals.setDepth(15);
      resetScale();

      const slot = this.slotPositions.get(fragment.slotId);
      if (!slot) return;

      const distance = Phaser.Math.Distance.Between(zone.x, zone.y, slot.x, slot.y);
      if (distance <= 110) {
        this.snapFragmentToSlot(fragment.id, slot.x, slot.y);
      } else {
        syncPosition(home.x, home.y);
        if (fragment.placed) {
          fragment.placed = false;
          fragment.placedSlotId = undefined;
          emitGameEvent("fragment-unplaced", { routeId: this.route.id, fragmentId: fragment.id });
        }
      }
    });

    this.draggables.set(fragment.id, { syncPosition, fragment, home, visuals });
  }
}
