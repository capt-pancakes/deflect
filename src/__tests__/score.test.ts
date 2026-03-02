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
      sm.modeBests.arcade = 1000;
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

  describe('daily streak', () => {
    it('starts with zero streak', () => {
      expect(sm.dailyStreak).toBe(0);
    });

    it('updateDailyStreak sets streak to 1 on first daily play', () => {
      sm.updateDailyStreak();
      expect(sm.dailyStreak).toBe(1);
    });

    it('updateDailyStreak increments when last play was yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      sm['_streakLastDate'] = yesterday.toISOString().split('T')[0];
      sm.dailyStreak = 3;
      sm.updateDailyStreak();
      expect(sm.dailyStreak).toBe(4);
    });

    it('updateDailyStreak does not increment when already played today', () => {
      const today = new Date().toISOString().split('T')[0];
      sm['_streakLastDate'] = today;
      sm.dailyStreak = 3;
      sm.updateDailyStreak();
      expect(sm.dailyStreak).toBe(3);
    });

    it('updateDailyStreak resets when last play was 2+ days ago', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      sm['_streakLastDate'] = twoDaysAgo.toISOString().split('T')[0];
      sm.dailyStreak = 5;
      sm.updateDailyStreak();
      expect(sm.dailyStreak).toBe(1);
    });

    it('saveDailyStreak persists to localStorage', () => {
      const setItem = vi.fn();
      vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem });
      sm.dailyStreak = 3;
      sm['_streakLastDate'] = new Date().toISOString().split('T')[0];
      sm.saveDailyStreak();
      const call = setItem.mock.calls.find((c: string[]) => c[0] === 'deflect_streak');
      expect(call).toBeDefined();
      const saved = JSON.parse(call![1]);
      expect(saved.count).toBe(3);
      expect(saved.lastDate).toBe(new Date().toISOString().split('T')[0]);
      vi.unstubAllGlobals();
    });

    it('loadDailyStreak restores streak from localStorage', () => {
      const today = new Date().toISOString().split('T')[0];
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'deflect_streak') return JSON.stringify({ lastDate: today, count: 7 });
          return null;
        }),
        setItem: vi.fn(),
      });
      sm.loadDailyStreak();
      expect(sm.dailyStreak).toBe(7);
      vi.unstubAllGlobals();
    });

    it('loadDailyStreak resets if last play was 2+ days ago', () => {
      const old = new Date();
      old.setDate(old.getDate() - 3);
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'deflect_streak') return JSON.stringify({ lastDate: old.toISOString().split('T')[0], count: 7 });
          return null;
        }),
        setItem: vi.fn(),
      });
      sm.loadDailyStreak();
      expect(sm.dailyStreak).toBe(0);
      vi.unstubAllGlobals();
    });
  });

  describe('per-mode bests', () => {
    it('starts with zeroed modeBests', () => {
      expect(sm.modeBests).toEqual({ arcade: 0, zen: 0, daily: 0 });
    });

    it('finalizeScores updates modeBests for arcade', () => {
      sm.score = 500;
      sm.finalizeScores('arcade');
      expect(sm.modeBests.arcade).toBe(500);
    });

    it('finalizeScores updates modeBests for zen', () => {
      sm.score = 300;
      sm.finalizeScores('zen');
      expect(sm.modeBests.zen).toBe(300);
    });

    it('finalizeScores does not downgrade modeBests', () => {
      sm.modeBests.arcade = 1000;
      sm.score = 500;
      sm.finalizeScores('arcade');
      expect(sm.modeBests.arcade).toBe(1000);
    });

    it('loadHighScores loads per-mode bests from localStorage', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'deflect_best_arcade') return '1200';
          if (key === 'deflect_best_zen') return '800';
          if (key === 'deflect_best_daily') return '600';
          return null;
        }),
        setItem: vi.fn(),
      });
      sm.loadHighScores();
      expect(sm.modeBests).toEqual({ arcade: 1200, zen: 800, daily: 600 });
      vi.unstubAllGlobals();
    });

    it('saveHighScores persists per-mode bests', () => {
      const setItem = vi.fn();
      vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem });
      sm.modeBests = { arcade: 1200, zen: 800, daily: 600 };
      sm.saveHighScores('arcade', 0);
      expect(setItem).toHaveBeenCalledWith('deflect_best_arcade', '1200');
      expect(setItem).toHaveBeenCalledWith('deflect_best_zen', '800');
      expect(setItem).toHaveBeenCalledWith('deflect_best_daily', '600');
      vi.unstubAllGlobals();
    });

    it('reset preserves modeBests', () => {
      sm.modeBests.arcade = 1000;
      sm.reset();
      expect(sm.modeBests.arcade).toBe(1000);
    });
  });
});
