import type { SongData, SongEvent, EnergyFrame } from './song-data';

export interface BeatState {
  kickIntensity: number;
  snareIntensity: number;
  hatIntensity: number;
  beatPhase: number;
  visualIntensity: number;
  bpm: number;
}

// Per-type decay rates create distinct visual character per instrument
const KICK_DECAY_RATE = 12;   // Punchy, fast attack/release
const SNARE_DECAY_RATE = 10;  // Medium sustain
const HAT_DECAY_RATE = 16;    // Snappy, very fast

// Number of frequency bins for spectrum visualization
const FFT_SIZE = 64; // gives us 32 bins (FFT_SIZE / 2)
const NUM_BINS = FFT_SIZE / 2;

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
  private currentTime = 0;

  // Audio element for playback (null in tests)
  private audio: HTMLAudioElement | null = null;

  // Web Audio spectrum analysis
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(NUM_BINS);
  /** Smoothed bar heights for interpolation (0-1 range) */
  private smoothedBars: Float32Array = new Float32Array(NUM_BINS);

  getBeatState(): BeatState {
    return this.beatState;
  }

  loadSongData(data: SongData): void {
    this.songData = data;
    this.reclassifyIfNeeded(data);
    this.beatState.bpm = data.bpm;
    this.beatIndex = 0;
    this.currentTime = 0;
  }

  /**
   * Detects pathological "all same type" beat data (e.g. Essentia.js fallback
   * classifying everything as "hat") and applies a 4/4 positional pattern
   * using the song BPM: beats 1,3 = kick, beats 2,4 = snare, off-beats = hat.
   */
  private reclassifyIfNeeded(data: SongData): void {
    if (data.beats.length < 4) return;

    // Check if all beats are the same type
    const firstType = data.beats[0].type;
    const allSame = data.beats.every((b) => b.type === firstType);
    if (!allSame) return;

    const beatDuration = 60 / data.bpm; // duration of one beat in seconds

    for (const beat of data.beats) {
      // Determine position within a 4-beat bar
      const beatInBar = Math.round(beat.time / beatDuration) % 4;

      if (beatInBar === 0) {
        beat.type = 'downbeat';
        beat.intensity = Math.max(beat.intensity, 0.9);
      } else if (beatInBar === 2) {
        beat.type = 'kick';
        beat.intensity = Math.max(beat.intensity, 0.8);
      } else if (beatInBar === 1 || beatInBar === 3) {
        beat.type = 'snare';
        beat.intensity = Math.max(beat.intensity, 0.7);
      } else {
        beat.type = 'hat';
      }
    }
  }

  start(mp3Url: string, songData: SongData): void {
    this.loadSongData(songData);
    if (typeof Audio !== 'undefined') {
      this.audio = new Audio(mp3Url);
      this.connectAnalyser();
      this.audio.play().catch(() => {
        // Autoplay may be blocked; will resume on user interaction
      });
    }
  }

  stop(): void {
    this.disconnectAnalyser();
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
    this.currentTime = 0;
    this.smoothedBars.fill(0);
  }

  private connectAnalyser(): void {
    if (!this.audio) return;
    try {
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.6;
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    } catch {
      // Web Audio unavailable - spectrum will be empty, game still works
      this.analyser = null;
      this.audioCtx = null;
      this.sourceNode = null;
    }
  }

  private disconnectAnalyser(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }

  /**
   * Returns smoothed frequency bar heights (0-1 range) for spectrum visualization.
   * Each element represents one frequency bin, low to high.
   * Returns a reused Float32Array - do not store a reference across frames.
   */
  getFrequencyData(): Float32Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      // Smooth toward target values for no-jitter interpolation
      for (let i = 0; i < NUM_BINS; i++) {
        const target = this.frequencyData[i] / 255;
        const current = this.smoothedBars[i];
        // Fast attack, slower decay
        if (target > current) {
          this.smoothedBars[i] = current + (target - current) * 0.5;
        } else {
          this.smoothedBars[i] = current + (target - current) * 0.15;
        }
      }
    }
    return this.smoothedBars;
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
    this.beatState.kickIntensity = Math.max(0, this.beatState.kickIntensity - KICK_DECAY_RATE * dt);
    this.beatState.snareIntensity = Math.max(0, this.beatState.snareIntensity - SNARE_DECAY_RATE * dt);
    this.beatState.hatIntensity = Math.max(0, this.beatState.hatIntensity - HAT_DECAY_RATE * dt);

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

  setMuted(muted: boolean): void {
    if (this.audio) {
      this.audio.muted = muted;
    }
  }

  setIntensityLevel(layers: number): void {
    this.beatState.visualIntensity = Math.min(1, Math.max(0.7, layers / 5));
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

  getCurrentEnergy(): EnergyFrame | null {
    if (!this.songData || this.songData.energy.length === 0) return null;
    const energy = this.songData.energy;
    // Binary-ish scan: find the frame closest to currentTime
    for (let i = energy.length - 1; i >= 0; i--) {
      if (energy[i].time <= this.currentTime) {
        return energy[i];
      }
    }
    return energy[0];
  }
}
