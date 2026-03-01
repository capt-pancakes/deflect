import type { SongData, SongEvent } from './song-data';

export interface BeatState {
  kickIntensity: number;
  snareIntensity: number;
  hatIntensity: number;
  beatPhase: number;
  visualIntensity: number;
  bpm: number;
}

const INTENSITY_DECAY_RATE = 8;

export class SongPlayer {
  private songData: SongData | null = null;
  private beatState: BeatState = {
    kickIntensity: 0,
    snareIntensity: 0,
    hatIntensity: 0,
    beatPhase: 0,
    visualIntensity: 0,
    bpm: 0,
  };

  // Index tracking for O(1) per-frame advancement
  private beatIndex = 0;
  private energyIndex = 0;
  private currentTime = 0;

  // Audio element for playback (null in tests)
  private audio: HTMLAudioElement | null = null;

  getBeatState(): BeatState {
    return this.beatState;
  }

  loadSongData(data: SongData): void {
    this.songData = data;
    this.beatState.bpm = data.bpm;
    this.beatIndex = 0;
    this.energyIndex = 0;
    this.currentTime = 0;
  }

  start(mp3Url: string, songData: SongData): void {
    this.loadSongData(songData);
    this.audio = new Audio(mp3Url);
    this.audio.play().catch(() => {
      // Autoplay may be blocked; will resume on user interaction
    });
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.beatState.kickIntensity = 0;
    this.beatState.snareIntensity = 0;
    this.beatState.hatIntensity = 0;
    this.beatState.beatPhase = 0;
    this.beatIndex = 0;
    this.energyIndex = 0;
    this.currentTime = 0;
  }

  /** Called each frame from game.update(). Uses audio.currentTime if available. */
  update(dt: number): void {
    if (this.audio) {
      this.updateAtTime(this.audio.currentTime, dt);
    }
  }

  /**
   * Core sync logic — testable without audio element.
   *
   * Decay is applied BEFORE triggering new beats so that a freshly triggered
   * beat reads at its full intensity in the same frame. This matches the old
   * MusicEngine behaviour where events set intensity to 1 and decay runs on
   * subsequent frames.
   */
  updateAtTime(time: number, dt: number): void {
    if (!this.songData) return;
    this.currentTime = time;

    const beats = this.songData.beats;

    // Decay intensities first, before triggering new beats
    const decay = INTENSITY_DECAY_RATE * dt;
    this.beatState.kickIntensity = Math.max(0, this.beatState.kickIntensity - decay);
    this.beatState.snareIntensity = Math.max(0, this.beatState.snareIntensity - decay);
    this.beatState.hatIntensity = Math.max(0, this.beatState.hatIntensity - decay);

    // Advance beat index and trigger intensities for passed beats
    while (this.beatIndex < beats.length && beats[this.beatIndex].time <= time) {
      const beat = beats[this.beatIndex];
      switch (beat.type) {
        case 'kick':
        case 'downbeat':
          this.beatState.kickIntensity = beat.intensity;
          break;
        case 'snare':
          this.beatState.snareIntensity = beat.intensity;
          break;
        case 'hat':
          this.beatState.hatIntensity = beat.intensity;
          break;
      }
      this.beatIndex++;
    }

    // Compute beatPhase: 0-1 between the previous and next beat
    const prevIdx = Math.max(0, this.beatIndex - 1);
    const nextIdx = Math.min(this.beatIndex, beats.length - 1);
    if (prevIdx !== nextIdx) {
      const prevTime = beats[prevIdx].time;
      const nextTime = beats[nextIdx].time;
      const span = nextTime - prevTime;
      if (span > 0) {
        this.beatState.beatPhase = Math.min(1, (time - prevTime) / span);
      }
    }

    // Update BPM from bpmSections
    const sections = this.songData.bpmSections;
    for (let i = sections.length - 1; i >= 0; i--) {
      if (time >= sections[i].time) {
        this.beatState.bpm = sections[i].bpm;
        break;
      }
    }
  }

  setIntensityLevel(layers: number): void {
    this.beatState.visualIntensity = Math.min(1, Math.max(0.5, layers / 5));
  }

  getCurrentEvent(): SongEvent | null {
    if (!this.songData) return null;
    for (let i = this.songData.events.length - 1; i >= 0; i--) {
      const evt = this.songData.events[i];
      if (this.currentTime >= evt.time && this.currentTime < evt.time + evt.duration) {
        return evt;
      }
    }
    return null;
  }
}
