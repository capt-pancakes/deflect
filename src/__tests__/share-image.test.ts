import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateShareImage } from '../share-image';

function createMockCanvas2D() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    translate: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    roundRect: vi.fn(),
    arcTo: vi.fn(),
    clip: vi.fn(),
    canvas: { width: 400, height: 600 },
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
    shadowBlur: 0,
    shadowColor: '',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    font: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalCompositeOperation: 'source-over',
  };
}

describe('generateShareImage', () => {
  let mockCtx: ReturnType<typeof createMockCanvas2D>;

  beforeEach(() => {
    mockCtx = createMockCanvas2D();

    vi.stubGlobal('document', {
      createElement: vi.fn((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: vi.fn(() => mockCtx),
          };
        }
        return {};
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const baseStats = {
    score: 1500,
    survived: 45,
    catches: 20,
    misses: 5,
    maxCombo: 8,
    mode: 'arcade' as const,
  };

  it('returns a canvas element with correct dimensions', () => {
    const canvas = generateShareImage(baseStats);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(600);
  });

  it('calls getContext("2d")', () => {
    const canvas = generateShareImage(baseStats);
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
  });

  it('draws the DEFLECT title', () => {
    generateShareImage(baseStats);
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      'DEFLECT',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('draws the score', () => {
    generateShareImage(baseStats);
    const calls = mockCtx.fillText.mock.calls;
    const scoreDrawn = calls.some(
      (args: unknown[]) => args[0] === '1500',
    );
    expect(scoreDrawn).toBe(true);
  });

  it('draws mode label', () => {
    generateShareImage(baseStats);
    const calls = mockCtx.fillText.mock.calls;
    const modeDrawn = calls.some(
      (args: unknown[]) => args[0] === 'ARCADE',
    );
    expect(modeDrawn).toBe(true);
  });

  it('draws daily mode with date', () => {
    generateShareImage({ ...baseStats, mode: 'daily' });
    const calls = mockCtx.fillText.mock.calls;
    const dailyDrawn = calls.some(
      (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).includes('DAILY'),
    );
    expect(dailyDrawn).toBe(true);
  });

  it('draws stats row with survived/catches/combo', () => {
    generateShareImage(baseStats);
    const calls = mockCtx.fillText.mock.calls;
    const survivedDrawn = calls.some(
      (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).includes('45s'),
    );
    expect(survivedDrawn).toBe(true);
  });

  it('handles zero catches and misses without error', () => {
    expect(() =>
      generateShareImage({
        ...baseStats,
        catches: 0,
        misses: 0,
      }),
    ).not.toThrow();
  });
});
