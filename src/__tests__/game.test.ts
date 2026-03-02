import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the audio module before importing Game
vi.mock('../audio', () => ({
  getCtx: vi.fn(() => null),
  audio: {
    init: vi.fn(),
    start: vi.fn(),
    catch: vi.fn(),
    bounce: vi.fn(),
    damage: vi.fn(),
    gameOver: vi.fn(),
    swipe: vi.fn(),
    destroy: vi.fn(),
    isMuted: vi.fn(() => false),
    toggleMute: vi.fn(),
    loadMuteState: vi.fn(),
  },
}));

// Mock the share module
vi.mock('../share', () => ({
  generateScoreCard: vi.fn(() => ''),
  shareScore: vi.fn(() => Promise.resolve(true)),
}));

import { Game } from '../game';

function createMockCanvas() {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    translate: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    roundRect: vi.fn(),
    arcTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    clip: vi.fn(),
    canvas: { width: 400, height: 800 },
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    shadowBlur: 0,
    shadowColor: '',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalCompositeOperation: 'source-over',
  } as unknown as CanvasRenderingContext2D;

  const canvas = {
    getContext: vi.fn(() => ctx),
    width: 400,
    height: 800,
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      width: 400,
      height: 800,
      right: 400,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    style: { touchAction: '', width: '', height: '' },
  } as unknown as HTMLCanvasElement;

  return { canvas, ctx };
}

// Create a minimal window stub for the Game constructor
function stubWindow() {
  const store: Record<string, string> = {};

  const win = {
    innerWidth: 400,
    innerHeight: 800,
    devicePixelRatio: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    matchMedia: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  };

  vi.stubGlobal('window', win);
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  });

  return win;
}

describe('Game integration', () => {
  let game: Game;

  beforeEach(() => {
    stubWindow();
    const { canvas } = createMockCanvas();
    game = new Game(canvas);
  });

  afterEach(() => {
    game.destroy();
    vi.unstubAllGlobals();
  });

  it('instantiates without throwing', () => {
    expect(game).toBeDefined();
  });

  it('initial state is menu', () => {
    expect(game.state).toBe('menu');
  });

  it('startGame("arcade") transitions to playing state', () => {
    game.startGame('arcade');
    expect(game.state).toBe('playing');
    expect(game.mode).toBe('arcade');
  });

  it('startGame("zen") transitions to playing with infinite HP', () => {
    game.startGame('zen');
    expect(game.state).toBe('playing');
    expect(game.mode).toBe('zen');
    expect(game.coreHP).toBe(Infinity);
  });

  it('startGame("daily") transitions to playing with seeded RNG', () => {
    game.startGame('daily');
    expect(game.state).toBe('playing');
    expect(game.mode).toBe('daily');
    expect(game.rng).not.toBe(Math.random);
  });

  it('update(1/60) runs without throwing', () => {
    game.startGame('arcade');
    game.tutorial.phase = 3;
    expect(() => game.update(1 / 60)).not.toThrow();
  });

  it('render() runs without throwing', () => {
    expect(() => game.render()).not.toThrow();
  });

  it('render() in playing state runs without throwing', () => {
    game.startGame('arcade');
    game.tutorial.phase = 3;
    expect(() => game.render()).not.toThrow();
  });

  it('after enough updates, signals spawn', () => {
    game.startGame('arcade');
    game.tutorial.phase = 3;

    const dt = 1 / 60;
    for (let i = 0; i < 200; i++) {
      game.update(dt);
    }

    expect(game.signals.length).toBeGreaterThan(0);
  });

  it('destroy() cleans up without throwing', () => {
    game.startGame('arcade');
    game.tutorial.phase = 3;
    for (let i = 0; i < 10; i++) {
      game.update(1 / 60);
    }
    expect(() => game.destroy()).not.toThrow();
  });

  it('state machine: menu -> playing -> gameover -> menu', () => {
    expect(game.state).toBe('menu');

    game.startGame('arcade');
    expect(game.state).toBe('playing');

    game.coreHP = 0;
    game.onGameOver();
    expect(game.state).toBe('gameover');

    game.state = 'menu';
    expect(game.state).toBe('menu');
  });

  it('destroy clears nearMissTimeout', () => {
    game.startGame('arcade');
    game.nearMissTimeout = setTimeout(() => {}, 1000);

    game.destroy();
    expect(game.nearMissTimeout).toBeNull();
  });

  it('ports are created when game starts', () => {
    game.startGame('arcade');
    expect(game.ports.length).toBeGreaterThan(0);
  });

  it('multiple start/destroy cycles work', () => {
    game.startGame('arcade');
    game.tutorial.phase = 3;
    for (let i = 0; i < 30; i++) game.update(1 / 60);
    game.destroy();

    const { canvas } = createMockCanvas();
    const game2 = new Game(canvas);
    game2.startGame('zen');
    game2.tutorial.phase = 3;
    for (let i = 0; i < 30; i++) game2.update(1 / 60);
    expect(() => game2.destroy()).not.toThrow();
  });
});
