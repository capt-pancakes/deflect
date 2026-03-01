import { describe, it, expect } from 'vitest';
import { TutorialManager } from '../tutorial';

describe('TutorialManager', () => {
  describe('constructor', () => {
    it('starts at phase 1 for new players', () => {
      const tm = new TutorialManager(false);
      expect(tm.phase).toBe(1);
      expect(tm.timer).toBe(0);
      expect(tm.ghostSwipeAnim).toBe(0);
    });

    it('skips to phase 3 for returning players', () => {
      const tm = new TutorialManager(true);
      expect(tm.phase).toBe(3);
    });
  });

  describe('isActive', () => {
    it('returns true for phases 0, 1, 2', () => {
      const tm = new TutorialManager(false);
      tm.phase = 0;
      expect(tm.isActive()).toBe(true);
      tm.phase = 1;
      expect(tm.isActive()).toBe(true);
      tm.phase = 2;
      expect(tm.isActive()).toBe(true);
    });

    it('returns false for phase 3', () => {
      const tm = new TutorialManager(true);
      expect(tm.isActive()).toBe(false);
    });
  });

  describe('update', () => {
    it('increments timer and ghostSwipeAnim', () => {
      const tm = new TutorialManager(false);
      tm.update(0.5);
      expect(tm.timer).toBeCloseTo(0.5);
      expect(tm.ghostSwipeAnim).toBeCloseTo(0.5);
      tm.update(0.3);
      expect(tm.timer).toBeCloseTo(0.8);
      expect(tm.ghostSwipeAnim).toBeCloseTo(0.8);
    });
  });

  describe('onSwipe', () => {
    it('advances from phase 1 to phase 2 and resets timer', () => {
      const tm = new TutorialManager(false);
      tm.update(1.0); // accumulate some timer
      tm.onSwipe();
      expect(tm.phase).toBe(2);
      expect(tm.timer).toBe(0);
    });

    it('does nothing if not in phase 1', () => {
      const tm = new TutorialManager(true); // phase 3
      tm.onSwipe();
      expect(tm.phase).toBe(3);
    });

    it('does nothing if already in phase 2', () => {
      const tm = new TutorialManager(false);
      tm.onSwipe(); // -> phase 2
      tm.onSwipe(); // should stay phase 2
      expect(tm.phase).toBe(2);
    });
  });

  describe('checkCompletion', () => {
    it('completes when no signals remain in phase 2', () => {
      const tm = new TutorialManager(false);
      tm.onSwipe(); // -> phase 2
      const action = tm.checkCompletion(0);
      expect(action).toBe('complete');
      expect(tm.phase).toBe(3);
    });

    it('completes when timer exceeds 3 seconds in phase 2', () => {
      const tm = new TutorialManager(false);
      tm.onSwipe(); // -> phase 2
      tm.update(3.1);
      const action = tm.checkCompletion(1); // signals still exist
      expect(action).toBe('complete');
      expect(tm.phase).toBe(3);
    });

    it('returns null when phase 2 conditions not met', () => {
      const tm = new TutorialManager(false);
      tm.onSwipe(); // -> phase 2
      tm.update(1.0); // only 1 second
      const action = tm.checkCompletion(1); // signals still exist
      expect(action).toBeNull();
      expect(tm.phase).toBe(2);
    });

    it('returns null when not in phase 2', () => {
      const tm = new TutorialManager(false); // phase 1
      const action = tm.checkCompletion(0);
      expect(action).toBeNull();
    });
  });

  describe('phase progression', () => {
    it('progresses 1 -> 2 -> 3 through full tutorial flow', () => {
      const tm = new TutorialManager(false);
      expect(tm.phase).toBe(1);

      tm.update(0.5);
      tm.onSwipe();
      expect(tm.phase).toBe(2);

      // Signal gets caught (0 remaining)
      const action = tm.checkCompletion(0);
      expect(action).toBe('complete');
      expect(tm.phase).toBe(3);
      expect(tm.isActive()).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets to phase 1 for new players', () => {
      const tm = new TutorialManager(true); // initially skipped
      expect(tm.phase).toBe(3);

      tm.reset(false);
      expect(tm.phase).toBe(1);
      expect(tm.timer).toBe(0);
      expect(tm.ghostSwipeAnim).toBe(0);
    });

    it('resets to phase 3 for returning players', () => {
      const tm = new TutorialManager(false);
      tm.onSwipe();
      tm.update(2.0);

      tm.reset(true);
      expect(tm.phase).toBe(3);
      expect(tm.timer).toBe(0);
      expect(tm.ghostSwipeAnim).toBe(0);
    });

    it('clears accumulated timer and animation', () => {
      const tm = new TutorialManager(false);
      tm.update(5.0);
      expect(tm.timer).toBeCloseTo(5.0);

      tm.reset(false);
      expect(tm.timer).toBe(0);
      expect(tm.ghostSwipeAnim).toBe(0);
    });
  });
});
