import { describe, it, expect } from 'vitest';
import { SongPlayer } from '../song-player';
import testSongData from '../../songs/test-track.json';
import type { SongData } from '../song-data';

describe('SongPlayer integration with real song data', () => {
  it('loads and plays through test track data', () => {
    const player = new SongPlayer();
    player.loadSongData(testSongData as SongData);

    // Simulate playback at 60fps for 2 seconds
    const dt = 1 / 60;
    let kickTriggered = false;
    let snareTriggered = false;
    let hatTriggered = false;

    for (let t = 0; t < 2; t += dt) {
      player.updateAtTime(t, dt);
      const state = player.getBeatState();
      if (state.kickIntensity > 0.5) kickTriggered = true;
      if (state.snareIntensity > 0.5) snareTriggered = true;
      if (state.hatIntensity > 0.3) hatTriggered = true;
    }

    expect(kickTriggered).toBe(true);
    expect(snareTriggered).toBe(true);
    expect(hatTriggered).toBe(true);
  });

  it('beat phase progresses smoothly between beats', () => {
    const player = new SongPlayer();
    player.loadSongData(testSongData as SongData);

    const phases: number[] = [];
    const dt = 1 / 60;
    for (let t = 0; t < 1; t += dt) {
      player.updateAtTime(t, dt);
      phases.push(player.getBeatState().beatPhase);
    }

    // Phase should generally increase between beats (0→1), then reset
    // At minimum it should not be stuck at 0
    const nonZero = phases.filter(p => p > 0);
    expect(nonZero.length).toBeGreaterThan(0);
  });

  it('detects current song event', () => {
    const player = new SongPlayer();
    player.loadSongData(testSongData as SongData);

    player.updateAtTime(2, 0.016);
    expect(player.getCurrentEvent()?.type).toBe('intro');

    player.updateAtTime(20, 0.016);
    expect(player.getCurrentEvent()?.type).toBe('drop');
  });
});
