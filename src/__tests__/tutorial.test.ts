import { describe, it, expect } from 'vitest';
import { TutorialManager } from '../tutorial';

describe('TutorialManager', () => {
  describe('constructor', () => {
    it('starts at phase 1 for new players', () => {
      const tm = new TutorialManager(false);
      expect(tm.phase).toBe(1);
      expect(tm.timer).toBe(0);
      expect(tm.ghostSwipeAnim).toBe(0);
      expect(tm.hintText).toBe('SWIPE TO DEFLECT!');
    });

    it('skips to phase 9 for returning players', () => {
      const tm = new TutorialManager(true);
      expect(tm.phase).toBe(9);
      expect(tm.hintText).toBe('');
    });
  });

  describe('isActive', () => {
    it('returns true for phases 0 through 8', () => {
      const tm = new TutorialManager(false);
      for (let p = 0; p <= 8; p++) {
        tm.phase = p;
        expect(tm.isActive()).toBe(true);
      }
    });

    it('returns false for phase 9', () => {
      const tm = new TutorialManager(true);
      expect(tm.isActive()).toBe(false);
    });
  });

  describe('isPromptPhase', () => {
    it('returns true for phases 1, 4, 7', () => {
      const tm = new TutorialManager(false);
      for (const p of [1, 4, 7]) {
        tm.phase = p;
        expect(tm.isPromptPhase()).toBe(true);
      }
    });

    it('returns false for non-prompt phases', () => {
      const tm = new TutorialManager(false);
      for (const p of [0, 2, 3, 5, 6, 8, 9]) {
        tm.phase = p;
        expect(tm.isPromptPhase()).toBe(false);
      }
    });
  });

  describe('isIntroPhase', () => {
    it('returns true for phases 3, 6', () => {
      const tm = new TutorialManager(false);
      for (const p of [3, 6]) {
        tm.phase = p;
        expect(tm.isIntroPhase()).toBe(true);
      }
    });

    it('returns false for non-intro phases', () => {
      const tm = new TutorialManager(false);
      for (const p of [0, 1, 2, 4, 5, 7, 8, 9]) {
        tm.phase = p;
        expect(tm.isIntroPhase()).toBe(false);
      }
    });
  });

  describe('update', () => {
    it('increments timer, ghostSwipeAnim, and hintTextTimer', () => {
      const tm = new TutorialManager(false);
      tm.update(0.5);
      expect(tm.timer).toBeCloseTo(0.5);
      expect(tm.ghostSwipeAnim).toBeCloseTo(0.5);
      expect(tm.hintTextTimer).toBeCloseTo(0.5);
      tm.update(0.3);
      expect(tm.timer).toBeCloseTo(0.8);
      expect(tm.ghostSwipeAnim).toBeCloseTo(0.8);
      expect(tm.hintTextTimer).toBeCloseTo(0.8);
    });
  });

  describe('onSwipe', () => {
    it('advances from phase 1 to phase 2 and resets timer', () => {
      const tm = new TutorialManager(false);
      tm.update(1.0);
      tm.onSwipe();
      expect(tm.phase).toBe(2);
      expect(tm.timer).toBe(0);
    });

    it('advances from phase 4 to phase 5 and resets timer', () => {
      const tm = new TutorialManager(false);
      tm.phase = 4;
      tm.update(1.0);
      tm.onSwipe();
      expect(tm.phase).toBe(5);
      expect(tm.timer).toBe(0);
    });

    it('advances from phase 7 to phase 8 and resets timer', () => {
      const tm = new TutorialManager(false);
      tm.phase = 7;
      tm.update(1.0);
      tm.onSwipe();
      expect(tm.phase).toBe(8);
      expect(tm.timer).toBe(0);
    });

    it('does nothing if not in a prompt phase', () => {
      const tm = new TutorialManager(true); // phase 9
      tm.onSwipe();
      expect(tm.phase).toBe(9);
    });

    it('does nothing in resolve phases', () => {
      const tm = new TutorialManager(false);
      tm.phase = 2;
      tm.onSwipe();
      expect(tm.phase).toBe(2);
    });
  });

  describe('checkResolution', () => {
    it('transitions phase 2 -> 3 when no signals remain', () => {
      const tm = new TutorialManager(false);
      tm.phase = 2;
      const action = tm.checkResolution(0);
      expect(action).toBe('spawn_step2');
      expect(tm.phase).toBe(3);
      expect(tm.timer).toBe(0);
      expect(tm.hintText).toBe('NICE! NOW TRY TWO!');
    });

    it('transitions phase 2 -> 3 on 5s timeout', () => {
      const tm = new TutorialManager(false);
      tm.phase = 2;
      tm.update(5.1);
      const action = tm.checkResolution(1);
      expect(action).toBe('spawn_step2');
      expect(tm.phase).toBe(3);
    });

    it('transitions phase 5 -> 6 when no signals remain', () => {
      const tm = new TutorialManager(false);
      tm.phase = 5;
      const action = tm.checkResolution(0);
      expect(action).toBe('spawn_step3');
      expect(tm.phase).toBe(6);
      expect(tm.hintText).toBe('NOW MATCH THE COLOR!');
    });

    it('transitions phase 5 -> 6 on 5s timeout', () => {
      const tm = new TutorialManager(false);
      tm.phase = 5;
      tm.update(5.1);
      const action = tm.checkResolution(2);
      expect(action).toBe('spawn_step3');
      expect(tm.phase).toBe(6);
    });

    it('transitions phase 8 -> 9 when no signals remain', () => {
      const tm = new TutorialManager(false);
      tm.phase = 8;
      const action = tm.checkResolution(0);
      expect(action).toBe('complete');
      expect(tm.phase).toBe(9);
      expect(tm.hintText).toBe('');
    });

    it('transitions phase 8 -> 9 on 5s timeout', () => {
      const tm = new TutorialManager(false);
      tm.phase = 8;
      tm.update(5.1);
      const action = tm.checkResolution(1);
      expect(action).toBe('complete');
      expect(tm.phase).toBe(9);
    });

    it('returns null when conditions not met', () => {
      const tm = new TutorialManager(false);
      tm.phase = 2;
      tm.update(1.0);
      const action = tm.checkResolution(1);
      expect(action).toBeNull();
      expect(tm.phase).toBe(2);
    });

    it('returns null when not in a resolve phase', () => {
      const tm = new TutorialManager(false);
      expect(tm.checkResolution(0)).toBeNull(); // phase 1
    });
  });

  describe('checkIntroComplete', () => {
    it('transitions phase 3 -> 4 after 2s and returns spawn_step2', () => {
      const tm = new TutorialManager(false);
      tm.phase = 3;
      tm.update(2.1);
      const action = tm.checkIntroComplete();
      expect(action).toBe('spawn_step2');
      expect(tm.phase).toBe(4);
      expect(tm.timer).toBe(0);
      expect(tm.ghostSwipeAnim).toBe(0);
      expect(tm.hintText).toBe('DRAW TWO LINES!');
    });

    it('transitions phase 6 -> 7 after 2s and returns spawn_step3', () => {
      const tm = new TutorialManager(false);
      tm.phase = 6;
      tm.update(2.1);
      const action = tm.checkIntroComplete();
      expect(action).toBe('spawn_step3');
      expect(tm.phase).toBe(7);
      expect(tm.timer).toBe(0);
      expect(tm.hintText).toBe('BLUE BALL \u2192 BLUE PORT');
    });

    it('returns null before 2s', () => {
      const tm = new TutorialManager(false);
      tm.phase = 3;
      tm.update(1.5);
      const action = tm.checkIntroComplete();
      expect(action).toBeNull();
      expect(tm.phase).toBe(3);
    });

    it('returns null when not in intro phase', () => {
      const tm = new TutorialManager(false);
      tm.phase = 2;
      tm.update(3.0);
      expect(tm.checkIntroComplete()).toBeNull();
    });
  });

  describe('full phase progression', () => {
    it('progresses 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9', () => {
      const tm = new TutorialManager(false);
      expect(tm.phase).toBe(1);
      expect(tm.hintText).toBe('SWIPE TO DEFLECT!');

      // Step 1: swipe
      tm.update(0.5);
      tm.onSwipe();
      expect(tm.phase).toBe(2);

      // Step 1: resolve (signals gone)
      const a1 = tm.checkResolution(0);
      expect(a1).toBe('spawn_step2');
      expect(tm.phase).toBe(3);
      expect(tm.hintText).toBe('NICE! NOW TRY TWO!');

      // Step 2: intro wait
      tm.update(2.1);
      const a2 = tm.checkIntroComplete();
      expect(a2).toBe('spawn_step2');
      expect(tm.phase).toBe(4);
      expect(tm.hintText).toBe('DRAW TWO LINES!');

      // Step 2: swipe
      tm.onSwipe();
      expect(tm.phase).toBe(5);

      // Step 2: resolve (signals gone)
      const a3 = tm.checkResolution(0);
      expect(a3).toBe('spawn_step3');
      expect(tm.phase).toBe(6);
      expect(tm.hintText).toBe('NOW MATCH THE COLOR!');

      // Step 3: intro wait
      tm.update(2.1);
      const a4 = tm.checkIntroComplete();
      expect(a4).toBe('spawn_step3');
      expect(tm.phase).toBe(7);
      expect(tm.hintText).toBe('BLUE BALL \u2192 BLUE PORT');

      // Step 3: swipe
      tm.onSwipe();
      expect(tm.phase).toBe(8);

      // Step 3: resolve (signals gone)
      const a5 = tm.checkResolution(0);
      expect(a5).toBe('complete');
      expect(tm.phase).toBe(9);
      expect(tm.isActive()).toBe(false);
    });

    it('handles timeout-based progression', () => {
      const tm = new TutorialManager(false);

      // Phase 1 -> 2 via swipe
      tm.onSwipe();
      expect(tm.phase).toBe(2);

      // Phase 2 -> 3 via timeout
      tm.update(5.1);
      tm.checkResolution(1);
      expect(tm.phase).toBe(3);

      // Phase 3 -> 4 via intro timer
      tm.update(2.1);
      tm.checkIntroComplete();
      expect(tm.phase).toBe(4);

      // Phase 4 -> 5 via swipe
      tm.onSwipe();
      expect(tm.phase).toBe(5);

      // Phase 5 -> 6 via timeout
      tm.update(5.1);
      tm.checkResolution(2);
      expect(tm.phase).toBe(6);

      // Phase 6 -> 7 via intro timer
      tm.update(2.1);
      tm.checkIntroComplete();
      expect(tm.phase).toBe(7);

      // Phase 7 -> 8 via swipe
      tm.onSwipe();
      expect(tm.phase).toBe(8);

      // Phase 8 -> 9 via timeout
      tm.update(5.1);
      tm.checkResolution(1);
      expect(tm.phase).toBe(9);
    });
  });

  describe('reset', () => {
    it('resets to phase 1 for new players', () => {
      const tm = new TutorialManager(true);
      expect(tm.phase).toBe(9);

      tm.reset(false);
      expect(tm.phase).toBe(1);
      expect(tm.timer).toBe(0);
      expect(tm.ghostSwipeAnim).toBe(0);
      expect(tm.hintText).toBe('SWIPE TO DEFLECT!');
      expect(tm.hintTextTimer).toBe(0);
    });

    it('resets to phase 9 for returning players', () => {
      const tm = new TutorialManager(false);
      tm.onSwipe();
      tm.update(2.0);

      tm.reset(true);
      expect(tm.phase).toBe(9);
      expect(tm.timer).toBe(0);
      expect(tm.ghostSwipeAnim).toBe(0);
      expect(tm.hintText).toBe('');
    });

    it('clears accumulated timer and animation', () => {
      const tm = new TutorialManager(false);
      tm.update(5.0);
      expect(tm.timer).toBeCloseTo(5.0);

      tm.reset(false);
      expect(tm.timer).toBe(0);
      expect(tm.ghostSwipeAnim).toBe(0);
      expect(tm.hintTextTimer).toBe(0);
    });
  });
});
