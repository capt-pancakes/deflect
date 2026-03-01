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

  describe('update', () => {
    it('decays kick intensity over time', () => {
      const engine = new MusicEngine({ intensityDecayRate: 10 });
      engine.triggerKick();
      expect(engine.getBeatState().kickIntensity).toBe(1);
      engine.update(0.05);
      expect(engine.getBeatState().kickIntensity).toBeLessThan(1);
      expect(engine.getBeatState().kickIntensity).toBeGreaterThan(0);
    });

    it('decays snare intensity over time', () => {
      const engine = new MusicEngine({ intensityDecayRate: 10 });
      engine.triggerSnare();
      expect(engine.getBeatState().snareIntensity).toBe(1);
      engine.update(0.1);
      expect(engine.getBeatState().snareIntensity).toBeLessThan(1);
    });

    it('decays hat intensity over time', () => {
      const engine = new MusicEngine({ intensityDecayRate: 10 });
      engine.triggerHat();
      expect(engine.getBeatState().hatIntensity).toBe(1);
      engine.update(0.1);
      expect(engine.getBeatState().hatIntensity).toBeLessThan(1);
    });

    it('clamps intensity to 0', () => {
      const engine = new MusicEngine({ intensityDecayRate: 100 });
      engine.triggerKick();
      engine.update(1);
      expect(engine.getBeatState().kickIntensity).toBe(0);
    });
  });

  describe('setIntensityLevel', () => {
    it('maps layer count to visualIntensity', () => {
      const engine = new MusicEngine();
      engine.setIntensityLevel(1);
      expect(engine.getBeatState().visualIntensity).toBeCloseTo(0.2);
      engine.setIntensityLevel(3);
      expect(engine.getBeatState().visualIntensity).toBeCloseTo(0.6);
      engine.setIntensityLevel(5);
      expect(engine.getBeatState().visualIntensity).toBeCloseTo(1.0);
    });
  });
});
