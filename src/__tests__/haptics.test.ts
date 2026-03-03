import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  vibrateOnCatch,
  vibrateOnMiss,
  vibrateOnMilestone,
  setHapticsEnabled,
} from '../haptics';

describe('haptics', () => {
  let vibrateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vibrateMock = vi.fn(() => true);
    vi.stubGlobal('navigator', { vibrate: vibrateMock });
    setHapticsEnabled(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('vibrateOnCatch', () => {
    it('vibrates for 15ms on catch', () => {
      vibrateOnCatch();
      expect(vibrateMock).toHaveBeenCalledWith(15);
    });
  });

  describe('vibrateOnMiss', () => {
    it('vibrates with double pulse pattern on miss', () => {
      vibrateOnMiss();
      expect(vibrateMock).toHaveBeenCalledWith([10, 50, 10]);
    });
  });

  describe('vibrateOnMilestone', () => {
    it('vibrates for 40ms on milestone', () => {
      vibrateOnMilestone();
      expect(vibrateMock).toHaveBeenCalledWith(40);
    });
  });

  describe('when navigator.vibrate is undefined', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', {});
    });

    it('vibrateOnCatch does not throw', () => {
      expect(() => vibrateOnCatch()).not.toThrow();
    });

    it('vibrateOnMiss does not throw', () => {
      expect(() => vibrateOnMiss()).not.toThrow();
    });

    it('vibrateOnMilestone does not throw', () => {
      expect(() => vibrateOnMilestone()).not.toThrow();
    });
  });

  describe('when disabled', () => {
    beforeEach(() => {
      setHapticsEnabled(false);
    });

    it('vibrateOnCatch does not vibrate', () => {
      vibrateOnCatch();
      expect(vibrateMock).not.toHaveBeenCalled();
    });

    it('vibrateOnMiss does not vibrate', () => {
      vibrateOnMiss();
      expect(vibrateMock).not.toHaveBeenCalled();
    });

    it('vibrateOnMilestone does not vibrate', () => {
      vibrateOnMilestone();
      expect(vibrateMock).not.toHaveBeenCalled();
    });
  });

  describe('setHapticsEnabled', () => {
    it('re-enabling allows vibrations again', () => {
      setHapticsEnabled(false);
      vibrateOnCatch();
      expect(vibrateMock).not.toHaveBeenCalled();

      setHapticsEnabled(true);
      vibrateOnCatch();
      expect(vibrateMock).toHaveBeenCalledWith(15);
    });
  });
});
