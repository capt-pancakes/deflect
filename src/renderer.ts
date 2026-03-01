import type { Signal, Deflector, Port, Vec2, SignalColor, GameState, GameMode, FloatingText, NearMissRing } from './types';
import { COLORS, COLOR_GLOW } from './types';
import { normalize, sub, vec2 } from './math';
import type { ParticleSystem } from './particles';
import type { BeatState } from './music';

// ---- Font constants ----

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function fontString(size: number, bold = false): string {
  return `${bold ? 'bold ' : ''}${size}px ${FONT_FAMILY}`;
}

// ---- Hex-to-RGB with memoization ----

const hexCache = new Map<string, [number, number, number]>();

export function hexToRgb(hex: string): [number, number, number] {
  const cached = hexCache.get(hex);
  if (cached) return cached;
  const result: [number, number, number] = [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  hexCache.set(hex, result);
  return result;
}

// ---- roundRect polyfill for Safari < 15.4 ----

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
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

// ---- Renderable game state interface ----

interface MenuButton {
  label: string;
  mode: GameMode;
  y: number;
  color: string;
}

interface ActiveSwipe {
  start: Vec2;
  end: Vec2;
}

export interface RenderableGameState {
  state: GameState;
  mode: GameMode;
  signals: readonly Signal[];
  deflectors: readonly Deflector[];
  ports: readonly Port[];
  floatingTexts: readonly FloatingText[];
  nearMissRings: readonly NearMissRing[];
  particles: ParticleSystem;
  music: {
    getBeatState(): BeatState;
  };
  scoring: {
    score: number;
    combo: number;
    maxCombo: number;
    catches: number;
    misses: number;
    displayScore: number;
    highScore: number;
    dailyBest: number;
    colorMisses: Partial<Record<SignalColor, number>>;
    getWorstColor(): SignalColor | null;
  };
  tutorial: {
    phase: number;
    ghostSwipeAnim: number;
    isActive(): boolean;
  };
  difficulty: {
    activeColors: number;
  };
  config: {
    coreRadius: number;
  };
  coreHP: number;
  coreMaxHP: number;
  corePulse: number;
  coreDamageFlash: number;
  elapsed: number;
  timeScale: number;
  shakeX: number;
  shakeY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  arenaRadius: number;
  animTime: number;
  menuPulse: number;
  shareMessage: string;
  shareMessageTimer: number;
  reducedMotion: boolean;
  getMenuButtons(): MenuButton[];
  input: { getActiveSwipe(): ActiveSwipe | null };
}

// ---- Renderer ----

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  /** Y-position of the share button, computed during renderGameOver. */
  shareButtonY = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(game: RenderableGameState): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(game.shakeX, game.shakeY);

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(-10, -10, game.width + 20, game.height + 20);

    if (game.state === 'menu') {
      this.renderMenu(ctx, game);
    } else {
      this.renderGame(ctx, game);
      if (game.state === 'gameover') {
        this.renderGameOver(ctx, game);
      }
    }

    ctx.restore();
  }

  private renderMenu(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    this.renderArenaRing(ctx, game, 0.2);

    // Decorative ports on menu
    const demoColors: SignalColor[] = ['red', 'blue', 'green', 'yellow'];
    for (let i = 0; i < 4; i++) {
      const angle = -Math.PI / 2 + i * (Math.PI / 2);
      const pulse = Math.sin(game.menuPulse * 2 + i) * 0.15 + 0.85;
      const portAngle = 0.5;
      ctx.strokeStyle = COLOR_GLOW[demoColors[i]];
      ctx.lineWidth = 18 * pulse;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(game.centerX, game.centerY, game.arenaRadius, angle - portAngle / 2, angle + portAngle / 2);
      ctx.stroke();
      ctx.strokeStyle = COLORS[demoColors[i]];
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(game.centerX, game.centerY, game.arenaRadius, angle - portAngle / 2, angle + portAngle / 2);
      ctx.stroke();
    }

    game.particles.render(ctx);

    // Title
    const pulse = Math.sin(game.menuPulse * 2) * 0.1 + 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 30 * pulse;
    ctx.fillStyle = '#fff';
    ctx.font = fontString(Math.min(game.width * 0.14, 72), true);
    ctx.fillText('DEFLECT', game.centerX, game.centerY - 60);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#8888aa';
    ctx.font = fontString(Math.min(game.width * 0.04, 18));
    ctx.fillText('Swipe to deflect. Match the colors.', game.centerX, game.centerY + 5);

    // Mode buttons
    const buttons = game.getMenuButtons();
    const btnW = Math.min(game.width * 0.55, 200);
    const btnH = 42;
    for (const btn of buttons) {
      // Button bg
      ctx.fillStyle = `${btn.color}18`;
      ctx.strokeStyle = `${btn.color}66`;
      ctx.lineWidth = 1.5;
      const r = 8;
      const x = game.centerX - btnW / 2;
      const y = btn.y - btnH / 2;
      drawRoundRect(ctx, x, y, btnW, btnH, r);
      ctx.fill();
      ctx.stroke();

      // Keyboard shortcut hint (left of button)
      const shortcut = btn.mode === 'arcade' ? '1' : btn.mode === 'zen' ? '2' : '3';
      ctx.fillStyle = `${btn.color}55`;
      ctx.font = fontString(Math.min(game.width * 0.03, 13));
      ctx.textAlign = 'right';
      ctx.fillText(shortcut, x - 6, btn.y);
      ctx.textAlign = 'center';

      // Button label
      ctx.fillStyle = btn.color;
      ctx.font = fontString(Math.min(game.width * 0.045, 20), true);
      ctx.fillText(btn.label, game.centerX, btn.y);

      // Sub-label
      ctx.fillStyle = `${btn.color}88`;
      ctx.font = fontString(Math.min(game.width * 0.028, 11));
      if (btn.mode === 'arcade')
        ctx.fillText('Survive as long as you can', game.centerX, btn.y + 16);
      if (btn.mode === 'zen') ctx.fillText('No damage, pure flow', game.centerX, btn.y + 16);
      if (btn.mode === 'daily')
        ctx.fillText('Same pattern for everyone', game.centerX, btn.y + 16);
    }

    // High score
    if (game.scoring.highScore > 0) {
      ctx.fillStyle = '#ffcc44';
      ctx.font = fontString(Math.min(game.width * 0.035, 14));
      ctx.fillText(`BEST: ${game.scoring.highScore}`, game.centerX, game.centerY + 180);
    }
  }

  private renderArenaRing(
    ctx: CanvasRenderingContext2D,
    game: RenderableGameState,
    alpha: number,
  ): void {
    ctx.strokeStyle = `rgba(60, 60, 100, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.centerX, game.centerY, game.arenaRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  private renderGame(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    this.renderArenaRing(ctx, game, 0.12);
    this.renderPorts(ctx, game);
    this.renderNearMissRings(ctx, game);
    this.renderCore(ctx, game);
    this.renderDeflectors(ctx, game);

    // Active swipe preview
    const activeSwipe = game.input.getActiveSwipe();
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

    this.renderSignals(ctx, game);
    game.particles.render(ctx);
    this.renderFloatingTexts(ctx, game);

    // Tutorial overlay
    if (game.tutorial.isActive()) {
      this.renderTutorial(ctx, game);
    }

    this.renderHUD(ctx, game);
  }

  private renderTutorial(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    if (game.tutorial.phase !== 1) return;

    // Ghost swipe animation
    const t = (game.tutorial.ghostSwipeAnim % 2) / 2; // 0 to 1 over 2 seconds
    if (t < 0.6) {
      const progress = t / 0.6;
      const startX = game.centerX - 60;
      const startY = game.centerY + 40;
      const endX = game.centerX + 60;
      const endY = game.centerY - 20;

      const currentX = startX + (endX - startX) * progress;
      const currentY = startY + (endY - startY) * progress;

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
    const hintAlpha = Math.sin(game.tutorial.ghostSwipeAnim * 4) * 0.3 + 0.7;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255, 255, 255, ${hintAlpha})`;
    ctx.font = fontString(Math.min(game.width * 0.06, 28), true);
    ctx.fillText('SWIPE TO DEFLECT!', game.centerX, game.height - 100);
  }

  private renderPorts(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    for (const port of game.ports) {
      const color = COLORS[port.color];
      const glow = COLOR_GLOW[port.color];

      // Check if any matching signal is heading toward this port (hungry indicator)
      let isHungry = false;
      for (const s of game.signals) {
        if (s.color === port.color && s.alive) {
          isHungry = true;
          break;
        }
      }

      const pulse = isHungry
        ? Math.sin(game.animTime * 6 + port.pulsePhase) * 0.25 + 0.95
        : Math.sin(game.animTime * 2 + port.pulsePhase) * 0.1 + 0.9;

      // Outer glow (bigger when hungry)
      ctx.strokeStyle = glow;
      ctx.lineWidth = (isHungry ? 28 : 18) * pulse;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(game.centerX, game.centerY, game.arenaRadius, port.angleStart, port.angleEnd);
      ctx.stroke();

      // Core port line
      ctx.strokeStyle = color;
      ctx.lineWidth = isHungry ? 8 : 5;
      ctx.beginPath();
      ctx.arc(game.centerX, game.centerY, game.arenaRadius, port.angleStart, port.angleEnd);
      ctx.stroke();

      // Port icon (colored circle with label outside arena)
      const midAngle = (port.angleStart + port.angleEnd) / 2;
      const labelR = game.arenaRadius + 22;
      const lx = game.centerX + Math.cos(midAngle) * labelR;
      const ly = game.centerY + Math.sin(midAngle) * labelR;

      // Icon circle
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isHungry ? 12 : 6;
      ctx.beginPath();
      ctx.arc(lx, ly, isHungry ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner arrows pointing inward (showing where signals should go)
      const arrowR = game.arenaRadius - 15;
      for (let a = port.angleStart + 0.15; a < port.angleEnd - 0.1; a += 0.3) {
        const ax = game.centerX + Math.cos(a) * arrowR;
        const ay = game.centerY + Math.sin(a) * arrowR;
        const inward = normalize(sub(vec2(game.centerX, game.centerY), vec2(ax, ay)));
        ctx.strokeStyle = `${color}44`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax - inward.x * 8, ay - inward.y * 8);
        ctx.lineTo(ax + inward.x * 8, ay + inward.y * 8);
        ctx.stroke();
      }
    }
  }

  private renderNearMissRings(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    for (const ring of game.nearMissRings) {
      const alpha = ring.life / 0.6;
      ctx.strokeStyle = `rgba(255, 204, 68, ${alpha * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(game.centerX, game.centerY, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private renderCore(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    const r = game.config.coreRadius;
    const pulse = Math.sin(game.corePulse) * 2;

    // Damage flash ring
    if (game.coreDamageFlash > 0) {
      ctx.fillStyle = `rgba(255, 34, 68, ${game.coreDamageFlash * 0.3})`;
      ctx.beginPath();
      ctx.arc(game.centerX, game.centerY, r + 25, 0, Math.PI * 2);
      ctx.fill();
    }

    const hpRatio = game.mode === 'zen' ? 1 : game.coreHP / game.coreMaxHP;
    const glowColor = hpRatio > 0.5 ? '#4488ff' : hpRatio > 0.2 ? '#ffcc44' : '#ff4466';

    // Danger ring pulsing when low HP
    if (hpRatio <= 0.4 && hpRatio > 0) {
      const dangerPulse = Math.sin(game.animTime * 8) * 0.3 + 0.3;
      ctx.strokeStyle = `rgba(255, 68, 102, ${dangerPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        game.centerX,
        game.centerY,
        r + 15 + Math.sin(game.animTime * 4) * 5,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }

    // Core glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15 + pulse;

    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(game.centerX, game.centerY, r + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // HP pips
    if (game.mode !== 'zen') {
      const dotSpacing = 12;
      const startX = game.centerX - ((game.coreMaxHP - 1) * dotSpacing) / 2;
      for (let i = 0; i < game.coreMaxHP; i++) {
        const active = i < game.coreHP;
        ctx.fillStyle = active ? glowColor : '#333';
        if (active) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 4;
        }
        ctx.beginPath();
        ctx.arc(startX + i * dotSpacing, game.centerY, active ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else {
      // Zen mode: infinity symbol
      ctx.fillStyle = '#44ff8888';
      ctx.font = `bold 16px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u221e', game.centerX, game.centerY);
    }
  }

  private renderDeflectors(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    for (const d of game.deflectors) {
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

  private renderSignals(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    for (const s of game.signals) {
      if (!s.alive) continue;
      const color = COLORS[s.color];

      // Trail with gradient opacity
      if (s.trail.length > 1) {
        for (let i = 1; i < s.trail.length; i++) {
          const alpha = (i / s.trail.length) * 0.5;
          const [cr, cg, cb] = hexToRgb(color);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.lineWidth = s.radius * (0.5 + i / s.trail.length);
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
      ctx.arc(
        s.pos.x - s.radius * 0.25,
        s.pos.y - s.radius * 0.25,
        s.radius * 0.35,
        0,
        Math.PI * 2,
      );
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

  private renderFloatingTexts(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    for (const ft of game.floatingTexts) {
      const alpha = ft.life / ft.maxLife;
      const s = 0.8 + (1 - alpha) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = fontString(Math.round(16 * s), true);
      ctx.fillText(ft.text, ft.pos.x, ft.pos.y);
    }
    ctx.globalAlpha = 1;
  }

  private renderHUD(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Score
    const scoreSize = Math.min(game.width * 0.08, 36);
    ctx.fillStyle = '#fff';
    ctx.font = fontString(scoreSize, true);
    ctx.fillText(`${Math.round(game.scoring.displayScore)}`, game.centerX, 20);

    // Combo
    if (game.scoring.combo > 1) {
      const comboAlpha = Math.min(1, game.scoring.combo / 5);
      const comboSize = Math.min(game.width * 0.045, 20) + Math.min(game.scoring.combo, 10) * 0.8;
      ctx.fillStyle = `rgba(255, 204, 68, ${comboAlpha})`;
      ctx.font = fontString(comboSize, true);
      ctx.fillText(`${game.scoring.combo}x COMBO`, game.centerX, 20 + scoreSize + 4);
    }

    // Timer (top left)
    const secs = Math.floor(game.elapsed);
    ctx.fillStyle = '#555';
    ctx.font = fontString(Math.min(game.width * 0.035, 14));
    ctx.textAlign = 'left';
    ctx.fillText(`${secs}s`, 15, 20);

    // Mode indicator (top right)
    ctx.textAlign = 'right';
    if (game.mode === 'zen') {
      ctx.fillStyle = '#44ff88';
      ctx.fillText('ZEN', game.width - 15, 20);
    } else if (game.mode === 'daily') {
      ctx.fillStyle = '#ffcc44';
      ctx.fillText('DAILY', game.width - 15, 20);
    }

    // Slow-mo indicator
    if (game.timeScale < 0.8) {
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255, 204, 68, ${(1 - game.timeScale) * 0.8})`;
      ctx.font = fontString(Math.min(game.width * 0.03, 12), true);
      ctx.fillText('CLOSE CALL', game.centerX, game.height - 40);
    }
  }

  private renderGameOver(ctx: CanvasRenderingContext2D, game: RenderableGameState): void {
    ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isNewHigh = game.scoring.score > game.scoring.highScore && game.scoring.score > 0;
    const font = (size: number, bold = false) =>
      fontString(Math.min(game.width * size, size * 500), bold);

    // "CORE BREACH"
    ctx.fillStyle = '#ff4466';
    ctx.font = font(0.09, true);
    ctx.fillText('CORE BREACH', game.centerX, game.centerY - 120);

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = font(0.16, true);
    ctx.fillText(`${game.scoring.score}`, game.centerX, game.centerY - 40);

    if (isNewHigh) {
      ctx.fillStyle = '#ffcc44';
      ctx.font = font(0.04, true);
      ctx.fillText('NEW HIGH SCORE!', game.centerX, game.centerY + 10);
    }

    // Stats
    let y = game.centerY + 50;
    ctx.fillStyle = '#8888aa';
    ctx.font = font(0.035);

    ctx.fillText(
      `${Math.floor(game.elapsed)}s survived  |  ${game.scoring.catches} catches  |  ${game.scoring.maxCombo}x best combo`,
      game.centerX,
      y,
    );
    y += 28;

    const total = game.scoring.catches + game.scoring.misses;
    const accuracy = total > 0 ? Math.round((game.scoring.catches / total) * 100) : 0;
    ctx.fillText(`${accuracy}% accuracy`, game.centerX, y);
    y += 35;

    // Post-run coaching
    const worstColor = game.scoring.getWorstColor();
    if (worstColor) {
      ctx.fillStyle = COLORS[worstColor];
      ctx.font = font(0.035, true);
      ctx.fillText(
        `Most leaked: ${worstColor.toUpperCase()} (${game.scoring.colorMisses[worstColor] ?? 0})`,
        game.centerX,
        y,
      );
      y += 28;
    }

    // Next goal
    ctx.fillStyle = '#6688aa';
    ctx.font = font(0.032);
    if (game.scoring.maxCombo < 5) {
      ctx.fillText('Goal: Reach a 5x combo streak!', game.centerX, y);
    } else if (game.scoring.maxCombo < 10) {
      ctx.fillText(
        `Goal: Reach a 10x combo! (best: ${game.scoring.maxCombo}x)`,
        game.centerX,
        y,
      );
    } else {
      ctx.fillText(
        `Goal: Survive ${Math.ceil(game.elapsed / 10) * 10 + 10}s (survived: ${Math.floor(game.elapsed)}s)`,
        game.centerX,
        y,
      );
    }

    // Share button
    y += 35;
    this.shareButtonY = y;
    const shareBtnW = Math.min(game.width * 0.4, 160);
    const shareBtnH = 38;
    ctx.fillStyle = '#4488ff22';
    ctx.strokeStyle = '#4488ff66';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, game.centerX - shareBtnW / 2, y - shareBtnH / 2, shareBtnW, shareBtnH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4488ff';
    ctx.font = font(0.038, true);
    ctx.fillText('SHARE SCORE', game.centerX, y);

    // Share feedback message
    if (game.shareMessageTimer > 0) {
      ctx.fillStyle = `rgba(68, 255, 136, ${Math.min(1, game.shareMessageTimer)})`;
      ctx.font = font(0.032);
      ctx.fillText(game.shareMessage, game.centerX, y + 30);
    }

    // Tap to continue
    const tapAlpha = Math.sin(game.animTime * 3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${tapAlpha})`;
    ctx.font = font(0.035);
    ctx.fillText('TAP TO CONTINUE', game.centerX, game.height - 60);
  }
}
