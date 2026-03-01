import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../score';

describe('ScoreManager', () => {
  let sm: ScoreManager;

  beforeEach(() => {
    sm = new ScoreManager();
  });

  describe('initial state', () => {
    it('starts with zeroed scoring fields', () => {
      expect(sm.score).toBe(0);
      expect(sm.combo).toBe(0);
      expect(sm.maxCombo).toBe(0);
      expect(sm.catches).toBe(0);
      expect(sm.misses).toBe(0);
      expect(sm.displayScore).toBe(0);
      expect(sm.colorMisses).toEqual({});
    });

    it('starts with zeroed persistence fields', () => {
      expect(sm.highScore).toBe(0);
      expect(sm.dailyBest).toBe(0);
      expect(sm.hasPlayedBefore).toBe(false);
    });
  });

  describe('addCatch', () => {
    it('increments combo and returns points', () => {
      const points = sm.addCatch();
      expect(points).toBe(10);
      expect(sm.combo).toBe(1);
      expect(sm.catches).toBe(1);
      expect(sm.score).toBe(10);
    });

    it('scales points by combo', () => {
      sm.addCatch(); // combo=1, 10 pts
      const points = sm.addCatch(); // combo=2, 20 pts
      expect(points).toBe(20);
      expect(sm.score).toBe(30);
      expect(sm.combo).toBe(2);
    });

    it('tracks maxCombo', () => {
      sm.addCatch();
      sm.addCatch();
      sm.addCatch(); // combo=3
      expect(sm.maxCombo).toBe(3);
      sm.addMiss(); // resets combo
      sm.addCatch(); // combo=1
      expect(sm.maxCombo).toBe(3); // unchanged
    });

    it('accumulates catches count', () => {
      sm.addCatch();
      sm.addCatch();
      sm.addCatch();
      expect(sm.catches).toBe(3);
    });
  });

  describe('addMiss', () => {
    it('resets combo and increments misses', () => {
      sm.addCatch();
      sm.addCatch();
      sm.addMiss();
      expect(sm.combo).toBe(0);
      expect(sm.misses).toBe(1);
    });

    it('tracks color misses', () => {
      sm.addMiss('red');
      sm.addMiss('red');
      sm.addMiss('blue');
      expect(sm.colorMisses).toEqual({ red: 2, blue: 1 });
    });

    it('handles miss without color', () => {
      sm.addMiss();
      expect(sm.misses).toBe(1);
      expect(sm.colorMisses).toEqual({});
    });
  });

  describe('resetCombo', () => {
    it('resets combo to zero', () => {
      sm.addCatch();
      sm.addCatch();
      sm.resetCombo();
      expect(sm.combo).toBe(0);
    });
  });

  describe('updateDisplayScore', () => {
    it('lerps displayScore toward score', () => {
      sm.score = 100;
      sm.updateDisplayScore(0.1); // dt=0.1 => factor = 0.1*10 = 1.0
      // lerp(0, 100, 1.0) = 100
      expect(sm.displayScore).toBe(100);
    });

    it('partially lerps with small dt', () => {
      sm.score = 100;
      sm.updateDisplayScore(0.01); // factor = 0.1
      // lerp(0, 100, 0.1) = 10
      expect(sm.displayScore).toBeCloseTo(10);
    });
  });

  describe('getWorstColor', () => {
    it('returns null when no color misses', () => {
      expect(sm.getWorstColor()).toBeNull();
    });

    it('returns the color with most misses', () => {
      sm.addMiss('red');
      sm.addMiss('blue');
      sm.addMiss('blue');
      expect(sm.getWorstColor()).toBe('blue');
    });
  });

  describe('finalizeScores', () => {
    it('updates highScore if current score is higher', () => {
      sm.score = 500;
      const changed = sm.finalizeScores('arcade');
      expect(changed).toBe(true);
      expect(sm.highScore).toBe(500);
    });

    it('does not update highScore if current score is lower', () => {
      sm.highScore = 1000;
      sm.score = 500;
      const changed = sm.finalizeScores('arcade');
      expect(changed).toBe(false);
      expect(sm.highScore).toBe(1000);
    });

    it('updates dailyBest in daily mode', () => {
      sm.score = 300;
      const changed = sm.finalizeScores('daily');
      expect(changed).toBe(true);
      expect(sm.dailyBest).toBe(300);
    });

    it('does not update dailyBest in arcade mode', () => {
      sm.score = 300;
      sm.finalizeScores('arcade');
      expect(sm.dailyBest).toBe(0);
    });
  });

  describe('reset', () => {
    it('clears all scoring state', () => {
      sm.addCatch();
      sm.addCatch();
      sm.addMiss('red');
      sm.score = 999;
      sm.displayScore = 500;

      sm.reset();

      expect(sm.score).toBe(0);
      expect(sm.combo).toBe(0);
      expect(sm.maxCombo).toBe(0);
      expect(sm.catches).toBe(0);
      expect(sm.misses).toBe(0);
      expect(sm.displayScore).toBe(0);
      expect(sm.colorMisses).toEqual({});
    });

    it('preserves persistence fields', () => {
      sm.highScore = 1000;
      sm.dailyBest = 500;
      sm.hasPlayedBefore = true;

      sm.reset();

      expect(sm.highScore).toBe(1000);
      expect(sm.dailyBest).toBe(500);
      expect(sm.hasPlayedBefore).toBe(true);
    });
  });

  describe('loadHighScores', () => {
    it('loads highScore from localStorage', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'deflect_high') return '42';
          if (key === 'deflect_played') return '1';
          return null;
        }),
        setItem: vi.fn(),
      });

      sm.loadHighScores();
      expect(sm.highScore).toBe(42);
      expect(sm.hasPlayedBefore).toBe(true);

      vi.unstubAllGlobals();
    });

    it('defaults to 0 for NaN highScore', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'deflect_high') return 'not_a_number';
          return null;
        }),
        setItem: vi.fn(),
      });

      sm.loadHighScores();
      expect(sm.highScore).toBe(0);

      vi.unstubAllGlobals();
    });

    it('survives localStorage errors', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => {
          throw new Error('quota exceeded');
        }),
        setItem: vi.fn(),
      });

      expect(() => sm.loadHighScores()).not.toThrow();

      vi.unstubAllGlobals();
    });
  });

  describe('saveHighScores', () => {
    it('persists highScore', () => {
      const setItem = vi.fn();
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem,
      });

      sm.highScore = 999;
      sm.saveHighScores('arcade', 0);
      expect(setItem).toHaveBeenCalledWith('deflect_high', '999');

      vi.unstubAllGlobals();
    });

    it('persists daily data in daily mode', () => {
      const setItem = vi.fn();
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem,
      });

      sm.dailyBest = 200;
      sm.saveHighScores('daily', 12345);
      expect(setItem).toHaveBeenCalledWith('deflect_high', '0');
      expect(setItem).toHaveBeenCalledWith(
        'deflect_daily',
        JSON.stringify({ seed: 12345, score: 200 }),
      );

      vi.unstubAllGlobals();
    });

    it('survives localStorage errors', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new Error('quota exceeded');
        }),
      });

      expect(() => sm.saveHighScores('arcade', 0)).not.toThrow();

      vi.unstubAllGlobals();
    });
  });
});
