import { describe, it, expect } from 'vitest';
import { MusicEngine, DEFAULT_MUSIC_CONFIG } from '../music';

describe('MusicEngine', () => {
  describe('config', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_MUSIC_CONFIG.bpm).toBe(110);
      expect(DEFAULT_MUSIC_CONFIG.layers).toBe(1);
      expect(DEFAULT_MUSIC_CONFIG.masterVolume).toBeGreaterThan(0);
      expect(DEFAULT_MUSIC_CONFIG.masterVolume).toBeLessThanOrEqual(1);
    });
  });

  describe('BeatState', () => {
    it('initializes with zero intensities', () => {
      const engine = new MusicEngine();
      const state = engine.getBeatState();
      expect(state.kickIntensity).toBe(0);
      expect(state.snareIntensity).toBe(0);
      expect(state.hatIntensity).toBe(0);
      expect(state.beatPhase).toBe(0);
      expect(state.visualIntensity).toBe(0);
    });
  });
});
