import type {
  Signal,
  Deflector,
  Port,
  Vec2,
  GameState,
  GameMode,
  GameConfig,
  FloatingText,
  NearMissRing,
} from './types';
import { COLORS, SIGNAL_COLORS, DEFAULT_CONFIG } from './types';
import {
  vec2,
  add,
  sub,
  scale,
  scaleMut,
  normalize,
  normalizeMut,
  dist,
  length,
  lerp,
  clamp,
  seededRng,
  dailySeed,
} from './math';
import { ParticleSystem } from './particles';
import { InputHandler } from './input';
import { DifficultyManager } from './difficulty';
import { ScoreManager } from './score';
import { CollisionSystem } from './collision';
import type { CollisionEvent } from './collision';
import { TutorialManager } from './tutorial';
import { Renderer } from './renderer';
import { audio } from './audio';
import { SongPlayer } from './song-player';
import type { SongData } from './song-data';
import neonOverdrive from '../songs/Neon-Overdrive.json';
import { generateScoreCard, shareScore } from './share';
import { track } from './analytics';
import { submitDailyScore, getDailyStats } from './convex-client';

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: InputHandler;
  particles: ParticleSystem;
  renderer: Renderer;

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
  tutorial: TutorialManager;
  hasPlayedBefore = false;

  // Core
  coreHP = 5;
  coreMaxHP = 5;
  corePulse = 0;
  coreDamageFlash = 0;

  // Scoring
  scoring = new ScoreManager();

  // Timing
  elapsed = 0;
  spawnTimer = 0;
  nextId = 0;

  // Difficulty
  difficulty: DifficultyManager;

  // Screen shake
  shakeIntensity = 0;
  shakeX = 0;
  shakeY = 0;

  // Slow motion for near-miss moments
  timeScale = 1;
  timeScaleTarget = 1;

  dailySeedValue = 0;
  dailyStats: { attempts: number; percentile: number } | null = null;

  // RNG
  rng: () => number = Math.random;

  // Animation
  animTime = 0;
  menuPulse = 0;
  dt = 0;

  // Deflector cooldown
  lastDeflectorTime = 0;
  nearMissTimeout: ReturnType<typeof setTimeout> | null = null;
  DEFLECTOR_COOLDOWN = 0.2; // 200ms minimum between deflectors

  // Music
  music = new SongPlayer();
  private prevMusicEventType: string | null = null;

  // Collision detection
  collisions: CollisionSystem;

  // Constants
  PORT_MAGNETISM = 0.25; // Reduced: How strongly ports pull matching signals

  // Mute button position
  muteButtonX = 0;
  muteButtonY = 0;

  get isMuted(): boolean {
    return audio.isMuted();
  }

  // Accessibility: reduced motion preference
  reducedMotion = false;
  private motionQuery: MediaQueryList | null = null;
  private onMotionChange = (e: MediaQueryListEvent) => {
    this.reducedMotion = e.matches;
  };

  // Stored handler reference for cleanup
  private onResize = () => this.resize();

  // Keyboard handler for menu navigation
  private onKeyDown = (e: KeyboardEvent) => {
    if (this.state === 'menu') {
      switch (e.key) {
        case '1':
        case 'a':
        case 'A':
          audio.init();
          this.startGame('arcade');
          break;
        case '2':
        case 'z':
        case 'Z':
          audio.init();
          this.startGame('zen');
          break;
        case '3':
        case 'd':
        case 'D':
          audio.init();
          this.startGame('daily');
          break;
      }
    } else if (this.state === 'gameover') {
      if (e.key === 'r' || e.key === 'R' || e.key === 'Enter' || e.key === ' ') {
        this.music.stop();
        this.startGame(this.mode);
      } else if (e.key === 'Escape') {
        this.music.stop();
        this.state = 'menu';
      }
    }
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.input = new InputHandler(canvas);
    this.particles = new ParticleSystem();
    this.renderer = new Renderer(this.ctx);
    this.difficulty = new DifficultyManager(this.config);
    this.tutorial = new TutorialManager(false);
    this.collisions = new CollisionSystem({
      coreRadius: this.config.coreRadius,
    });

    // Detect reduced motion preference
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motionQuery.matches;
    this.motionQuery.addEventListener('change', this.onMotionChange);

    // Keyboard navigation
    window.addEventListener('keydown', this.onKeyDown);

    this.scoring.loadHighScores();
    this.scoring.loadDailyStreak();
    audio.loadMuteState();
    this.resize();
    window.addEventListener('resize', this.onResize);
  }

  destroy(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.motionQuery) {
      this.motionQuery.removeEventListener('change', this.onMotionChange);
    }
    this.input.destroy();
    if (this.nearMissTimeout !== null) {
      clearTimeout(this.nearMissTimeout);
      this.nearMissTimeout = null;
    }
    this.particles.clear();
    this.music.stop();
    audio.destroy();
  }

  private toggleMute(): void {
    audio.toggleMute();
    this.music.setMuted(audio.isMuted());
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
    const count = Math.min(this.difficulty.activeColors, 4);
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
        pulsePhase: this.rng() * Math.PI * 2,
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
    this.input.clearPending();

    this.coreHP = mode === 'zen' ? Infinity : this.config.coreHP;
    this.coreMaxHP = this.config.coreHP;
    this.corePulse = 0;
    this.coreDamageFlash = 0;

    this.scoring.reset();
    this.dailyStats = null;

    this.elapsed = 0;
    this.spawnTimer = 0;
    this.nextId = 0;
    this.shakeIntensity = 0;
    this.timeScale = 1;
    this.timeScaleTarget = 1;
    if (this.nearMissTimeout !== null) {
      clearTimeout(this.nearMissTimeout);
      this.nearMissTimeout = null;
    }
    this.difficulty.reset(this.config);

    this.tutorial.reset(this.scoring.hasPlayedBefore);

    if (mode === 'daily') {
      this.dailySeedValue = dailySeed();
      this.rng = seededRng(this.dailySeedValue);
    } else {
      this.rng = Math.random;
    }

    this.ports = [];
    this.setupPorts();
    audio.start();
    this.music.start('songs/Neon-Overdrive.mp3', neonOverdrive as SongData);
    track('game_start', { mode });

    // Spawn first signal for tutorial
    if (this.tutorial.phase === 1) {
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
    this.dt = dt;
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

    // Always update music state (even during tutorial) so beat-reactive visuals stay synced
    this.music.update(scaledDt);

    // Detect drop transitions for screen shake + particle burst (Phase 4.2)
    const currentMusicEvent = this.music.getCurrentEvent();
    const currentEventType = currentMusicEvent?.type ?? null;
    if (currentEventType === 'drop' && this.prevMusicEventType !== 'drop' && !this.reducedMotion) {
      this.shakeIntensity = 6;
      this.particles.burst(center2(this), '#6688ff', 30, 400, 0.8);
      this.particles.burst(center2(this), '#ffffff', 15, 300, 0.5);
    }
    this.prevMusicEventType = currentEventType;

    // Tutorial logic
    if (this.tutorial.isActive()) {
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
    // During gameplay, sync core pulse to beat phase
    if (this.state === 'playing' && !this.tutorial.isActive()) {
      this.corePulse = this.music.getBeatState().beatPhase * Math.PI * 2;
    } else {
      this.corePulse += scaledDt * 2;
    }
    this.coreDamageFlash = Math.max(0, this.coreDamageFlash - scaledDt * 3);

    // Smooth score display
    this.scoring.updateDisplayScore(dt);

    // Spawn signals
    this.spawnTimer -= scaledDt;
    if (this.spawnTimer <= 0 && this.state === 'playing') {
      this.spawnSignal();
      this.spawnTimer = this.difficulty.spawnInterval;
    }
  }

  updateTutorial(dt: number) {
    this.tutorial.update(dt);
    this.particles.update(dt);
    this.updateDeflectors(dt);
    // Sync core pulse to beat phase (music.update() runs before this)
    this.corePulse = this.music.getBeatState().beatPhase * Math.PI * 2;

    if (this.tutorial.phase === 1) {
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
        this.tutorial.onSwipe();
      }
      this.input.consumeTap(); // Eat taps
    }

    if (this.tutorial.phase === 2) {
      // Let physics run to see the bounce + catch
      this.updateSignals(dt);
      this.checkCollisions();

      const action = this.tutorial.checkCompletion(this.signals.length);
      if (action === 'complete') {
        this.scoring.hasPlayedBefore = true;
        try {
          localStorage.setItem('deflect_played', '1');
        } catch {}
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
      { label: 'ZEN', mode: 'zen', y: baseY + 58, color: '#44ff88' },
      { label: 'DAILY', mode: 'daily', y: baseY + 116, color: '#ffcc44' },
    ];
  }

  updateMenu(dt: number) {
    this.muteButtonX = this.width - 40;
    this.muteButtonY = 24;

    this.particles.update(dt);
    if (Math.random() < dt * 3) {
      const angle = Math.random() * Math.PI * 2;
      const r = this.arenaRadius * 0.8;
      const pos = vec2(this.centerX + Math.cos(angle) * r, this.centerY + Math.sin(angle) * r);
      const color = COLORS[SIGNAL_COLORS[Math.floor(Math.random() * 4)]];
      this.particles.trail(pos, color, 2);
    }

    const tapPos = this.input.consumeTapWithPos();
    if (tapPos) {
      audio.init();

      // Check mute button hit first
      const dx = tapPos.x - this.muteButtonX;
      const dy = tapPos.y - this.muteButtonY;
      if (dx * dx + dy * dy < 16 * 16) {
        this.toggleMute();
        return;
      }

      // Check button hits
      const buttons = this.getMenuButtons();
      const btnW = Math.min(this.width * 0.55, 200);
      const btnH = 42;
      for (const btn of buttons) {
        const left = this.centerX - btnW / 2;
        const top = btn.y - btnH / 2;
        if (
          tapPos.x >= left &&
          tapPos.x <= left + btnW &&
          tapPos.y >= top &&
          tapPos.y <= top + btnH
        ) {
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
      const shareBtnW = Math.min(this.width * 0.4, 160);
      const shareBtnH = 38;
      const shareBtnX = this.centerX - shareBtnW / 2;
      const shareBtnY = this.renderer.shareButtonY - shareBtnH / 2;
      if (
        tapPos.x >= shareBtnX &&
        tapPos.x <= shareBtnX + shareBtnW &&
        tapPos.y >= shareBtnY &&
        tapPos.y <= shareBtnY + shareBtnH
      ) {
        this.handleShare();
        return;
      }

      // Check retry button hit (left button)
      const btnW = Math.min(this.width * 0.35, 140);
      const btnH = 38;
      const gap = 12;
      const totalW = btnW * 2 + gap;
      const leftX = this.centerX - totalW / 2;
      const retryY = this.renderer.retryButtonY;
      if (
        tapPos.x >= leftX &&
        tapPos.x <= leftX + btnW &&
        tapPos.y >= retryY - btnH / 2 &&
        tapPos.y <= retryY + btnH / 2
      ) {
        this.music.stop();
        this.startGame(this.mode);
        return;
      }

      // Check menu button hit (right button)
      const rightX = leftX + btnW + gap;
      if (
        tapPos.x >= rightX &&
        tapPos.x <= rightX + btnW &&
        tapPos.y >= retryY - btnH / 2 &&
        tapPos.y <= retryY + btnH / 2
      ) {
        this.music.stop();
        this.state = 'menu';
        return;
      }
    }
    if (this.input.consumeSwipe()) {
      this.music.stop();
      this.state = 'menu';
    }
  }

  async handleShare() {
    track('share_initiated', { mode: this.mode, score: this.scoring.score });
    try {
      const card = generateScoreCard({
        score: this.scoring.score,
        survived: this.elapsed,
        catches: this.scoring.catches,
        misses: this.scoring.misses,
        maxCombo: this.scoring.maxCombo,
        mode: this.mode,
        colorMisses: this.scoring.colorMisses,
      });
      const ok = await shareScore(card);
      this.shareMessage = ok ? 'Copied!' : 'Share failed';
    } catch {
      this.shareMessage = 'Share failed';
    }
    this.shareMessageTimer = 2;
  }

  updateDifficulty() {
    const colorChanged = this.difficulty.update(this.elapsed, this.mode);

    if (colorChanged) {
      this.ports = []; // Force rebuild
      this.setupPorts();

      // Flash "NEW COLOR" notification
      if (this.difficulty.activeColors > 1) {
        const newColor = SIGNAL_COLORS[this.difficulty.activeColors - 1];
        this.addFloatingText(
          `+ ${newColor.toUpperCase()}`,
          vec2(this.centerX, this.height - 100),
          COLORS[newColor],
          2,
        );
      }
    }

    // Map difficulty to music layers
    const musicLayers = this.difficulty.activeColors + 1; // 1 color = 2 layers (kick+hat), 2 = 3, 3 = 4, 4 = 5
    this.music.setIntensityLevel(musicLayers);
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
    const colorIdx = Math.floor(this.rng() * this.difficulty.activeColors);
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
      this.difficulty.signalSpeed,
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

          if (Math.abs(angleDiff) < 0.8) {
            // Only pull when reasonably close
            const pullStrength = this.PORT_MAGNETISM * (distFromCenter / this.arenaRadius) * dt;
            const tangent = vec2(-Math.sin(signalAngle), Math.cos(signalAngle));
            s.vel.x += tangent.x * angleDiff * pullStrength * this.difficulty.signalSpeed;
            s.vel.y += tangent.y * angleDiff * pullStrength * this.difficulty.signalSpeed;
            // Re-normalize speed (mutable: avoids temp vector allocation)
            normalizeMut(s.vel);
            scaleMut(s.vel, this.difficulty.signalSpeed);
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

    // Swap-and-pop: remove dead signals in place (avoids allocating a new array each frame)
    for (let i = this.signals.length - 1; i >= 0; i--) {
      if (!this.signals[i].alive) {
        this.signals[i] = this.signals[this.signals.length - 1];
        this.signals.pop();
      }
    }
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
    const events = this.collisions.checkCollisions(
      this.signals,
      this.deflectors,
      this.ports,
      center,
      this.arenaRadius,
    );

    for (const event of events) {
      this.handleCollisionEvent(event);
      if (this.state !== 'playing') return; // Stop processing after game over
    }
  }

  handleCollisionEvent(event: CollisionEvent) {
    const rm = this.reducedMotion;
    switch (event.type) {
      case 'deflector':
        this.particles.burst(event.signal.pos, COLORS[event.signal.color], rm ? 3 : 8, 120, 0.3);
        audio.bounce();
        break;
      case 'core':
        this.onCoreDamage(event.signal);
        break;
      case 'nearMiss':
        this.onNearMiss(event.signal);
        break;
      case 'portCatch':
        this.onCatch(event.signal, event.port);
        break;
      case 'wrongPort':
        this.onWrongPort(event.signal, event.port);
        break;
      case 'escape':
        this.onEscape(event.signal);
        break;
    }
  }

  // --- EVENT HANDLERS ---

  onCatch(signal: Signal, port: Port) {
    const points = this.scoring.addCatch();
    port.catchCount++;

    // Juicy feedback (reduced when motion preference set)
    this.particles.burst(signal.pos, COLORS[signal.color], this.reducedMotion ? 8 : 25, 280, 0.7);
    this.addFloatingText(`+${points}`, signal.pos, COLORS[signal.color]);

    if (this.scoring.combo >= 5) {
      this.addFloatingText(
        `${this.scoring.combo}x!`,
        vec2(signal.pos.x, signal.pos.y - 25),
        '#ffcc44',
      );
    }

    audio.catch(Math.min(this.scoring.combo - 1, 7));
  }

  onWrongPort(signal: Signal, _port: Port) {
    this.scoring.addMiss(signal.color);
    this.particles.burst(signal.pos, '#666', this.reducedMotion ? 2 : 6, 60, 0.3);
    this.addFloatingText('WRONG', signal.pos, '#ff6666', 1);
  }

  onEscape(signal: Signal) {
    this.scoring.addMiss(signal.color);
    this.particles.burst(signal.pos, '#444', this.reducedMotion ? 1 : 4, 40, 0.3);
  }

  onNearMiss(_signal: Signal) {
    // Dramatic near-miss feedback
    this.nearMissRings.push({ life: 0.6, radius: this.config.coreRadius + 15 });

    // Brief slow-mo (with cleanup)
    this.timeScaleTarget = 0.3;
    if (this.nearMissTimeout !== null) clearTimeout(this.nearMissTimeout);
    this.nearMissTimeout = setTimeout(() => {
      this.timeScaleTarget = 1;
      this.nearMissTimeout = null;
    }, 200);

    this.addFloatingText(
      'CLOSE!',
      vec2(this.centerX, this.centerY - this.config.coreRadius - 30),
      '#ffcc44',
      0.8,
    );
  }

  onCoreDamage(signal: Signal) {
    this.coreHP--;
    this.scoring.addMiss(signal.color);
    this.coreDamageFlash = 1;
    this.shakeIntensity = this.reducedMotion ? 0 : 10;

    this.particles.burst(center2(this), '#ff2244', this.reducedMotion ? 10 : 35, 350, 0.9);
    this.addFloatingText(`-1 HP`, center2(this), '#ff4466', 1.5);

    audio.damage();

    if (this.coreHP <= 0 && this.mode !== 'zen') {
      this.onGameOver();
    }
  }

  onGameOver() {
    if (this.nearMissTimeout !== null) {
      clearTimeout(this.nearMissTimeout);
      this.nearMissTimeout = null;
    }
    this.timeScale = 1;
    this.timeScaleTarget = 1;
    this.state = 'gameover';

    const burstCount = this.reducedMotion ? 15 : 50;
    for (const color of Object.values(COLORS)) {
      this.particles.burst(center2(this), color, burstCount, 450, 1.5);
    }

    audio.gameOver();
    this.music.stop();
    track('game_over', { mode: this.mode, score: this.scoring.score, elapsed: Math.floor(this.elapsed), maxCombo: this.scoring.maxCombo });

    if (this.scoring.finalizeScores(this.mode)) {
      this.scoring.saveHighScores(this.mode, this.dailySeedValue);
    }

    if (this.mode === 'daily') {
      this.scoring.updateDailyStreak();
      this.scoring.saveDailyStreak();

      // Submit to Convex and fetch stats
      submitDailyScore(this.dailySeedValue, this.scoring.score).then(() => {
        getDailyStats(this.dailySeedValue, this.scoring.score).then((stats) => {
          this.dailyStats = stats;
        });
      });
    }
  }

  addFloatingText(text: string, pos: Vec2, color: string, life: number = 1.2) {
    this.floatingTexts.push({ text, pos: { ...pos }, color, life, maxLife: life });
  }

  updateFloatingTexts(dt: number) {
    const floatSpeed = this.reducedMotion ? 10 : 40;
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.pos.y -= floatSpeed * dt; // Float upward
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
    if (this.reducedMotion) {
      this.shakeIntensity = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      return;
    }
    if (this.shakeIntensity > 0) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity *= Math.pow(0.85, dt * 60);
      if (this.shakeIntensity < 0.5) {
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    }
  }

  render() {
    this.renderer.render(this);
  }

}

function center2(game: Game): Vec2 {
  return vec2(game.centerX, game.centerY);
}
