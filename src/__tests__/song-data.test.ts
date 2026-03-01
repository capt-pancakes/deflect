import { describe, it, expect } from 'vitest';
import type { SongData } from '../song-data';

function createTestSongData(): SongData {
  return {
    title: 'Test Track',
    artist: 'Test Artist',
    duration: 120,
    bpm: 128,
    bpmSections: [{ time: 0, bpm: 128 }],
    beats: [
      { time: 0.0, type: 'kick', intensity: 1.0 },
      { time: 0.469, type: 'hat', intensity: 0.6 },
      { time: 0.938, type: 'snare', intensity: 0.9 },
    ],
    energy: [
      { time: 0.0, low: 0.8, mid: 0.3, high: 0.2, total: 0.5 },
    ],
    events: [
      { time: 0, type: 'intro', duration: 8 },
      { time: 60, type: 'drop', duration: 16 },
    ],
  };
}

describe('SongData', () => {
  it('has required metadata fields', () => {
    const data = createTestSongData();
    expect(data.title).toBe('Test Track');
    expect(data.artist).toBe('Test Artist');
    expect(data.duration).toBe(120);
    expect(data.bpm).toBe(128);
  });

  it('beats are sorted by time', () => {
    const data = createTestSongData();
    for (let i = 1; i < data.beats.length; i++) {
      expect(data.beats[i].time).toBeGreaterThanOrEqual(data.beats[i - 1].time);
    }
  });

  it('energy frames are sorted by time', () => {
    const data = createTestSongData();
    for (let i = 1; i < data.energy.length; i++) {
      expect(data.energy[i].time).toBeGreaterThanOrEqual(data.energy[i - 1].time);
    }
  });

  it('beat intensities are 0-1', () => {
    const data = createTestSongData();
    for (const beat of data.beats) {
      expect(beat.intensity).toBeGreaterThanOrEqual(0);
      expect(beat.intensity).toBeLessThanOrEqual(1);
    }
  });

  it('energy values are 0-1', () => {
    const data = createTestSongData();
    for (const frame of data.energy) {
      expect(frame.low).toBeGreaterThanOrEqual(0);
      expect(frame.low).toBeLessThanOrEqual(1);
      expect(frame.mid).toBeGreaterThanOrEqual(0);
      expect(frame.mid).toBeLessThanOrEqual(1);
      expect(frame.high).toBeGreaterThanOrEqual(0);
      expect(frame.high).toBeLessThanOrEqual(1);
      expect(frame.total).toBeGreaterThanOrEqual(0);
      expect(frame.total).toBeLessThanOrEqual(1);
    }
  });
});

export { createTestSongData };
