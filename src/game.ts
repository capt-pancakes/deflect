import type { Signal, Deflector, Port, Vec2, SignalColor, GameState, GameMode, GameConfig } from './types';
import { COLORS, COLOR_GLOW, SIGNAL_COLORS, DEFAULT_CONFIG } from './types';
import { vec2, add, sub, scale, normalize, reflect, dist, length, fromAngle, pointToSegmentDist, segmentNormal, lerp, clamp, seededRng, dailySeed, angleOf } from './math';
import { ParticleSystem } from './particles';
import { InputHandler } from './input';
import { audio } from './audio';
import { generateScoreCard, shareScore } from './share';

/** roundRect polyfill for Safari < 15.4 */
function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

/** Parse hex color to rgb components */
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

interface FloatingText {
  text: string;
  pos: Vec2;
  color: string;
  life: number;
  maxLife: number;
}

interface NearMissRing {
  life: number;
  radius: number;
}

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: InputHandler;
  particles: ParticleSystem;

  // Screen
  width = 0;
  height = 0;
  centerX = 0;
  centerY = 0;
  arenaRadius = 0;
  dpr = 1;

  // Game state
  state: GameState = 'menu';
  mode: GameMode = 'arcade';
  config: GameConfig = { ...DEFAULT_CONFIG };

  // Entities
  signals: Signal[] = [];
  deflectors: Deflector[] = [];
  ports: Port[] = [];
  floatingTexts: FloatingText[] = [];
  nearMissRings: NearMissRing[] = [];

  // Tutorial
  tutorialPhase = 0; // 0=not started, 1=waiting for swipe, 2=signal deflected, 3=done
  tutorialTimer = 0;
  ghostSwipeAnim = 0;
  hasPlayedBefore = false;

  // Core
  coreHP = 5;
  coreMaxHP = 5;
  corePulse = 0;
  coreDamageFlash = 0;

  // Scoring
  score = 0;
  combo = 0;
  maxCombo = 0;
  catches = 0;
  misses = 0;
  displayScore = 0;
  colorMisses: Record<string, number> = {};

  // Timing
  elapsed = 0;
  spawnTimer = 0;
  nextId = 0;

  // Difficulty
  activeColors = 1;
  signalSpeed = 120;
  spawnInterval = 2.0;
  prevColorCount = 0;

  // Screen shake
  shakeIntensity = 0;
  shakeX = 0;
  shakeY = 0;

  // Slow motion for near-miss moments
  timeScale = 1;
  timeScaleTarget = 1;

  // High scores
  highScore = 0;
  dailyBest = 0;
  dailySeedValue = 0;

  // RNG
  rng: () => number = Math.random;

  // Animation
  animTime = 0;
  menuPulse = 0;

  // Deflector cooldown
  lastDeflectorTime = 0;
  nearMissTimeout: ReturnType<typeof setTimeout> | null = null;
  DEFLECTOR_COOLDOWN = 0.2; // 200ms minimum between deflectors

  // Constants
  AIM_ASSIST_STRENGTH = 0.2;  // Reduced: bounces bias toward matching port
  COLLISION_BUFFER = 8;       // Extra hitbox radius on deflectors
  NEAR_MISS_THRESHOLD = 50;   // Distance for near-miss detection
  PORT_MAGNETISM = 0.25;      // Reduced: How strongly ports pull matching signals
  BOUNCE_LIFE_COST = 0.4;     // Deflectors lose 40% of remaining life per bounce

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.input = new InputHandler(canvas);
    this.particles = new ParticleSystem();

    this.loadHighScores();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.arenaRadius = Math.min(this.width, this.height) * 0.42;

    this.input.updateScale(this.width, this.height);
    if (this.state === 'playing') {
      this.setupPorts();
    }
  }

  setupPorts() {
    const count = Math.min(this.activeColors, 4);
    if (this.ports.length === count) return; // No change needed

    this.ports = [];
    const sliceAngle = (Math.PI * 2) / count;
    const portAngle = sliceAngle * 0.7; // Ports cover 70% of slice (bigger = more forgiving)

    for (let i = 0; i < count; i++) {
      const centerAngle = -Math.PI / 2 + i * sliceAngle;
      this.ports.push({
        angleStart: centerAngle - portAngle / 2,
        angleEnd: centerAngle + portAngle / 2,
        color: SIGNAL_COLORS[i],
        pulsePhase: Math.random() * Math.PI * 2,
        catchCount: 0,
      });
    }
  }

  startGame(mode: GameMode) {
    this.mode = mode;
    this.state = 'playing';
    this.config = { ...DEFAULT_CONFIG };

    this.signals = [];
    this.deflectors = [];
    this.floatingTexts = [];
    this.nearMissRings = [];
    this.particles.clear();

    this.coreHP = mode === 'zen' ? Infinity : this.config.coreHP;
    this.coreMaxHP = this.config.coreHP;
    this.corePulse = 0;
    this.coreDamageFlash = 0;

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.catches = 0;
    this.misses = 0;
    this.displayScore = 0;
    this.colorMisses = {};

    this.elapsed = 0;
    this.spawnTimer = 0;
    this.nextId = 0;
    this.shakeIntensity = 0;
    this.timeScale = 1;
    this.timeScaleTarget = 1;
    if (this.nearMissTimeout !== null) { clearTimeout(this.nearMissTimeout); this.nearMissTimeout = null; }
    this.prevColorCount = 0;

    this.activeColors = 1;
    this.signalSpeed = this.config.signalSpeed;
    this.spawnInterval = 2.0;

    // Tutorial for first-time players
    if (!this.hasPlayedBefore) {
      this.tutorialPhase = 1;
      this.tutorialTimer = 0;
      this.ghostSwipeAnim = 0;
    } else {
      this.tutorialPhase = 3; // Skip tutorial
    }

    if (mode === 'daily') {
      this.dailySeedValue = dailySeed();
      this.rng = seededRng(this.dailySeedValue);
    } else {
      this.rng = Math.random;
    }

    this.ports = [];
    this.setupPorts();
    audio.start();

    // Spawn first signal for tutorial
    if (this.tutorialPhase === 1) {
      this.spawnTutorialSignal();
    }
  }

  spawnTutorialSignal() {
    // Spawn a slow signal from top, aimed at center
    const pos = vec2(this.centerX, this.centerY - this.arenaRadius - 30);
    const vel = vec2(0, 60); // Very slow, straight down
    this.signals.push({
      id: this.nextId++,
      pos,
      vel,
      color: 'red',
      radius: this.config.signalRadius + 2, // Slightly bigger for tutorial
      trail: [],
      alive: true,
      age: 0,
      enteredArena: false,
      deflected: false,
    });
  }

  update(dt: number) {
    this.animTime += dt;
    this.menuPulse += dt;

    if (this.state === 'menu') {
      this.updateMenu(dt);
      return;
    }

    if (this.state === 'gameover') {
      this.updateGameOver(dt);
      return;
    }

    // Apply time scale (slow-mo for near-miss)
    this.timeScale = lerp(this.timeScale, this.timeScaleTarget, dt * 8);
    if (Math.abs(this.timeScale - this.timeScaleTarget) < 0.01) {
      this.timeScale = this.timeScaleTarget;
    }
    const scaledDt = dt * this.timeScale;

    // Tutorial logic
    if (this.tutorialPhase < 3) {
      this.updateTutorial(scaledDt);
      return;
    }

    // Normal gameplay
    this.elapsed += scaledDt;
    this.updateDifficulty();
    this.handleInput();
    this.updateSignals(scaledDt);
    this.updateDeflectors(scaledDt);
    this.checkCollisions();
    this.particles.update(scaledDt);
    this.updateShake(scaledDt);
    this.updateFloatingTexts(scaledDt);
    this.updateNearMissRings(scaledDt);
    this.corePulse += scaledDt * 2;
    this.coreDamageFlash = Math.max(0, this.coreDamageFlash - scaledDt * 3);

    // Smooth score display
    this.displayScore = lerp(this.displayScore, this.score, dt * 10);

    // Spawn signals
    this.spawnTimer -= scaledDt;
    if (this.spawnTimer <= 0) {
      this.spawnSignal();
      this.spawnTimer = this.spawnInterval;
    }
  }

  updateTutorial(dt: number) {
    this.tutorialTimer += dt;
    this.ghostSwipeAnim += dt;
    this.particles.update(dt);
    this.updateDeflectors(dt);
    this.corePulse += dt * 2;

    if (this.tutorialPhase === 1) {
      // Slow the signal way down during tutorial
      for (const s of this.signals) {
        s.pos.x += s.vel.x * dt * 0.5;
        s.pos.y += s.vel.y * dt * 0.5;
        s.trail.push({ x: s.pos.x, y: s.pos.y });
        if (s.trail.length > 12) s.trail.shift();
        if (Math.random() < 0.3) {
          this.particles.trail(s.pos, COLORS[s.color]);
        }
      }

      // Check for swipe
      const swipe = this.input.consumeSwipe();
      if (swipe) {
        this.addDeflector(swipe.start, swipe.end);
        this.tutorialPhase = 2; // Now let collision happen
        this.tutorialTimer = 0;
      }
      this.input.consumeTap(); // Eat taps
    }

    if (this.tutorialPhase === 2) {
      // Let physics run to see the bounce + catch
      this.updateSignals(dt);
      this.checkCollisions();

      // If signal caught or 3 seconds passed, end tutorial
      if (this.signals.length === 0 || this.tutorialTimer > 3) {
        this.tutorialPhase = 3;
        this.hasPlayedBefore = true;
        try { localStorage.setItem('deflect_played', '1'); } catch {}
        // Reset for real game
        this.elapsed = 0;
        this.spawnTimer = 1.5;
      }
    }
  }

  getMenuButtons(): { label: string; mode: GameMode; y: number; color: string }[] {
    const baseY = this.centerY + 60;
    return [
      { label: 'ARCADE', mode: 'arcade', y: baseY, color: '#4488ff' },
      { label: 'ZEN', mode: 'zen', y: baseY + 52, color: '#44ff88' },
      { label: 'DAILY', mode: 'daily', y: baseY + 104, color: '#ffcc44' },
    ];
  }

  updateMenu(dt: number) {
    this.particles.update(dt);
    if (Math.random() < dt * 3) {
      const angle = Math.random() * Math.PI * 2;
      const r = this.arenaRadius * 0.8;
      const pos = vec2(
        this.centerX + Math.cos(angle) * r,
        this.centerY + Math.sin(angle) * r,
      );
      const color = COLORS[SIGNAL_COLORS[Math.floor(Math.random() * 4)]];
      this.particles.trail(pos, color, 2);
    }

    const tapPos = this.input.consumeTapWithPos();
    if (tapPos) {
      audio.init();
      // Check button hits
      const buttons = this.getMenuButtons();
      const btnW = Math.min(this.width * 0.55, 200);
      const btnH = 42;
      for (const btn of buttons) {
        const left = this.centerX - btnW / 2;
        const top = btn.y - btnH / 2;
        if (tapPos.x >= left && tapPos.x <= left + btnW && tapPos.y >= top && tapPos.y <= top + btnH) {
          this.startGame(btn.mode);
          return;
        }
      }
      // Tapped elsewhere - default to arcade
      this.startGame('arcade');
    }

    if (this.input.consumeSwipe()) {
      audio.init();
      this.startGame('arcade');
    }
  }

  shareButtonY = 0;
  shareMessage = '';
  shareMessageTimer = 0;

  updateGameOver(dt: number) {
    this.particles.update(dt);
    this.updateFloatingTexts(dt);
    this.coreDamageFlash = Math.max(0, this.coreDamageFlash - dt * 2);
    if (this.shareMessageTimer > 0) this.shareMessageTimer -= dt;

    const tapPos = this.input.consumeTapWithPos();
    if (tapPos) {
      // Check share button hit
      const btnW = Math.min(this.width * 0.4, 160);
      const btnH = 38;
      const btnX = this.centerX - btnW / 2;
      const btnY = this.shareButtonY - btnH / 2;
      if (tapPos.x >= btnX && tapPos.x <= btnX + btnW && tapPos.y >= btnY && tapPos.y <= btnY + btnH) {
        this.handleShare();
        return;
      }
      this.state = 'menu';
    }
    if (this.input.consumeSwipe()) {
      this.state = 'menu';
    }
  }

  async handleShare() {
    const card = generateScoreCard({
      score: this.score,
      survived: this.elapsed,
      catches: this.catches,
      misses: this.misses,
      maxCombo: this.maxCombo,
      mode: this.mode,
      colorMisses: this.colorMisses,
    });
    const ok = await shareScore(card);
    this.shareMessage = ok ? 'Copied!' : 'Share failed';
    this.shareMessageTimer = 2;
  }

  updateDifficulty() {
    const t = this.elapsed;
    // Zen mode: much slower ramp, caps at 3 colors, gentler speeds
    const zen = this.mode === 'zen';

    if (zen) {
      if (t < 30) {
        this.activeColors = 1;
        this.signalSpeed = 70;
        this.spawnInterval = 3.0;
      } else if (t < 70) {
        this.activeColors = 2;
        this.signalSpeed = 85;
        this.spawnInterval = 2.5;
      } else if (t < 120) {
        this.activeColors = 3;
        this.signalSpeed = 100;
        this.spawnInterval = 2.0;
      } else {
        this.activeColors = 3;
        this.signalSpeed = Math.min(120, 100 + (t - 120) * 0.3);
        this.spawnInterval = Math.max(1.5, 2.0 - (t - 120) * 0.003);
      }
    } else if (t < 15) {
      this.activeColors = 1;
      this.signalSpeed = 90;
      this.spawnInterval = 2.5;
    } else if (t < 35) {
      this.activeColors = 2;
      this.signalSpeed = 110;
      this.spawnInterval = 2.0;
    } else if (t < 60) {
      this.activeColors = 3;
      this.signalSpeed = 130;
      this.spawnInterval = 1.5;
    } else if (t < 90) {
      this.activeColors = 4;
      this.signalSpeed = 155;
      this.spawnInterval = 1.2;
    } else {
      this.activeColors = 4;
      this.signalSpeed = 155 + (t - 90) * 1.2;
      this.spawnInterval = Math.max(0.5, 1.2 - (t - 90) * 0.006);
    }

    // Update ports on color change
    if (this.prevColorCount !== this.activeColors) {
      this.prevColorCount = this.activeColors;
      this.ports = []; // Force rebuild
      this.setupPorts();

      // Flash "NEW COLOR" notification
      if (this.activeColors > 1) {
        const newColor = SIGNAL_COLORS[this.activeColors - 1];
        this.addFloatingText(`+ ${newColor.toUpperCase()}`, vec2(this.centerX, this.height - 100), COLORS[newColor], 2);
      }
    }
  }

  handleInput() {
    const swipe = this.input.consumeSwipe();
    if (swipe) {
      this.addDeflector(swipe.start, swipe.end);
    }
  }

  addDeflector(start: Vec2, end: Vec2) {
    // Cooldown between deflectors (anti-scribble) - uses real time, not scaled
    const now = performance.now() / 1000;
    if (now - this.lastDeflectorTime < this.DEFLECTOR_COOLDOWN) return;
    this.lastDeflectorTime = now;

    if (this.deflectors.length >= this.config.maxDeflectors) {
      this.deflectors.shift();
    }

    const maxLen = this.arenaRadius * 0.8;
    const d = sub(end, start);
    const len = length(d);
    if (len > maxLen) {
      const n = normalize(d);
      end = add(start, scale(n, maxLen));
    }

    this.deflectors.push({
      id: this.nextId++,
      start: { ...start },
      end: { ...end },
      life: this.config.deflectorLife,
      maxLife: this.config.deflectorLife,
      opacity: 1,
    });

    audio.swipe();
  }

  spawnSignal() {
    const colorIdx = Math.floor(this.rng() * this.activeColors);
    const color = SIGNAL_COLORS[colorIdx];

    const angle = this.rng() * Math.PI * 2;
    const spawnR = this.arenaRadius + 30;
    const pos = vec2(
      this.centerX + Math.cos(angle) * spawnR,
      this.centerY + Math.sin(angle) * spawnR,
    );

    const toCenter = normalize(sub(vec2(this.centerX, this.centerY), pos));
    const spread = (this.rng() - 0.5) * 0.4;
    const vel = scale(
      normalize(vec2(toCenter.x + spread * toCenter.y, toCenter.y - spread * toCenter.x)),
      this.signalSpeed,
    );

    this.signals.push({
      id: this.nextId++,
      pos,
      vel,
      color,
      radius: this.config.signalRadius,
      trail: [],
      alive: true,
      age: 0,
      enteredArena: false,
      deflected: false,
    });
  }

  updateSignals(dt: number) {
    const center = vec2(this.centerX, this.centerY);

    for (const s of this.signals) {
      if (!s.alive) continue;
      s.age += dt;

      // Port magnetism: only active after signal has been deflected
      const distFromCenter = dist(s.pos, center);
      if (s.deflected && distFromCenter > this.arenaRadius * 0.6) {
        const signalAngle = Math.atan2(s.pos.y - this.centerY, s.pos.x - this.centerX);
        for (const port of this.ports) {
          if (port.color !== s.color) continue;
          const portMid = (port.angleStart + port.angleEnd) / 2;
          let angleDiff = portMid - signalAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          if (Math.abs(angleDiff) < 0.8) { // Only pull when reasonably close
            const pullStrength = this.PORT_MAGNETISM * (distFromCenter / this.arenaRadius) * dt;
            const tangent = vec2(-Math.sin(signalAngle), Math.cos(signalAngle));
            s.vel.x += tangent.x * angleDiff * pullStrength * this.signalSpeed;
            s.vel.y += tangent.y * angleDiff * pullStrength * this.signalSpeed;
            // Re-normalize speed
            const spd = length(s.vel);
            if (spd > 0) {
              s.vel.x = (s.vel.x / spd) * this.signalSpeed;
              s.vel.y = (s.vel.y / spd) * this.signalSpeed;
            }
          }
        }
      }

      s.trail.push({ x: s.pos.x, y: s.pos.y });
      if (s.trail.length > 12) s.trail.shift();

      s.pos.x += s.vel.x * dt;
      s.pos.y += s.vel.y * dt;

      if (Math.random() < 0.3) {
        this.particles.trail(s.pos, COLORS[s.color]);
      }

      // Track when signal enters the arena (needed so port checks don't fire at spawn)
      const dfc = dist(s.pos, center);
      if (!s.enteredArena && dfc < this.arenaRadius - s.radius) {
        s.enteredArena = true;
      }

      // Kill signals that exit arena without being deflected, or travel too far
      if (!s.deflected && s.enteredArena && dfc > this.arenaRadius + s.radius + 10) {
        s.alive = false; // Undeflected signal passed through - silent cleanup
      } else if (dfc > this.arenaRadius * 2) {
        s.alive = false; // Way out of bounds
      }
    }

    this.signals = this.signals.filter(s => s.alive);
  }

  updateDeflectors(dt: number) {
    for (let i = this.deflectors.length - 1; i >= 0; i--) {
      const d = this.deflectors[i];
      d.life -= dt;
      d.opacity = clamp(d.life / (d.maxLife * 0.3), 0, 1);
      if (d.life <= 0) {
        this.deflectors.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    const center = vec2(this.centerX, this.centerY);

    for (const signal of this.signals) {
      if (!signal.alive) continue;

      // --- Deflector collision (with aim assist + buffer) ---
      for (const deflector of this.deflectors) {
        const d = pointToSegmentDist(signal.pos, deflector.start, deflector.end);
        if (d < signal.radius + this.COLLISION_BUFFER) {
          const normal = segmentNormal(deflector.start, deflector.end);
          const dotProduct = signal.vel.x * normal.x + signal.vel.y * normal.y;
          const effectiveNormal = dotProduct < 0 ? normal : { x: -normal.x, y: -normal.y };

          // Base reflection
          let newVel = reflect(signal.vel, effectiveNormal);

          // AIM ASSIST: Bias bounce toward matching port
          const matchingPort = this.ports.find(p => p.color === signal.color);
          if (matchingPort) {
            const portMid = (matchingPort.angleStart + matchingPort.angleEnd) / 2;
            const portPos = vec2(
              this.centerX + Math.cos(portMid) * this.arenaRadius,
              this.centerY + Math.sin(portMid) * this.arenaRadius,
            );
            const toPort = normalize(sub(portPos, signal.pos));
            const spd = length(newVel);

            // Blend between raw reflection and port-aimed direction
            newVel = normalize(vec2(
              newVel.x + toPort.x * this.AIM_ASSIST_STRENGTH * spd,
              newVel.y + toPort.y * this.AIM_ASSIST_STRENGTH * spd,
            ));
            newVel = scale(newVel, spd);
          }

          signal.vel = newVel;
          signal.pos = add(signal.pos, scale(effectiveNormal, signal.radius + this.COLLISION_BUFFER + 2));

          signal.deflected = true; // Signal can now interact with ports
          this.particles.burst(signal.pos, COLORS[signal.color], 8, 120, 0.3);
          audio.bounce();

          // Deflector decays on impact (anti-scribble: can't reuse forever)
          deflector.life -= deflector.life * this.BOUNCE_LIFE_COST;
          deflector.opacity = 1; // Flash briefly
          break;
        }
      }

      // --- Core collision ---
      const coreD = dist(signal.pos, center);

      // Near-miss detection (close to core but not hitting)
      if (coreD < this.config.coreRadius + this.NEAR_MISS_THRESHOLD && coreD > this.config.coreRadius + signal.radius) {
        // Only trigger once per signal
        if (signal.age > 0.5 && !('nearMissTriggered' in signal)) {
          (signal as any).nearMissTriggered = true;
          this.onNearMiss(signal);
        }
      }

      if (coreD < this.config.coreRadius + signal.radius) {
        signal.alive = false;
        this.onCoreDamage(signal);
        if (this.state !== 'playing') return; // Stop processing after game over
        continue;
      }

      // --- Port collision (only after signal has been deflected by the player) ---
      const distFromCenter = dist(signal.pos, center);
      if (signal.deflected && distFromCenter >= this.arenaRadius - signal.radius - 5) {
        const angle = Math.atan2(signal.pos.y - this.centerY, signal.pos.x - this.centerX);

        let caught = false;
        for (const port of this.ports) {
          if (this.isAngleInPort(angle, port)) {
            signal.alive = false;
            if (port.color === signal.color) {
              this.onCatch(signal, port);
            } else {
              this.onWrongPort(signal, port);
            }
            caught = true;
            break;
          }
        }

        if (!caught && distFromCenter >= this.arenaRadius + signal.radius) {
          signal.alive = false;
          this.onEscape(signal);
        }
      }
    }
  }

  isAngleInPort(angle: number, port: Port): boolean {
    let a = angle;
    while (a < port.angleStart - Math.PI) a += Math.PI * 2;
    while (a > port.angleStart + Math.PI) a -= Math.PI * 2;
    return a >= port.angleStart && a <= port.angleEnd;
  }

  // --- EVENT HANDLERS ---

  onCatch(signal: Signal, port: Port) {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.catches++;

    const points = 10 * this.combo;
    this.score += points;
    port.catchCount++;

    // Juicy feedback
    this.particles.burst(signal.pos, COLORS[signal.color], 25, 280, 0.7);
    this.addFloatingText(`+${points}`, signal.pos, COLORS[signal.color]);

    if (this.combo >= 5) {
      this.addFloatingText(`${this.combo}x!`, vec2(signal.pos.x, signal.pos.y - 25), '#ffcc44');
    }

    audio.catch(Math.min(this.combo - 1, 7));
  }

  onWrongPort(signal: Signal, port: Port) {
    this.combo = 0;
    this.misses++;
    this.colorMisses[signal.color] = (this.colorMisses[signal.color] || 0) + 1;
    this.particles.burst(signal.pos, '#666', 6, 60, 0.3);
    this.addFloatingText('WRONG', signal.pos, '#ff6666', 1);
  }

  onEscape(signal: Signal) {
    this.combo = 0;
    this.misses++;
    this.colorMisses[signal.color] = (this.colorMisses[signal.color] || 0) + 1;
    this.particles.burst(signal.pos, '#444', 4, 40, 0.3);
  }

  onNearMiss(signal: Signal) {
    // Dramatic near-miss feedback
    this.nearMissRings.push({ life: 0.6, radius: this.config.coreRadius + 15 });

    // Brief slow-mo (with cleanup)
    this.timeScaleTarget = 0.3;
    if (this.nearMissTimeout !== null) clearTimeout(this.nearMissTimeout);
    this.nearMissTimeout = setTimeout(() => {
      this.timeScaleTarget = 1;
      this.nearMissTimeout = null;
    }, 200);

    this.addFloatingText('CLOSE!', vec2(this.centerX, this.centerY - this.config.coreRadius - 30), '#ffcc44', 0.8);
  }

  onCoreDamage(signal: Signal) {
    this.coreHP--;
    this.combo = 0;
    this.misses++;
    this.colorMisses[signal.color] = (this.colorMisses[signal.color] || 0) + 1;
    this.coreDamageFlash = 1;
    this.shakeIntensity = 10;

    this.particles.burst(center2(this), '#ff2244', 35, 350, 0.9);
    this.addFloatingText(`-1 HP`, center2(this), '#ff4466', 1.5);

    audio.damage();

    if (this.coreHP <= 0 && this.mode !== 'zen') {
      this.onGameOver();
    }
  }

  onGameOver() {
    this.state = 'gameover';

    for (const color of Object.values(COLORS)) {
      this.particles.burst(center2(this), color, 50, 450, 1.5);
    }

    audio.gameOver();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScores();
    }

    if (this.mode === 'daily' && this.score > this.dailyBest) {
      this.dailyBest = this.score;
      this.saveHighScores();
    }
  }

  addFloatingText(text: string, pos: Vec2, color: string, life: number = 1.2) {
    this.floatingTexts.push({ text, pos: { ...pos }, color, life, maxLife: life });
  }

  updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.pos.y -= 40 * dt; // Float upward
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  updateNearMissRings(dt: number) {
    for (let i = this.nearMissRings.length - 1; i >= 0; i--) {
      this.nearMissRings[i].life -= dt;
      this.nearMissRings[i].radius += 80 * dt;
      if (this.nearMissRings[i].life <= 0) this.nearMissRings.splice(i, 1);
    }
  }

  updateShake(dt: number) {
    if (this.shakeIntensity > 0) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity *= 0.85;
      if (this.shakeIntensity < 0.5) {
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    }
  }

  // ==================== RENDERING ====================

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(-10, -10, this.width + 20, this.height + 20);

    if (this.state === 'menu') {
      this.renderMenu(ctx);
    } else {
      this.renderGame(ctx);
      if (this.state === 'gameover') {
        this.renderGameOver(ctx);
      }
    }

    ctx.restore();
  }

  renderMenu(ctx: CanvasRenderingContext2D) {
    this.renderArenaRing(ctx, 0.2);

    // Decorative ports on menu
    const demoColors: SignalColor[] = ['red', 'blue', 'green', 'yellow'];
    for (let i = 0; i < 4; i++) {
      const angle = -Math.PI / 2 + i * (Math.PI / 2);
      const pulse = Math.sin(this.menuPulse * 2 + i) * 0.15 + 0.85;
      const portAngle = 0.5;
      ctx.strokeStyle = COLOR_GLOW[demoColors[i]];
      ctx.lineWidth = 18 * pulse;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.arenaRadius, angle - portAngle / 2, angle + portAngle / 2);
      ctx.stroke();
      ctx.strokeStyle = COLORS[demoColors[i]];
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.arenaRadius, angle - portAngle / 2, angle + portAngle / 2);
      ctx.stroke();
    }

    this.particles.render(ctx);

    // Title
    const pulse = Math.sin(this.menuPulse * 2) * 0.1 + 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 30 * pulse;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(this.width * 0.14, 72)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillText('DEFLECT', this.centerX, this.centerY - 60);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#8888aa';
    ctx.font = `${Math.min(this.width * 0.04, 18)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillText('Swipe to deflect. Match the colors.', this.centerX, this.centerY + 5);

    // Mode buttons
    const buttons = this.getMenuButtons();
    const btnW = Math.min(this.width * 0.55, 200);
    const btnH = 42;
    for (const btn of buttons) {
      // Button bg
      ctx.fillStyle = `${btn.color}18`;
      ctx.strokeStyle = `${btn.color}66`;
      ctx.lineWidth = 1.5;
      const r = 8;
      const x = this.centerX - btnW / 2;
      const y = btn.y - btnH / 2;
      drawRoundRect(ctx, x, y, btnW, btnH, r);
      ctx.fill();
      ctx.stroke();

      // Button label
      ctx.fillStyle = btn.color;
      ctx.font = `bold ${Math.min(this.width * 0.045, 20)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillText(btn.label, this.centerX, btn.y);

      // Sub-label
      ctx.fillStyle = `${btn.color}88`;
      ctx.font = `${Math.min(this.width * 0.028, 11)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      if (btn.mode === 'arcade') ctx.fillText('Survive as long as you can', this.centerX, btn.y + 16);
      if (btn.mode === 'zen') ctx.fillText('No damage, pure flow', this.centerX, btn.y + 16);
      if (btn.mode === 'daily') ctx.fillText('Same pattern for everyone', this.centerX, btn.y + 16);
    }

    // High score
    if (this.highScore > 0) {
      ctx.fillStyle = '#ffcc44';
      ctx.font = `${Math.min(this.width * 0.035, 14)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillText(`BEST: ${this.highScore}`, this.centerX, this.centerY + 180);
    }
  }

  renderArenaRing(ctx: CanvasRenderingContext2D, alpha: number) {
    ctx.strokeStyle = `rgba(60, 60, 100, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.arenaRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  renderGame(ctx: CanvasRenderingContext2D) {
    this.renderArenaRing(ctx, 0.12);
    this.renderPorts(ctx);
    this.renderNearMissRings(ctx);
    this.renderCore(ctx);
    this.renderDeflectors(ctx);

    // Active swipe preview
    const activeSwipe = this.input.getActiveSwipe();
    if (activeSwipe) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(activeSwipe.start.x, activeSwipe.start.y);
      ctx.lineTo(activeSwipe.end.x, activeSwipe.end.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.renderSignals(ctx);
    this.particles.render(ctx);
    this.renderFloatingTexts(ctx);

    // Tutorial overlay
    if (this.tutorialPhase < 3) {
      this.renderTutorial(ctx);
    }

    this.renderHUD(ctx);
  }

  renderTutorial(ctx: CanvasRenderingContext2D) {
    if (this.tutorialPhase !== 1) return;

    // Ghost swipe animation
    const t = (this.ghostSwipeAnim % 2) / 2; // 0 to 1 over 2 seconds
    if (t < 0.6) {
      const progress = t / 0.6;
      const startX = this.centerX - 60;
      const startY = this.centerY + 40;
      const endX = this.centerX + 60;
      const endY = this.centerY - 20;

      const currentX = lerp(startX, endX, progress);
      const currentY = lerp(startY, endY, progress);

      // Ghost finger trail
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * (1 - progress * 0.5)})`;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      // Ghost finger
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4})`;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // "SWIPE!" hint
    const hintAlpha = Math.sin(this.ghostSwipeAnim * 4) * 0.3 + 0.7;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255, 255, 255, ${hintAlpha})`;
    ctx.font = `bold ${Math.min(this.width * 0.06, 28)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillText('SWIPE TO DEFLECT!', this.centerX, this.height - 100);
  }

  renderPorts(ctx: CanvasRenderingContext2D) {
    for (const port of this.ports) {
      const color = COLORS[port.color];
      const glow = COLOR_GLOW[port.color];

      // Check if any matching signal is heading toward this port (hungry indicator)
      let isHungry = false;
      for (const s of this.signals) {
        if (s.color === port.color && s.alive) {
          isHungry = true;
          break;
        }
      }

      const pulse = isHungry
        ? Math.sin(this.animTime * 6 + port.pulsePhase) * 0.25 + 0.95
        : Math.sin(this.animTime * 2 + port.pulsePhase) * 0.1 + 0.9;

      // Outer glow (bigger when hungry)
      ctx.strokeStyle = glow;
      ctx.lineWidth = (isHungry ? 28 : 18) * pulse;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.arenaRadius, port.angleStart, port.angleEnd);
      ctx.stroke();

      // Core port line
      ctx.strokeStyle = color;
      ctx.lineWidth = isHungry ? 8 : 5;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.arenaRadius, port.angleStart, port.angleEnd);
      ctx.stroke();

      // Port icon (colored circle with label outside arena)
      const midAngle = (port.angleStart + port.angleEnd) / 2;
      const labelR = this.arenaRadius + 22;
      const lx = this.centerX + Math.cos(midAngle) * labelR;
      const ly = this.centerY + Math.sin(midAngle) * labelR;

      // Icon circle
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isHungry ? 12 : 6;
      ctx.beginPath();
      ctx.arc(lx, ly, isHungry ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner arrows pointing inward (showing where signals should go)
      const arrowR = this.arenaRadius - 15;
      for (let a = port.angleStart + 0.15; a < port.angleEnd - 0.1; a += 0.3) {
        const ax = this.centerX + Math.cos(a) * arrowR;
        const ay = this.centerY + Math.sin(a) * arrowR;
        const inward = normalize(sub(vec2(this.centerX, this.centerY), vec2(ax, ay)));
        ctx.strokeStyle = `${color}44`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax - inward.x * 8, ay - inward.y * 8);
        ctx.lineTo(ax + inward.x * 8, ay + inward.y * 8);
        ctx.stroke();
      }
    }
  }

  renderNearMissRings(ctx: CanvasRenderingContext2D) {
    for (const ring of this.nearMissRings) {
      const alpha = ring.life / 0.6;
      ctx.strokeStyle = `rgba(255, 204, 68, ${alpha * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderCore(ctx: CanvasRenderingContext2D) {
    const r = this.config.coreRadius;
    const pulse = Math.sin(this.corePulse) * 2;

    // Damage flash ring
    if (this.coreDamageFlash > 0) {
      ctx.fillStyle = `rgba(255, 34, 68, ${this.coreDamageFlash * 0.3})`;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, r + 25, 0, Math.PI * 2);
      ctx.fill();
    }

    const hpRatio = this.mode === 'zen' ? 1 : this.coreHP / this.coreMaxHP;
    const glowColor = hpRatio > 0.5 ? '#4488ff' : hpRatio > 0.2 ? '#ffcc44' : '#ff4466';

    // Danger ring pulsing when low HP
    if (hpRatio <= 0.4 && hpRatio > 0) {
      const dangerPulse = Math.sin(this.animTime * 8) * 0.3 + 0.3;
      ctx.strokeStyle = `rgba(255, 68, 102, ${dangerPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, r + 15 + Math.sin(this.animTime * 4) * 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Core glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15 + pulse;

    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, r + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // HP pips
    if (this.mode !== 'zen') {
      const dotSpacing = 12;
      const startX = this.centerX - ((this.coreMaxHP - 1) * dotSpacing) / 2;
      for (let i = 0; i < this.coreMaxHP; i++) {
        const active = i < this.coreHP;
        ctx.fillStyle = active ? glowColor : '#333';
        if (active) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 4;
        }
        ctx.beginPath();
        ctx.arc(startX + i * dotSpacing, this.centerY, active ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else {
      // Zen mode: infinity symbol
      ctx.fillStyle = '#44ff8888';
      ctx.font = `bold 16px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u221e', this.centerX, this.centerY);
    }
  }

  renderDeflectors(ctx: CanvasRenderingContext2D) {
    for (const d of this.deflectors) {
      const alpha = d.opacity;
      const lifeRatio = d.life / d.maxLife;

      // Life indicator: color shifts from white to dim as it fades
      const r = Math.round(255 * alpha);
      const g = Math.round(255 * alpha * lifeRatio);
      const b = Math.round(255 * alpha);

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';

      ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.shadowBlur = 10 * alpha;

      ctx.beginPath();
      ctx.moveTo(d.start.x, d.start.y);
      ctx.lineTo(d.end.x, d.end.y);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // End caps
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(d.start.x, d.start.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(d.end.x, d.end.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderSignals(ctx: CanvasRenderingContext2D) {
    for (const s of this.signals) {
      if (!s.alive) continue;
      const color = COLORS[s.color];

      // Trail with gradient opacity
      if (s.trail.length > 1) {
        for (let i = 1; i < s.trail.length; i++) {
          const alpha = (i / s.trail.length) * 0.5;
          const [cr, cg, cb] = hexToRgb(color);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.lineWidth = s.radius * (0.5 + (i / s.trail.length));
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.trail[i - 1].x, s.trail[i - 1].y);
          ctx.lineTo(s.trail[i].x, s.trail[i].y);
          ctx.stroke();
        }
      }

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;

      // Signal body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.pos.x, s.pos.y, s.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(s.pos.x - s.radius * 0.25, s.pos.y - s.radius * 0.25, s.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Direction indicator (small line showing where it's heading)
      const dir = normalize(s.vel);
      ctx.strokeStyle = `${color}66`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.pos.x + dir.x * s.radius, s.pos.y + dir.y * s.radius);
      ctx.lineTo(s.pos.x + dir.x * (s.radius + 12), s.pos.y + dir.y * (s.radius + 12));
      ctx.stroke();
    }
  }

  renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const ft of this.floatingTexts) {
      const alpha = ft.life / ft.maxLife;
      const scale = 0.8 + (1 - alpha) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(16 * scale)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillText(ft.text, ft.pos.x, ft.pos.y);
    }
    ctx.globalAlpha = 1;
  }

  renderHUD(ctx: CanvasRenderingContext2D) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Score
    const scoreSize = Math.min(this.width * 0.08, 36);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${scoreSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillText(`${Math.round(this.displayScore)}`, this.centerX, 20);

    // Combo
    if (this.combo > 1) {
      const comboAlpha = Math.min(1, this.combo / 5);
      const comboSize = Math.min(this.width * 0.045, 20) + Math.min(this.combo, 10) * 0.8;
      ctx.fillStyle = `rgba(255, 204, 68, ${comboAlpha})`;
      ctx.font = `bold ${comboSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillText(`${this.combo}x COMBO`, this.centerX, 20 + scoreSize + 4);
    }

    // Timer (top left)
    const secs = Math.floor(this.elapsed);
    ctx.fillStyle = '#555';
    ctx.font = `${Math.min(this.width * 0.035, 14)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`${secs}s`, 15, 20);

    // Mode indicator (top right)
    ctx.textAlign = 'right';
    if (this.mode === 'zen') {
      ctx.fillStyle = '#44ff88';
      ctx.fillText('ZEN', this.width - 15, 20);
    } else if (this.mode === 'daily') {
      ctx.fillStyle = '#ffcc44';
      ctx.fillText('DAILY', this.width - 15, 20);
    }

    // Slow-mo indicator
    if (this.timeScale < 0.8) {
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255, 204, 68, ${(1 - this.timeScale) * 0.8})`;
      ctx.font = `bold ${Math.min(this.width * 0.03, 12)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillText('CLOSE CALL', this.centerX, this.height - 40);
    }
  }

  renderGameOver(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isNewHigh = this.score > this.highScore && this.score > 0;
    const font = (size: number, bold = false) =>
      `${bold ? 'bold ' : ''}${Math.min(this.width * size, size * 500)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

    // "CORE BREACH"
    ctx.fillStyle = '#ff4466';
    ctx.font = font(0.09, true);
    ctx.fillText('CORE BREACH', this.centerX, this.centerY - 120);

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = font(0.16, true);
    ctx.fillText(`${this.score}`, this.centerX, this.centerY - 40);

    if (isNewHigh) {
      ctx.fillStyle = '#ffcc44';
      ctx.font = font(0.04, true);
      ctx.fillText('NEW HIGH SCORE!', this.centerX, this.centerY + 10);
    }

    // Stats
    let y = this.centerY + 50;
    ctx.fillStyle = '#8888aa';
    ctx.font = font(0.035);

    ctx.fillText(`${Math.floor(this.elapsed)}s survived  |  ${this.catches} catches  |  ${this.maxCombo}x best combo`, this.centerX, y);
    y += 28;

    const total = this.catches + this.misses;
    const accuracy = total > 0 ? Math.round((this.catches / total) * 100) : 0;
    ctx.fillText(`${accuracy}% accuracy`, this.centerX, y);
    y += 35;

    // Post-run coaching
    const worstColor = this.getWorstColor();
    if (worstColor) {
      ctx.fillStyle = COLORS[worstColor as SignalColor] || '#888';
      ctx.font = font(0.035, true);
      ctx.fillText(`Most leaked: ${worstColor.toUpperCase()} (${this.colorMisses[worstColor]})`, this.centerX, y);
      y += 28;
    }

    // Next goal
    ctx.fillStyle = '#6688aa';
    ctx.font = font(0.032);
    if (this.maxCombo < 5) {
      ctx.fillText('Goal: Reach a 5x combo streak!', this.centerX, y);
    } else if (this.maxCombo < 10) {
      ctx.fillText(`Goal: Reach a 10x combo! (best: ${this.maxCombo}x)`, this.centerX, y);
    } else {
      ctx.fillText(`Goal: Survive ${Math.ceil(this.elapsed / 10) * 10 + 10}s (survived: ${Math.floor(this.elapsed)}s)`, this.centerX, y);
    }

    // Share button
    y += 35;
    this.shareButtonY = y;
    const shareBtnW = Math.min(this.width * 0.4, 160);
    const shareBtnH = 38;
    ctx.fillStyle = '#4488ff22';
    ctx.strokeStyle = '#4488ff66';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, this.centerX - shareBtnW / 2, y - shareBtnH / 2, shareBtnW, shareBtnH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4488ff';
    ctx.font = font(0.038, true);
    ctx.fillText('SHARE SCORE', this.centerX, y);

    // Share feedback message
    if (this.shareMessageTimer > 0) {
      ctx.fillStyle = `rgba(68, 255, 136, ${Math.min(1, this.shareMessageTimer)})`;
      ctx.font = font(0.032);
      ctx.fillText(this.shareMessage, this.centerX, y + 30);
    }

    // Tap to continue
    const tapAlpha = Math.sin(this.animTime * 3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${tapAlpha})`;
    ctx.font = font(0.035);
    ctx.fillText('TAP TO CONTINUE', this.centerX, this.height - 60);
  }

  getWorstColor(): string | null {
    let worst: string | null = null;
    let worstCount = 0;
    for (const [color, count] of Object.entries(this.colorMisses)) {
      if (count > worstCount) {
        worst = color;
        worstCount = count;
      }
    }
    return worst;
  }

  // --- PERSISTENCE ---

  loadHighScores() {
    try {
      this.highScore = parseInt(localStorage.getItem('deflect_high') || '0', 10);
      this.hasPlayedBefore = localStorage.getItem('deflect_played') === '1';
      const dailyData = localStorage.getItem('deflect_daily');
      if (dailyData) {
        const d = JSON.parse(dailyData);
        if (d.seed === dailySeed()) {
          this.dailyBest = d.score;
        }
      }
    } catch {}
  }

  saveHighScores() {
    try {
      localStorage.setItem('deflect_high', String(this.highScore));
      if (this.mode === 'daily') {
        localStorage.setItem('deflect_daily', JSON.stringify({
          seed: this.dailySeedValue,
          score: this.dailyBest,
        }));
      }
    } catch {}
  }
}

function center2(game: Game): Vec2 {
  return vec2(game.centerX, game.centerY);
}
