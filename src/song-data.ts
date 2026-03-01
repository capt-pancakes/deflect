// src/song-data.ts

export interface BPMSection {
  time: number;
  bpm: number;
}

export interface Beat {
  time: number;
  type: 'kick' | 'snare' | 'hat' | 'downbeat';
  intensity: number;
}

export interface EnergyFrame {
  time: number;
  low: number;
  mid: number;
  high: number;
  total: number;
}

export interface SongEvent {
  time: number;
  type: 'buildup' | 'drop' | 'breakdown' | 'intro' | 'outro';
  duration: number;
}

export interface SongData {
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  bpmSections: BPMSection[];
  beats: Beat[];
  energy: EnergyFrame[];
  events: SongEvent[];
}
