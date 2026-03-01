export interface MusicConfig {
  bpm: number;
  layers: number;
  masterVolume: number;
  kickFreqStart: number;
  kickFreqEnd: number;
  kickDecay: number;
  hatHighpass: number;
  hatDecay: number;
  snareFreq: number;
  snareDecay: number;
  bassCutoff: number;
  bassResonance: number;
  arpCutoff: number;
  arpResonance: number;
  arpDetune: number;
  delayTime: number;
  delayFeedback: number;
  intensityDecayRate: number;
  lookaheadMs: number;
  schedulerIntervalMs: number;
}

export const DEFAULT_MUSIC_CONFIG: MusicConfig = {
  bpm: 110,
  layers: 1,
  masterVolume: 0.3,
  kickFreqStart: 150,
  kickFreqEnd: 50,
  kickDecay: 0.18,
  hatHighpass: 6000,
  hatDecay: 0.05,
  snareFreq: 200,
  snareDecay: 0.1,
  bassCutoff: 200,
  bassResonance: 5,
  arpCutoff: 2000,
  arpResonance: 8,
  arpDetune: 8,
  delayTime: 0.25,
  delayFeedback: 0.3,
  intensityDecayRate: 8,
  lookaheadMs: 100,
  schedulerIntervalMs: 25,
};

export interface BeatState {
  kickIntensity: number;
  snareIntensity: number;
  hatIntensity: number;
  beatPhase: number;
  visualIntensity: number;
  bpm: number;
}

export class MusicEngine {
  config: MusicConfig;
  private beatState: BeatState;

  constructor(config: Partial<MusicConfig> = {}) {
    this.config = { ...DEFAULT_MUSIC_CONFIG, ...config };
    this.beatState = {
      kickIntensity: 0,
      snareIntensity: 0,
      hatIntensity: 0,
      beatPhase: 0,
      visualIntensity: 0,
      bpm: this.config.bpm,
    };
  }

  getBeatState(): BeatState {
    return this.beatState;
  }
}
