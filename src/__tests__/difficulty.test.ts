import { describe, it, expect } from 'vitest';
import { DifficultyManager } from '../difficulty';
import { DEFAULT_CONFIG } from '../types';

function makeDM() {
  return new DifficultyManager({ ...DEFAULT_CONFIG });
}

describe('DifficultyManager', () => {
  describe('constructor', () => {
    it('initializes with config defaults', () => {
      const dm = makeDM();
      expect(dm.activeColors).toBe(1);
      expect(dm.signalSpeed).toBe(DEFAULT_CONFIG.signalSpeed);
      expect(dm.spawnInterval).toBe(2.0);
      expect(dm.prevColorCount).toBe(0);
    });
  });

  describe('reset', () => {
    it('resets all fields to initial values', () => {
      const dm = makeDM();
      dm.update(60, 'arcade');
      dm.reset({ ...DEFAULT_CONFIG });
      expect(dm.activeColors).toBe(1);
      expect(dm.signalSpeed).toBe(DEFAULT_CONFIG.signalSpeed);
      expect(dm.spawnInterval).toBe(2.0);
      expect(dm.prevColorCount).toBe(0);
    });
  });

  describe('arcade mode progression', () => {
    it('starts with 1 color at t=0', () => {
      const dm = makeDM();
      dm.update(0, 'arcade');
      expect(dm.activeColors).toBe(1);
      expect(dm.signalSpeed).toBe(90);
      expect(dm.spawnInterval).toBe(2.5);
    });

    it('moves to 2 colors at t=15', () => {
      const dm = makeDM();
      dm.update(15, 'arcade');
      expect(dm.activeColors).toBe(2);
      expect(dm.signalSpeed).toBe(110);
      expect(dm.spawnInterval).toBe(2.0);
    });

    it('moves to 3 colors at t=35', () => {
      const dm = makeDM();
      dm.update(35, 'arcade');
      expect(dm.activeColors).toBe(3);
      expect(dm.signalSpeed).toBe(130);
      expect(dm.spawnInterval).toBe(1.5);
    });

    it('moves to 4 colors at t=60', () => {
      const dm = makeDM();
      dm.update(60, 'arcade');
      expect(dm.activeColors).toBe(4);
      expect(dm.signalSpeed).toBe(155);
      expect(dm.spawnInterval).toBe(1.2);
    });

    it('ramps speed and spawn rate after t=90', () => {
      const dm = makeDM();
      dm.update(100, 'arcade');
      expect(dm.activeColors).toBe(4);
      expect(dm.signalSpeed).toBe(155 + 10 * 1.2);
      expect(dm.spawnInterval).toBe(Math.max(0.5, 1.2 - 10 * 0.006));
    });

    it('clamps spawnInterval at 0.5 minimum', () => {
      const dm = makeDM();
      dm.update(500, 'arcade');
      expect(dm.spawnInterval).toBe(0.5);
    });
  });

  describe('zen mode progression', () => {
    it('starts with 1 color at t=0', () => {
      const dm = makeDM();
      dm.update(0, 'zen');
      expect(dm.activeColors).toBe(1);
      expect(dm.signalSpeed).toBe(70);
      expect(dm.spawnInterval).toBe(3.0);
    });

    it('moves to 2 colors at t=30', () => {
      const dm = makeDM();
      dm.update(30, 'zen');
      expect(dm.activeColors).toBe(2);
      expect(dm.signalSpeed).toBe(85);
      expect(dm.spawnInterval).toBe(2.5);
    });

    it('moves to 3 colors at t=70', () => {
      const dm = makeDM();
      dm.update(70, 'zen');
      expect(dm.activeColors).toBe(3);
      expect(dm.signalSpeed).toBe(100);
      expect(dm.spawnInterval).toBe(2.0);
    });

    it('caps at 3 colors after t=120', () => {
      const dm = makeDM();
      dm.update(150, 'zen');
      expect(dm.activeColors).toBe(3);
    });

    it('ramps speed gently after t=120', () => {
      const dm = makeDM();
      dm.update(130, 'zen');
      expect(dm.signalSpeed).toBe(Math.min(120, 100 + 10 * 0.3));
    });

    it('clamps speed at 120 in zen', () => {
      const dm = makeDM();
      dm.update(500, 'zen');
      expect(dm.signalSpeed).toBe(120);
    });

    it('clamps spawnInterval at 1.5 in zen', () => {
      const dm = makeDM();
      dm.update(500, 'zen');
      expect(dm.spawnInterval).toBe(1.5);
    });
  });

  describe('color change detection', () => {
    it('returns true when color count changes', () => {
      const dm = makeDM();
      // First update from 0 -> 1 colors
      const first = dm.update(0, 'arcade');
      expect(first).toBe(true);
    });

    it('returns false when color count stays the same', () => {
      const dm = makeDM();
      dm.update(0, 'arcade');
      const second = dm.update(5, 'arcade');
      expect(second).toBe(false);
    });

    it('returns true on transition from 1 to 2 colors', () => {
      const dm = makeDM();
      dm.update(10, 'arcade'); // 1 color
      const changed = dm.update(20, 'arcade'); // 2 colors
      expect(changed).toBe(true);
      expect(dm.activeColors).toBe(2);
    });

    it('tracks prevColorCount correctly through multiple transitions', () => {
      const dm = makeDM();
      dm.update(0, 'arcade');
      expect(dm.prevColorCount).toBe(1);
      dm.update(20, 'arcade');
      expect(dm.prevColorCount).toBe(2);
      dm.update(40, 'arcade');
      expect(dm.prevColorCount).toBe(3);
      dm.update(70, 'arcade');
      expect(dm.prevColorCount).toBe(4);
    });
  });

  describe('daily mode', () => {
    it('uses arcade difficulty curve for daily mode', () => {
      const dm = makeDM();
      dm.update(60, 'daily');
      expect(dm.activeColors).toBe(4);
      expect(dm.signalSpeed).toBe(155);
      expect(dm.spawnInterval).toBe(1.2);
    });
  });
});
