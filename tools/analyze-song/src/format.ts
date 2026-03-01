// tools/analyze-song/src/format.ts
import type { SongData, Beat, EnergyFrame, SongEvent } from './types.js';

export function formatSongData(params: {
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  beats: Beat[];
  energy: EnergyFrame[];
  events: SongEvent[];
}): SongData {
  return {
    title: params.title,
    artist: params.artist,
    duration: params.duration,
    bpm: params.bpm,
    bpmSections: [{ time: 0, bpm: params.bpm }],
    beats: params.beats.sort((a, b) => a.time - b.time),
    energy: params.energy.sort((a, b) => a.time - b.time),
    events: params.events.sort((a, b) => a.time - b.time),
  };
}
