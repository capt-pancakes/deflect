import { describe, it, expect, beforeEach } from 'vitest';
import { SongPlayer } from '../song-player';
import type { SongData } from '../song-data';

function createTestSongData(): SongData {
  return {
    title: 'Test',
    artist: 'Test',
    duration: 10,
    bpm: 120,
    bpmSections: [{ time: 0, bpm: 120 }],
    beats: [
      { time: 0.0, type: 'kick', intensity: 1.0 },
      { time: 0.5, type: 'hat', intensity: 0.6 },
      { time: 1.0, type: 'snare', intensity: 0.9 },
      { time: 1.5, type: 'kick', intensity: 1.0 },
      { time: 2.0, type: 'hat', intensity: 0.5 },
    ],
    energy: [
      { time: 0.0, low: 0.8, mid: 0.3, high: 0.2, total: 0.5 },
      { time: 0.5, low: 0.2, mid: 0.5, high: 0.7, total: 0.4 },
      { time: 1.0, low: 0.9, mid: 0.4, high: 0.1, total: 0.6 },
    ],
    events: [
      { time: 0, type: 'intro', duration: 2 },
      { time: 4, type: 'drop', duration: 4 },
    ],
  };
}

describe('SongPlayer', () => {
  let player: SongPlayer;

  beforeEach(() => {
    player = new SongPlayer();
  });

  describe('initialization', () => {
    it('starts with zero intensities', () => {
      const state = player.getBeatState();
      expect(state.kickIntensity).toBe(0);
      expect(state.snareIntensity).toBe(0);
      expect(state.hatIntensity).toBe(0);
      expect(state.beatPhase).toBe(0);
      expect(state.visualIntensity).toBe(0);
    });
  });

  describe('loadSongData', () => {
    it('stores song data and sets BPM', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      expect(player.getBeatState().bpm).toBe(120);
    });
  });

  describe('updateAtTime (core sync logic)', () => {
    it('triggers kick intensity when passing a kick beat', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(0.01, 0.016); // just past first beat (kick at t=0)
      expect(player.getBeatState().kickIntensity).toBe(1);
    });

    it('triggers hat intensity when passing a hat beat', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(0.51, 0.016); // just past hat at t=0.5
      expect(player.getBeatState().hatIntensity).toBeGreaterThan(0);
    });

    it('triggers snare intensity when passing a snare beat', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(1.01, 0.016); // just past snare at t=1.0
      expect(player.getBeatState().snareIntensity).toBeGreaterThan(0);
    });

    it('decays intensities over time', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(0.01, 0.016); // trigger kick
      const initial = player.getBeatState().kickIntensity;
      player.updateAtTime(0.2, 0.016); // 200ms later, no new beat
      expect(player.getBeatState().kickIntensity).toBeLessThan(initial);
    });

    it('computes beatPhase between beats', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      // Halfway between beat at 0.0 and beat at 0.5
      player.updateAtTime(0.25, 0.016);
      expect(player.getBeatState().beatPhase).toBeCloseTo(0.5, 1);
    });

    it('does not re-trigger already-passed beats', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(0.01, 0.016); // trigger kick at t=0
      player.updateAtTime(0.3, 0.016);  // decay
      const decayed = player.getBeatState().kickIntensity;
      player.updateAtTime(0.4, 0.016);  // still before next beat
      expect(player.getBeatState().kickIntensity).toBeLessThanOrEqual(decayed);
    });
  });

  describe('setIntensityLevel', () => {
    it('maps layer count to visualIntensity with floor of 0.5', () => {
      player.setIntensityLevel(1);
      expect(player.getBeatState().visualIntensity).toBeCloseTo(0.5);
      player.setIntensityLevel(3);
      expect(player.getBeatState().visualIntensity).toBeCloseTo(0.6);
      player.setIntensityLevel(5);
      expect(player.getBeatState().visualIntensity).toBeCloseTo(1.0);
    });
  });

  describe('getCurrentEvent', () => {
    it('returns the current song event based on time', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(1.0, 0.016); // during intro (0-2s)
      expect(player.getCurrentEvent()?.type).toBe('intro');
      player.updateAtTime(5.0, 0.016); // during drop (4-8s)
      expect(player.getCurrentEvent()?.type).toBe('drop');
    });
  });
});
