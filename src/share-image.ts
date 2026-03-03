/** Canvas-rendered 400x600 share image with neon aesthetic */

import type { SignalColor } from './types';
import { COLORS, SIGNAL_COLORS } from './types';

const WIDTH = 400;
const HEIGHT = 600;

const BG_COLOR = '#0a0a1a';
const NEON_BLUE = '#4488ff';
const TEXT_WHITE = '#ffffff';
const TEXT_DIM = '#8888aa';

const MODE_COLORS: Record<string, string> = {
  arcade: '#4488ff',
  zen: '#44ff88',
  daily: '#ffcc44',
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function generateShareImage(stats: {
  score: number;
  survived: number;
  catches: number;
  misses: number;
  maxCombo: number;
  mode: string;
  colorMisses?: Partial<Record<SignalColor, number>>;
}): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Dark background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Neon border
  ctx.strokeStyle = NEON_BLUE;
  ctx.lineWidth = 2;
  ctx.shadowColor = NEON_BLUE;
  ctx.shadowBlur = 12;
  ctx.strokeRect(8, 8, WIDTH - 16, HEIGHT - 16);
  ctx.shadowBlur = 0;

  // Title "DEFLECT" with blue glow
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = NEON_BLUE;
  ctx.shadowBlur = 20;
  ctx.fillStyle = TEXT_WHITE;
  ctx.font = `bold 42px ${FONT}`;
  ctx.fillText('DEFLECT', WIDTH / 2, 60);
  ctx.shadowBlur = 0;

  // Mode label
  const modeLabel = stats.mode === 'zen' ? 'ZEN' : stats.mode === 'daily' ? 'DAILY' : 'ARCADE';
  const modeColor = MODE_COLORS[stats.mode] ?? NEON_BLUE;
  ctx.fillStyle = modeColor;
  ctx.font = `bold 18px ${FONT}`;

  let modeLine = modeLabel;
  if (stats.mode === 'daily') {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    modeLine = `DAILY - ${dateStr}`;
  }
  ctx.fillText(modeLine, WIDTH / 2, 100);

  // Large score with glow
  ctx.shadowColor = modeColor;
  ctx.shadowBlur = 25;
  ctx.fillStyle = TEXT_WHITE;
  ctx.font = `bold 72px ${FONT}`;
  ctx.fillText(`${stats.score}`, WIDTH / 2, 190);
  ctx.shadowBlur = 0;

  // "POINTS" subtitle
  ctx.fillStyle = TEXT_DIM;
  ctx.font = `14px ${FONT}`;
  ctx.fillText('POINTS', WIDTH / 2, 235);

  // Stats row
  const statsY = 290;
  ctx.fillStyle = TEXT_DIM;
  ctx.font = `14px ${FONT}`;
  ctx.fillText(
    `${Math.floor(stats.survived)}s survived  |  ${stats.catches} catches  |  ${stats.maxCombo}x best combo`,
    WIDTH / 2,
    statsY,
  );

  // Accuracy bar
  const total = stats.catches + stats.misses;
  const accuracy = total > 0 ? Math.round((stats.catches / total) * 100) : 0;
  const barY = 330;
  const barW = 260;
  const barH = 16;
  const barX = (WIDTH - barW) / 2;
  const fillW = (accuracy / 100) * barW;

  // Dark background bar
  ctx.fillStyle = '#1a1a2e';
  drawRoundRect(ctx, barX, barY, barW, barH, 4);
  ctx.fill();

  // Colored fill
  if (fillW > 0) {
    ctx.fillStyle = modeColor;
    ctx.shadowColor = modeColor;
    ctx.shadowBlur = 6;
    drawRoundRect(ctx, barX, barY, fillW, barH, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Accuracy label
  ctx.fillStyle = TEXT_WHITE;
  ctx.font = `bold 14px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${accuracy}%`, WIDTH / 2, barY + barH + 22);

  // Color performance blocks
  const blockSize = 36;
  const blockGap = 12;
  const colorMisses = stats.colorMisses || {};
  const totalBlockW = SIGNAL_COLORS.length * blockSize + (SIGNAL_COLORS.length - 1) * blockGap;
  let blockX = (WIDTH - totalBlockW) / 2;
  const blockY = 400;

  for (const color of SIGNAL_COLORS) {
    const missed = colorMisses[color] || 0;
    const hex = COLORS[color];

    if (total > 0) {
      if (missed === 0) {
        // Full color - perfect
        ctx.fillStyle = hex;
        ctx.shadowColor = hex;
        ctx.shadowBlur = 8;
      } else if (missed <= 2) {
        // Dimmed - some misses
        ctx.fillStyle = hex + '88';
        ctx.shadowBlur = 0;
      } else {
        // Very dim - many misses
        ctx.fillStyle = '#333';
        ctx.shadowBlur = 0;
      }
    } else {
      ctx.fillStyle = '#222';
      ctx.shadowBlur = 0;
    }

    drawRoundRect(ctx, blockX, blockY, blockSize, blockSize, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    blockX += blockSize + blockGap;
  }

  // Color labels
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = TEXT_DIM;
  blockX = (WIDTH - totalBlockW) / 2;
  for (const color of SIGNAL_COLORS) {
    ctx.fillText(color[0].toUpperCase(), blockX + blockSize / 2, blockY + blockSize + 14);
    blockX += blockSize + blockGap;
  }

  // URL at bottom
  ctx.fillStyle = TEXT_DIM;
  ctx.font = `12px ${FONT}`;
  ctx.textAlign = 'center';
  const url = typeof window !== 'undefined' ? window.location?.href : '';
  if (url) {
    ctx.fillText(url, WIDTH / 2, HEIGHT - 30);
  }

  return canvas;
}

/** Polyfill-safe roundRect */
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
