/**
 * 情绪气象局 Weather of Mind
 * 手势交互 · 情绪天气可视化
 */

(function () {
  'use strict';

  const DEBUG = new URLSearchParams(location.search).has('debug');

  const STATES = {
    idle: 'idle',
    mist: 'mist',
    rain: 'rain',
    storm: 'storm',
    clearing: 'clearing',
    sunset: 'sunset',
  };

  const STATE_LABELS = {
    idle: '静候',
    mist: '雾起',
    rain: '雨落',
    storm: '风暴',
    clearing: '开云',
    sunset: '晚霞',
  };

  const AUTO_DWELL = {
    mist: 40000,
    rain: 50000,
    storm: 40000,
    clearing: 50000,
    sunset: 30000,
  };

  const MIN_DWELL = 8000;

  const COOLDOWN = {
    handAppear: 500,
    tap: 400,
    fist: 1200,
    wave: 800,
    rise: 1500,
    handsOpen: 1500,
    handsHug: 2000,
  };

  const QUOTES = {
    mist: ['不用急着变好。先看见它。', '像梧桐树下的风，先感受再出发。', '今天，你的心里是什么天气？'],
    rain: ['有些情绪，落下来才会轻一点。'],
    storm: ['你可以承认：我现在确实很乱。'],
    clearing: ['情绪不会永远停在同一个天气里。', '当云散开，光会慢慢回来。'],
    sunset: ['允许自己慢一点，也是一种前进。', '当云散开，秦淮河边的光会慢慢回来。'],
    default: ['允许自己慢一点，也是一种前进。'],
  };

  /* ─── SessionMetrics ─── */
  const SessionMetrics = {
    tapCount: 0,
    waveEnergy: 0,
    stormDuration: 0,
    clearingScore: 0,
    timeInMist: 0,
    dominantState: 'mist',
    stateCounts: {},

    reset() {
      this.tapCount = 0;
      this.waveEnergy = 0;
      this.stormDuration = 0;
      this.clearingScore = 0;
      this.timeInMist = 0;
      this.dominantState = 'mist';
      this.stateCounts = {};
    },

    recordState(state, dt) {
      this.stateCounts[state] = (this.stateCounts[state] || 0) + dt;
      if (state === STATES.mist) this.timeInMist += dt;
      if (state === STATES.storm) this.stormDuration += dt;
      if (state === STATES.clearing) this.clearingScore += dt * 0.001;
    },

    onTap() {
      this.tapCount++;
    },

    onWave(speed) {
      this.waveEnergy += Math.min(speed * 2, 15);
    },

    finalize() {
      let max = 0;
      for (const [s, t] of Object.entries(this.stateCounts)) {
        if (t > max && s !== STATES.idle) {
          max = t;
          this.dominantState = s;
        }
      }
    },

    getConcentration() {
      const base = Math.min(100, 30 + this.tapCount * 3 + this.stormDuration * 0.02);
      return Math.round(Math.min(100, base + this.waveEnergy * 0.5));
    },

    getWindLabel() {
      const e = this.waveEnergy;
      if (e < 20) return '平静';
      if (e < 60) return '微风';
      if (e < 120) return '偏高';
      return '强劲';
    },

    getVisibility() {
      const v = Math.min(100, 20 + this.clearingScore * 40 + (this.stateCounts[STATES.sunset] || 0) * 0.05);
      if (v < 35) return '朦胧';
      if (v < 60) return '逐渐清晰';
      if (v < 85) return '明朗';
      return '清澈';
    },

    getWeatherSummary() {
      const d = this.dominantState;
      const map = {
        mist: '阴天有雾',
        rain: '小雨',
        storm: '风暴',
        clearing: '多云转晴',
        sunset: '晚霞',
        idle: '静云',
      };
      const primary = map[d] || '多变';
      if (this.stateCounts[STATES.clearing] && this.stateCounts[STATES.rain]) {
        return '小雨转晴';
      }
      if (this.stateCounts[STATES.sunset]) {
        return primary.includes('转') ? primary : `${primary}转晚霞`;
      }
      return primary;
    },

    getQuote() {
      const pool = QUOTES[this.dominantState] || QUOTES.default;
      return pool[Math.floor(Math.random() * pool.length)];
    },
  };

  /* ─── WeatherCanvas ─── */
  const WeatherCanvas = {
    canvas: null,
    ctx: null,
    w: 0,
    h: 0,
    state: STATES.idle,
    blend: 0,
    targetBlend: 0,
    breath: 0,
    sunY: 1.2,
    targetSunY: 1.2,
    brightness: 0.35,
    targetBrightness: 0.35,
    cloudSplit: 0,
    targetCloudSplit: 0,
    windStrength: 0,
    stormPulse: 0,
    hugGlow: 0,
    mistParticles: [],
    rainDrops: [],
    ripples: [],
    windLines: [],
    lightning: null,
    lightningTimer: 0,
    particles: [],
    clouds: [],
    rafId: null,
    lastTime: 0,

    init(canvasEl) {
      this.canvas = canvasEl;
      this.ctx = canvasEl.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.initPools();
      this.initClouds();
    },

    resize() {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.canvas.width = this.w;
      this.canvas.height = this.h;
    },

    initPools() {
      for (let i = 0; i < 80; i++) {
        this.mistParticles.push(this.createMistParticle());
      }
      for (let i = 0; i < 120; i++) {
        this.rainDrops.push({ x: 0, y: 0, vy: 0, len: 0, active: false });
      }
      for (let i = 0; i < 30; i++) {
        this.ripples.push({ x: 0, y: 0, r: 0, maxR: 0, active: false });
      }
      for (let i = 0; i < 40; i++) {
        this.windLines.push({ x: 0, y: 0, len: 0, vx: 0, life: 0, active: false });
      }
      for (let i = 0; i < 60; i++) {
        this.particles.push({
          x: Math.random(),
          y: Math.random(),
          vx: (Math.random() - 0.5) * 0.0002,
          vy: (Math.random() - 0.5) * 0.0002,
          size: Math.random() * 2 + 0.5,
          warm: 0,
        });
      }
    },

    initClouds() {
      this.clouds = [];
      for (let i = 0; i < 6; i++) {
        this.clouds.push({
          x: Math.random() * 1.2 - 0.1,
          y: 0.15 + Math.random() * 0.35,
          w: 0.25 + Math.random() * 0.2,
          h: 0.06 + Math.random() * 0.04,
          speed: (Math.random() - 0.5) * 0.00003,
        });
      }
    },

    createMistParticle() {
      return {
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 0.08 + 0.03,
        vx: (Math.random() - 0.5) * 0.00015,
        vy: (Math.random() - 0.5) * 0.00008,
        alpha: Math.random() * 0.15 + 0.05,
      };
    },

    setState(state) {
      this.state = state;
      const presets = {
        idle: { brightness: 0.3, sunY: 1.2, cloudSplit: 0 },
        mist: { brightness: 0.38, sunY: 1.2, cloudSplit: 0 },
        rain: { brightness: 0.32, sunY: 1.2, cloudSplit: 0 },
        storm: { brightness: 0.22, sunY: 1.2, cloudSplit: 0 },
        clearing: { brightness: 0.65, sunY: 0.55, cloudSplit: 0.7 },
        sunset: { brightness: 0.75, sunY: 0.7, cloudSplit: 0.85 },
      };
      const p = presets[state] || presets.mist;
      this.targetBrightness = p.brightness;
      this.targetSunY = p.sunY;
      this.targetCloudSplit = p.cloudSplit;
    },

    spawnRain(x, y) {
      for (const d of this.rainDrops) {
        if (!d.active) {
          d.x = x;
          d.y = y;
          d.vy = 4 + Math.random() * 3;
          d.len = 8 + Math.random() * 12;
          d.active = true;
          break;
        }
      }
      this.spawnRipple(x, y + 20);
    },

    spawnRipple(x, y) {
      for (const r of this.ripples) {
        if (!r.active) {
          r.x = x;
          r.y = y;
          r.r = 0;
          r.maxR = 30 + Math.random() * 40;
          r.active = true;
          break;
        }
      }
    },

    spawnWind(intensity) {
      const count = Math.floor(intensity * 3) + 1;
      for (let n = 0; n < count; n++) {
        for (const w of this.windLines) {
          if (!w.active) {
            w.x = Math.random() * this.w;
            w.y = Math.random() * this.h * 0.7;
            w.len = 40 + Math.random() * 80;
            w.vx = 8 + intensity * 12;
            w.life = 1;
            w.active = true;
            break;
          }
        }
      }
      this.windStrength = Math.min(1, this.windStrength + intensity * 0.15);
    },

    triggerLightning() {
      this.lightning = {
        points: [],
        life: 1,
      };
      let x = Math.random() * this.w * 0.6 + this.w * 0.2;
      let y = 0;
      for (let i = 0; i < 8; i++) {
        this.lightning.points.push({ x, y });
        x += (Math.random() - 0.5) * 60;
        y += this.h * 0.08 + Math.random() * 40;
      }
      this.lightningTimer = 0.3;
    },

    getGradientColors() {
      const s = this.state;
      const b = this.brightness;
      if (s === STATES.sunset || (s === STATES.clearing && b > 0.5)) {
        return ['#3d3548', '#8b6070', '#c4907a', '#e8b896', '#f0dcc8'];
      }
      if (s === STATES.storm) {
        return ['#0f1520', '#1a2438', '#2a3548', '#3d4f6a', '#4a5870'];
      }
      if (s === STATES.rain) {
        return ['#1a2438', '#2a3548', '#3d4f6a', '#4a5870', '#5a6880'];
      }
      if (s === STATES.clearing) {
        return ['#4a5870', '#6b7a94', '#9aabb8', '#c4b896', '#e8dcc8'];
      }
      return ['#2a3548', '#4a5870', '#6b7a94', '#8b9cb8', '#b8c4d4'];
    },

    drawBackground() {
      const ctx = this.ctx;
      const colors = this.getGradientColors();
      const g = ctx.createLinearGradient(0, 0, 0, this.h);
      colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.w, this.h);

      const overlay = ctx.createRadialGradient(
        this.w * 0.5, this.h * 0.3, 0,
        this.w * 0.5, this.h * 0.5, this.w * 0.8
      );
      overlay.addColorStop(0, `rgba(255, 240, 220, ${this.brightness * 0.15})`);
      overlay.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, this.w, this.h);
    },

    drawClouds() {
      const ctx = this.ctx;
      const split = this.cloudSplit;
      for (const c of this.clouds) {
        c.x += c.speed + this.windStrength * 0.0002;
        if (c.x > 1.3) c.x = -0.3;
        if (c.x < -0.3) c.x = 1.3;

        let cx = c.x * this.w;
        const cy = c.y * this.h;
        const cw = c.w * this.w;
        const ch = c.h * this.h;

        if (split > 0.1) {
          const offset = split * this.w * 0.25;
          if (cx < this.w * 0.5) cx -= offset;
          else cx += offset;
        }

        ctx.save();
        ctx.globalAlpha = 0.25 + (this.state === STATES.storm ? 0.15 : 0);
        ctx.fillStyle = this.state === STATES.storm ? '#8899aa' : '#dde4ee';
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw * 0.5, ch * 0.5, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - cw * 0.25, cy + ch * 0.2, cw * 0.35, ch * 0.4, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + cw * 0.25, cy + ch * 0.15, cw * 0.3, ch * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },

    drawMist() {
      const ctx = this.ctx;
      const active = this.state !== STATES.clearing && this.state !== STATES.sunset;
      if (!active && this.brightness > 0.6) return;

      const breathScale = 1 + Math.sin(this.breath) * 0.08;
      for (const p of this.mistParticles) {
        p.x += p.vx + this.windStrength * 0.0003;
        p.y += p.vy;
        if (p.x < -0.1) p.x = 1.1;
        if (p.x > 1.1) p.x = -0.1;
        if (p.y < -0.1) p.y = 1.1;
        if (p.y > 1.1) p.y = -0.1;

        const disp = this.windStrength * 30;
        ctx.beginPath();
        ctx.arc(
          p.x * this.w + disp,
          p.y * this.h,
          p.r * this.w * breathScale * (0.5 + (1 - this.windStrength) * 0.5),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(200, 210, 230, ${p.alpha * (1 - this.windStrength * 0.6)})`;
        ctx.fill();
      }
    },

    drawRain() {
      const ctx = this.ctx;
      const showRain = this.state === STATES.rain || this.state === STATES.storm;
      if (!showRain && !this.rainDrops.some((d) => d.active)) return;

      ctx.strokeStyle = 'rgba(180, 200, 220, 0.4)';
      ctx.lineWidth = 1;
      for (const d of this.rainDrops) {
        if (!d.active) continue;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.len);
        ctx.stroke();
        d.y += d.vy;
        d.x -= 1;
        if (d.y > this.h + 20) d.active = false;
      }

      if (showRain && Math.random() < 0.3) {
        this.spawnRain(Math.random() * this.w, -10);
      }
    },

    drawRipples() {
      const ctx = this.ctx;
      for (const r of this.ripples) {
        if (!r.active) continue;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 210, 230, ${1 - r.r / r.maxR})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        r.r += 1.2;
        if (r.r >= r.maxR) r.active = false;
      }
    },

    drawWind() {
      const ctx = this.ctx;
      ctx.strokeStyle = 'rgba(220, 230, 240, 0.25)';
      ctx.lineWidth = 1;
      for (const w of this.windLines) {
        if (!w.active) continue;
        ctx.beginPath();
        ctx.moveTo(w.x, w.y);
        ctx.lineTo(w.x + w.len, w.y + Math.sin(w.x * 0.01) * 5);
        ctx.stroke();
        w.x += w.vx;
        w.life -= 0.02;
        if (w.life <= 0 || w.x > this.w + 100) w.active = false;
      }
      this.windStrength *= 0.985;
    },

    drawLightning() {
      if (!this.lightning || this.lightning.life <= 0) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = `rgba(230, 240, 255, ${this.lightning.life * 0.8})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(200, 220, 255, 0.8)';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      const pts = this.lightning.points;
      if (pts.length) {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
      ctx.restore();
      this.lightning.life -= 0.08;
    },

    drawSun() {
      if (this.sunY >= 1.1) return;
      const ctx = this.ctx;
      const sx = this.w * 0.5;
      const sy = this.sunY * this.h;
      const radius = Math.min(this.w, this.h) * 0.12;

      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 3);
      glow.addColorStop(0, `rgba(255, 230, 200, ${0.35 * this.brightness})`);
      glow.addColorStop(0.5, `rgba(255, 200, 150, ${0.12 * this.brightness})`);
      glow.addColorStop(1, 'rgba(255,180,120,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.w, this.h);

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 220, 180, ${0.5 + this.brightness * 0.3})`;
      ctx.fill();
    },

    drawLightRays() {
      if (this.cloudSplit < 0.3) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = this.cloudSplit * 0.25;
      const cx = this.w * 0.5;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 40, 0);
        ctx.lineTo(cx + i * 120, this.h);
        ctx.strokeStyle = 'rgba(255, 230, 200, 0.3)';
        ctx.lineWidth = 30 + Math.abs(i) * 10;
        ctx.stroke();
      }
      ctx.restore();
    },

    drawParticles() {
      const ctx = this.ctx;
      const warm = this.state === STATES.sunset || this.state === STATES.clearing;
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        p.warm = warm ? Math.min(1, p.warm + 0.01) : Math.max(0, p.warm - 0.01);

        const r = 180 + p.warm * 60;
        const g = 200 + p.warm * 30;
        const b = 220 - p.warm * 80;
        ctx.beginPath();
        ctx.arc(p.x * this.w, p.y * this.h, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.2 + p.warm * 0.2})`;
        ctx.fill();
      }
    },

    drawHugGlow() {
      if (this.hugGlow <= 0) return;
      const ctx = this.ctx;
      const cx = this.w * 0.5;
      const cy = this.h * 0.55;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.w * 0.35);
      g.addColorStop(0, `rgba(255, 220, 200, ${this.hugGlow * 0.25})`);
      g.addColorStop(0.6, `rgba(200, 180, 220, ${this.hugGlow * 0.08})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.w, this.h);
    },

    update(dt) {
      this.breath += dt * 0.001;
      this.brightness += (this.targetBrightness - this.brightness) * 0.02;
      this.sunY += (this.targetSunY - this.sunY) * 0.015;
      this.cloudSplit += (this.targetCloudSplit - this.cloudSplit) * 0.02;
      this.hugGlow *= 0.98;

      if (this.state === STATES.storm) {
        this.stormPulse += dt * 0.002;
        this.lightningTimer -= dt * 0.001;
        if (this.lightningTimer <= 0 && Math.random() < 0.02) {
          this.triggerLightning();
          this.lightningTimer = 2 + Math.random() * 3;
        }
      }
    },

    draw() {
      this.drawBackground();
      this.drawSun();
      this.drawLightRays();
      this.drawClouds();
      this.drawMist();
      this.drawRain();
      this.drawRipples();
      this.drawWind();
      this.drawLightning();
      this.drawParticles();
      this.drawHugGlow();
      HandTracker.drawMainOverlay(this.ctx, this.w, this.h);
    },

    startLoop() {
      const loop = (t) => {
        const dt = Math.min(t - this.lastTime, 50);
        this.lastTime = t;
        this.update(dt);
        this.draw();
        HandTracker.drawPreview(CameraHands.video);
        this.rafId = requestAnimationFrame(loop);
      };
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(loop);
    },

    stopLoop() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
    },
  };

  /* ─── WeatherFSM ─── */
  const WeatherFSM = {
    state: STATES.idle,
    stateEnteredAt: 0,
    onChange: null,
    autoTimer: null,

    reset() {
      this.transition(STATES.idle);
      this.clearAutoTimer();
    },

    getState() {
      return this.state;
    },

    canTransition() {
      return Date.now() - this.stateEnteredAt >= MIN_DWELL;
    },

    transition(next) {
      if (next === this.state) return;
      const prev = this.state;
      this.state = next;
      this.stateEnteredAt = Date.now();
      WeatherCanvas.setState(next);
      this.scheduleAutoAdvance();
      if (this.onChange) this.onChange(next, prev);
    },

    scheduleAutoAdvance() {
      this.clearAutoTimer();
      const dwell = AUTO_DWELL[this.state];
      if (!dwell) return;
      this.autoTimer = setTimeout(() => {
        const order = [STATES.idle, STATES.mist, STATES.rain, STATES.storm, STATES.clearing, STATES.sunset];
        const idx = order.indexOf(this.state);
        if (idx >= 0 && idx < order.length - 1) {
          this.transition(order[idx + 1]);
        } else if (this.state === STATES.sunset) {
          App.showReport();
        }
      }, dwell);
    },

    clearAutoTimer() {
      if (this.autoTimer) {
        clearTimeout(this.autoTimer);
        this.autoTimer = null;
      }
    },

    handleGesture(gesture, data) {
      const s = this.state;

      if (gesture === 'handAppear' && s === STATES.idle) {
        this.transition(STATES.mist);
        return;
      }

      switch (gesture) {
        case 'tap':
          if (data?.x != null) WeatherCanvas.spawnRain(data.x, data.y);
          SessionMetrics.onTap();
          if (s !== STATES.rain && this.canTransition()) this.transition(STATES.rain);
          break;
        case 'fist':
          if (this.canTransition() || s === STATES.rain) this.transition(STATES.storm);
          WeatherCanvas.triggerLightning();
          break;
        case 'wave':
          WeatherCanvas.spawnWind(data?.speed || 0.5);
          SessionMetrics.onWave(data?.speed || 0.5);
          if ((data?.speed || 0) > 1.2 && this.canTransition()) {
            this.transition(STATES.storm);
          }
          break;
        case 'rise':
          if (this.canTransition()) this.transition(STATES.clearing);
          break;
        case 'handsOpen':
          if (this.canTransition()) this.transition(STATES.clearing);
          WeatherCanvas.targetCloudSplit = 0.85;
          break;
        case 'handsHug':
          WeatherCanvas.hugGlow = 1;
          if (this.canTransition()) this.transition(STATES.sunset);
          break;
        default:
          break;
      }
    },
  };

  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17],
  ];

  /* ─── HandTracker ─── */
  const HandTracker = {
    previewCanvas: null,
    previewCtx: null,
    latestHands: [],

    init() {
      this.previewCanvas = document.getElementById('hand-preview-canvas');
      this.previewCtx = this.previewCanvas?.getContext('2d');
      this.positionEl = document.getElementById('hand-position-text');
      this.statusEl = document.getElementById('hud-hand-status');
      this.trackerDot = document.getElementById('hand-tracker-dot');
      this.resizePreview();
      window.addEventListener('resize', () => this.resizePreview());
    },

    resizePreview() {
      if (!this.previewCanvas?.parentElement) return;
      const rect = this.previewCanvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.previewCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
      this.previewCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
    },

    toCanvas(lm, w, h) {
      return { x: (1 - lm.x) * w, y: lm.y * h };
    },

    setHands(hands) {
      this.latestHands = hands || [];
      this.updateLabels();
    },

    updateLabels() {
      const detected = this.latestHands.length > 0;
      if (this.statusEl) {
        this.statusEl.textContent = detected
          ? `手部：已检测 (${this.latestHands.length}只)`
          : '手部：未检测';
        this.statusEl.classList.toggle('detected', detected);
      }
      if (this.trackerDot) {
        this.trackerDot.classList.toggle('active', detected);
      }
      if (!this.positionEl) return;
      if (!detected) {
        this.positionEl.textContent = '将手掌移入画面以校准位置';
        return;
      }
      const lines = this.latestHands.map((landmarks, i) => {
        const palm = landmarks[9];
        const px = Math.round((1 - palm.x) * 100);
        const py = Math.round(palm.y * 100);
        const label = this.latestHands.length > 1 ? `手${i + 1}` : '掌心';
        return `${label} (${px}%, ${py}%)`;
      });
      this.positionEl.textContent = lines.join(' · ');
    },

    drawSkeleton(ctx, landmarks, w, h) {
      const pt = (lm) => ({ x: (1 - lm.x) * w, y: lm.y * h });
      const dpr = window.devicePixelRatio || 1;

      ctx.strokeStyle = 'rgba(200, 220, 240, 0.6)';
      ctx.lineWidth = 2 * dpr;
      ctx.lineCap = 'round';
      for (const [a, b] of HAND_CONNECTIONS) {
        const p1 = pt(landmarks[a]);
        const p2 = pt(landmarks[b]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      for (let i = 0; i < landmarks.length; i++) {
        const p = pt(landmarks[i]);
        const r =
          i === 8 ? 5 * dpr : i === 9 ? 6 * dpr : 3 * dpr;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        if (i === 8) ctx.fillStyle = 'rgba(255, 220, 160, 0.95)';
        else if (i === 9) ctx.fillStyle = 'rgba(160, 220, 180, 0.95)';
        else ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }
    },

    drawMainOverlay(ctx, w, h) {
      if (!this.latestHands.length) return;
      for (const landmarks of this.latestHands) {
        const palm = this.toCanvas(landmarks[9], w, h);
        const index = this.toCanvas(landmarks[8], w, h);

        ctx.save();
        ctx.strokeStyle = 'rgba(160, 220, 180, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        ctx.moveTo(palm.x - 20, palm.y);
        ctx.lineTo(palm.x + 20, palm.y);
        ctx.moveTo(palm.x, palm.y - 20);
        ctx.lineTo(palm.x, palm.y + 20);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(palm.x, palm.y, 16, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(160, 220, 180, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(index.x, index.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 220, 160, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 220, 160, 0.65)';
        ctx.stroke();
        ctx.restore();
      }
    },

    drawPreview(video) {
      if (!this.previewCtx || !this.previewCanvas) return;
      const pw = this.previewCanvas.width;
      const ph = this.previewCanvas.height;
      const ctx = this.previewCtx;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, pw, ph);
      ctx.fillStyle = 'rgba(15, 20, 30, 0.85)';
      ctx.fillRect(0, 0, pw, ph);

      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        ctx.save();
        ctx.translate(pw, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, pw, ph);
        ctx.restore();
      }

      if (this.latestHands.length) {
        for (const landmarks of this.latestHands) {
          this.drawSkeleton(ctx, landmarks, pw, ph);
        }
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = `${11 * dpr}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('未检测到手部', pw / 2, ph / 2);
      }
    },
  };

  /* ─── GestureDetector ─── */
  const GestureDetector = {
    history: [],
    maxHistory: 15,
    lastTrigger: {},
    handPresentSince: null,
    lastPinchY: null,
    lastWristX: null,
    handsDistanceHistory: [],

    reset() {
      this.history = [];
      this.lastTrigger = {};
      this.handPresentSince = null;
      this.lastPinchY = null;
      this.lastWristX = null;
      this.handsDistanceHistory = [];
    },

    dist(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    },

    isFingerExtended(landmarks, tipIdx, pipIdx) {
      return landmarks[tipIdx].y < landmarks[pipIdx].y;
    },

    isFist(landmarks) {
      const palm = landmarks[9];
      const tips = [8, 12, 16, 20];
      const mcp = [5, 9, 13, 17];
      let curled = 0;
      for (let i = 0; i < tips.length; i++) {
        if (this.dist(landmarks[tips[i]], palm) < this.dist(landmarks[mcp[i]], palm) * 1.1) {
          curled++;
        }
      }
      return curled >= 3;
    },

    isPointing(landmarks) {
      const indexExt = this.isFingerExtended(landmarks, 8, 6);
      const middleCur = !this.isFingerExtended(landmarks, 12, 10);
      const ringCur = !this.isFingerExtended(landmarks, 16, 14);
      return indexExt && middleCur && ringCur;
    },

    isOpenPalm(landmarks) {
      return (
        this.isFingerExtended(landmarks, 8, 6) &&
        this.isFingerExtended(landmarks, 12, 10) &&
        this.isFingerExtended(landmarks, 16, 14) &&
        this.isFingerExtended(landmarks, 20, 18)
      );
    },

    canTrigger(name) {
      const last = this.lastTrigger[name] || 0;
      const cd = COOLDOWN[name] || 1000;
      if (Date.now() - last < cd) return false;
      this.lastTrigger[name] = Date.now();
      return true;
    },

    landmarkToCanvas(lm, w, h) {
      return { x: (1 - lm.x) * w, y: lm.y * h };
    },

    process(results, canvasW, canvasH) {
      const hands = results.multiHandLandmarks || [];
      const now = Date.now();

      if (hands.length === 0) {
        this.handPresentSince = null;
        HandTracker.setHands([]);
        return;
      }

      if (!this.handPresentSince) {
        this.handPresentSince = now;
        if (now - (this.lastTrigger.handAppear || 0) > COOLDOWN.handAppear) {
          if (this.canTrigger('handAppear')) {
            WeatherFSM.handleGesture('handAppear');
          }
        }
      }

      const primary = hands[0];
      const wrist = primary[0];
      const palm = primary[9];

      this.history.push({ wristY: wrist.y, wristX: wrist.x, t: now });
      if (this.history.length > this.maxHistory) this.history.shift();

      if (this.isFist(primary) && this.canTrigger('fist')) {
        WeatherFSM.handleGesture('fist');
      }

      if (this.isPointing(primary)) {
        const tip = this.landmarkToCanvas(primary[8], canvasW, canvasH);
        const prevY = this.lastPinchY;
        this.lastPinchY = primary[8].y;
        if (prevY != null && Math.abs(primary[8].y - prevY) < 0.008) {
          if (this.canTrigger('tap')) {
            WeatherFSM.handleGesture('tap', tip);
          }
        }
      }

      if (this.lastWristX != null) {
        const dx = Math.abs(wrist.x - this.lastWristX);
        const dt = 33;
        const speed = dx / dt * 1000;
        if (speed > 0.8 && this.canTrigger('wave')) {
          WeatherFSM.handleGesture('wave', { speed });
        }
      }
      this.lastWristX = wrist.x;

      if (this.history.length >= 8) {
        const old = this.history[0];
        const dy = old.wristY - wrist.y;
        if (dy > 0.12 && this.canTrigger('rise')) {
          WeatherFSM.handleGesture('rise');
        }
      }

      if (hands.length >= 2) {
        const palm0 = hands[0][9];
        const palm1 = hands[1][9];
        const d = this.dist(palm0, palm1);
        this.handsDistanceHistory.push(d);
        if (this.handsDistanceHistory.length > 10) this.handsDistanceHistory.shift();

        const open0 = this.isOpenPalm(hands[0]);
        const open1 = this.isOpenPalm(hands[1]);
        const avgY = (palm0.y + palm1.y) / 2;

        if (open0 && open1 && this.handsDistanceHistory.length >= 5) {
          const first = this.handsDistanceHistory[0];
          const last = this.handsDistanceHistory[this.handsDistanceHistory.length - 1];
          if (last - first > 0.08 && this.canTrigger('handsOpen')) {
            WeatherFSM.handleGesture('handsOpen');
          }
        }

        if (d < 0.15 && avgY > 0.35 && avgY < 0.75 && this.canTrigger('handsHug')) {
          WeatherFSM.handleGesture('handsHug');
        }
      }

      HandTracker.setHands(hands);

      if (DEBUG) {
        this.drawDebug(results, canvasW, canvasH);
      }
    },

    drawDebug(results, w, h) {
      const ctx = WeatherCanvas.ctx;
      if (!ctx) return;
      for (const landmarks of results.multiHandLandmarks || []) {
        for (const lm of landmarks) {
          const p = this.landmarkToCanvas(lm, w, h);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,100,100,0.6)';
          ctx.fill();
        }
      }
    },
  };

  /* ─── CameraHands ─── */
  const CameraHands = {
    video: null,
    hands: null,
    camera: null,
    stream: null,
    running: false,

    async requestPermission() {
      this.video = document.getElementById('camera-video');
      const statusEl = document.getElementById('camera-status');
      const statusText = statusEl?.querySelector('.status-text');
      const statusDot = statusEl?.querySelector('.status-dot');
      const errorEl = document.getElementById('camera-error');
      const enterBtn = document.getElementById('btn-enter');

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false,
        });
        this.video.srcObject = this.stream;
        await this.video.play();

        if (statusDot) statusDot.classList.add('ready');
        if (statusText) statusText.textContent = '摄像头已就绪';
        if (errorEl) errorEl.classList.add('hidden');
        if (enterBtn) enterBtn.disabled = false;

        await this.initHands();
        return true;
      } catch (err) {
        if (statusDot) statusDot.classList.add('error');
        if (statusText) statusText.textContent = '摄像头未授权';
        if (errorEl) {
          errorEl.classList.remove('hidden');
          errorEl.textContent =
            '无法访问摄像头。请在浏览器中允许权限，并通过 localhost 或 HTTPS 打开本页面，然后刷新重试。';
        }
        if (enterBtn) enterBtn.disabled = true;
        return false;
      }
    },

    async initHands() {
      if (typeof Hands === 'undefined') {
        console.warn('MediaPipe Hands not loaded');
        return;
      }

      this.hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      this.hands.onResults((results) => {
        if (!this.running) return;
        GestureDetector.process(results, WeatherCanvas.w, WeatherCanvas.h);
      });
    },

    async startDetection() {
      if (!this.hands || !this.video) return;
      this.running = true;

      const detect = async () => {
        if (!this.running) return;
        if (this.video.readyState >= 2) {
          await this.hands.send({ image: this.video });
        }
        setTimeout(detect, 50);
      };
      detect();
    },

    stopDetection() {
      this.running = false;
    },

    stopStream() {
      this.stopDetection();
      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
        this.stream = null;
      }
    },
  };

  /* ─── Narrative ─── */
  const Narrative = {
    lineEl: null,
    currentTween: null,
    lines: {
      idle: '今天，你的心里是什么天气？',
      mist: '不用急着变好。先看见它。',
      rain: '有些情绪，落下来才会轻一点。',
      storm: '你可以承认：我现在确实很乱。',
      clearing: '情绪不会永远停在同一个天气里。',
      sunset: '当云散开，秦淮河边的光会慢慢回来。',
    },

    init() {
      this.lineEl = document.getElementById('poetic-line');
    },

    showForState(state) {
      const text = this.lines[state];
      if (!text || !this.lineEl) return;

      if (this.currentTween) this.currentTween.kill();

      gsap.set(this.lineEl, { opacity: 0 });
      this.lineEl.textContent = text;

      this.currentTween = gsap.timeline();
      this.currentTween
        .to(this.lineEl, { opacity: 1, duration: 1.2, ease: 'power2.out' })
        .to(this.lineEl, { opacity: 0, duration: 1, ease: 'power2.in', delay: 4.5 });
    },
  };

  /* ─── ReportBuilder ─── */
  const ReportBuilder = {
    fill() {
      SessionMetrics.finalize();
      document.getElementById('report-weather').textContent = SessionMetrics.getWeatherSummary();
      document.getElementById('report-concentration').textContent =
        SessionMetrics.getConcentration() + '%';
      document.getElementById('report-wind').textContent = SessionMetrics.getWindLabel();
      document.getElementById('report-visibility').textContent = SessionMetrics.getVisibility();
      document.getElementById('report-quote').textContent = SessionMetrics.getQuote();
    },

    async saveCard() {
      const card = document.getElementById('report-card');
      if (!card || typeof html2canvas === 'undefined') {
        alert('请对报告卡片截图保存');
        return;
      }
      try {
        const canvas = await html2canvas(card, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
        });
        const link = document.createElement('a');
        link.download = '南京慢游情绪天气-' + new Date().toISOString().slice(0, 10) + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch {
        alert('保存失败，请手动截图');
      }
    },
  };

  /* ─── App ─── */
  const App = {
    currentView: 'hero',
    experienceStarted: false,
    metricsInterval: null,

    init() {
      Narrative.init();
      HandTracker.init();
      WeatherCanvas.init(document.getElementById('weather-canvas'));

      WeatherFSM.onChange = (next) => {
        this.updateHUD(next);
        Narrative.showForState(next);
        if (next === STATES.sunset) {
          document.getElementById('btn-finish')?.classList.remove('hidden');
        }
      };

      document.getElementById('btn-start')?.addEventListener('click', () => {
        this.switchView('guide');
        CameraHands.requestPermission();
      });

      document.getElementById('btn-enter')?.addEventListener('click', () => {
        this.startExperience();
      });

      document.getElementById('btn-finish')?.addEventListener('click', () => {
        this.showReport();
      });

      document.getElementById('btn-save')?.addEventListener('click', () => {
        ReportBuilder.saveCard();
      });

      document.getElementById('btn-restart')?.addEventListener('click', () => {
        this.restart();
      });
    },

    switchView(name) {
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      document.getElementById('view-' + name)?.classList.add('active');
      this.currentView = name;

      if (name === 'hero' || name === 'guide') {
        gsap.fromTo(
          `#view-${name} .hero-content, #view-${name} .guide-content`,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
        );
      }
    },

    startExperience() {
      if (this.experienceStarted) return;
      this.experienceStarted = true;

      SessionMetrics.reset();
      GestureDetector.reset();
      WeatherFSM.reset();

      this.switchView('experience');
      HandTracker.resizePreview();
      WeatherCanvas.startLoop();
      CameraHands.startDetection();

      document.getElementById('btn-finish')?.classList.add('hidden');
      document.getElementById('hud-camera')?.classList.add('ready');

      this.updateHUD(STATES.idle);
      Narrative.showForState(STATES.idle);

      let lastMetrics = performance.now();
      this.metricsInterval = setInterval(() => {
        const now = performance.now();
        const dt = now - lastMetrics;
        lastMetrics = now;
        SessionMetrics.recordState(WeatherFSM.getState(), dt);
        this.updateConcentration();
      }, 200);
    },

    updateHUD(state) {
      const el = document.getElementById('hud-weather');
      if (el) el.textContent = STATE_LABELS[state] || state;
    },

    updateConcentration() {
      const val = SessionMetrics.getConcentration();
      const fill = document.getElementById('hud-concentration');
      const label = document.getElementById('hud-concentration-val');
      if (fill) fill.style.width = val + '%';
      if (label) label.textContent = val + '%';
    },

    showReport() {
      WeatherFSM.clearAutoTimer();
      CameraHands.stopDetection();
      WeatherCanvas.stopLoop();

      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      ReportBuilder.fill();
      this.switchView('report');

      gsap.fromTo(
        '#report-card',
        { opacity: 0, y: 30, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power2.out' }
      );
    },

    restart() {
      this.experienceStarted = false;
      WeatherFSM.clearAutoTimer();
      CameraHands.stopStream();
      WeatherCanvas.stopLoop();
      if (this.metricsInterval) clearInterval(this.metricsInterval);

      SessionMetrics.reset();
      GestureDetector.reset();
      WeatherFSM.reset();
      WeatherCanvas.setState(STATES.idle);

      document.getElementById('btn-enter').disabled = true;
      const statusDot = document.getElementById('camera-status')?.querySelector('.status-dot');
      const statusText = document.getElementById('camera-status')?.querySelector('.status-text');
      if (statusDot) statusDot.classList.remove('ready', 'error');
      if (statusText) statusText.textContent = '正在请求摄像头权限…';
      document.getElementById('camera-error')?.classList.add('hidden');

      this.switchView('hero');
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})();
