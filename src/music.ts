import { getCtx } from './audio';

/** Create a white noise AudioBuffer for use in hi-hats, snares, etc. */
function createNoiseBuffer(ctx: AudioContext, duration = 1): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

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

/** Convert a root frequency + semitone offset to a frequency */
function semitonesToFreq(root: number, semitones: number): number {
  return root * Math.pow(2, semitones / 12);
}

export class MusicEngine {
  readonly config: MusicConfig;
  private activeLayers = 1;
  private beatState: BeatState;

  // Audio context and master output
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Bass voice (persistent)
  private bassOsc: OscillatorNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private bassGain: GainNode | null = null;

  // Arp voice (persistent)
  private arpOsc1: OscillatorNode | null = null;
  private arpOsc2: OscillatorNode | null = null;
  private arpFilter: BiquadFilterNode | null = null;
  private arpGain: GainNode | null = null;

  // Delay bus
  private delayNode: DelayNode | null = null;
  private delaySend: GainNode | null = null;

  // Scheduler state
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private currentSixteenth = 0;
  private pendingBPM: number | null = null;
  private lastBeatTime = 0;
  private arpIndex = 0;

  // Bass: 1-bar pattern (16 slots), root = A2 (110Hz)
  private bassPattern: (number | null)[] = [
    0, null, null, null, 0, null, null, 7,
    null, null, 5, null, null, null, 0, null,
  ];

  // Arp: chord tones cycled on 16th notes, root = A3 (220Hz)
  private arpNotes: number[] = [0, 4, 7, 12, 7, 4];

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

  triggerKick(): void {
    this.beatState.kickIntensity = 1;
  }

  triggerSnare(): void {
    this.beatState.snareIntensity = 1;
  }

  triggerHat(): void {
    this.beatState.hatIntensity = 1;
  }

  handleResume(): void {
    this.beatState.kickIntensity = 0;
    this.beatState.snareIntensity = 0;
    this.beatState.hatIntensity = 0;
    this.beatState.beatPhase = 0;
    // Reset scheduler timing
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
      this.lastBeatTime = this.ctx.currentTime;
    }
  }

  update(dt: number): void {
    const decay = this.config.intensityDecayRate * dt;
    this.beatState.kickIntensity = Math.max(0, this.beatState.kickIntensity - decay);
    this.beatState.snareIntensity = Math.max(0, this.beatState.snareIntensity - decay);
    this.beatState.hatIntensity = Math.max(0, this.beatState.hatIntensity - decay);

    // Compute beatPhase from AudioContext timing
    if (this.ctx) {
      const secondsPerBeat = 60 / this.beatState.bpm;
      const timeSinceLastBeat = (this.ctx.currentTime - this.lastBeatTime) % secondsPerBeat;
      this.beatState.beatPhase = timeSinceLastBeat / secondsPerBeat;
    }
  }

  setIntensityLevel(layers: number): void {
    this.activeLayers = layers;
    this.beatState.visualIntensity = Math.min(1, layers / 5);
  }

  // ─── Drum Voices (one-shot per hit) ───────────────────────────────

  private scheduleKick(time: number): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Main body: sine oscillator with pitch sweep
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(this.config.kickFreqStart, time);
    osc.frequency.exponentialRampToValueAtTime(
      this.config.kickFreqEnd,
      time + this.config.kickDecay,
    );

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + this.config.kickDecay);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + this.config.kickDecay);

    // Click transient: triangle at ~3kHz, 10ms
    const click = ctx.createOscillator();
    click.type = 'triangle';
    click.frequency.setValueAtTime(3000, time);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.3, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);

    click.connect(clickGain);
    clickGain.connect(this.masterGain);
    click.start(time);
    click.stop(time + 0.01);

    this.triggerKick();
  }

  private scheduleHat(time: number): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const ctx = this.ctx;

    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(this.config.hatHighpass, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + this.config.hatDecay);

    source.connect(hp);
    hp.connect(gain);
    gain.connect(this.masterGain);
    source.start(time);
    source.stop(time + this.config.hatDecay);

    this.triggerHat();
  }

  private scheduleSnare(time: number): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const ctx = this.ctx;

    // Noise through bandpass ~2kHz for rattle
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2000, time);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + this.config.snareDecay);

    noiseSource.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseSource.start(time);
    noiseSource.stop(time + this.config.snareDecay);

    // Triangle tone body at snareFreq
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(this.config.snareFreq, time);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + this.config.snareDecay);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + this.config.snareDecay);

    // Send snare to delay bus
    if (this.delaySend) {
      const delaySendGain = ctx.createGain();
      delaySendGain.gain.setValueAtTime(0.2, time);
      delaySendGain.gain.exponentialRampToValueAtTime(0.001, time + this.config.snareDecay);

      const delaySrc = ctx.createBufferSource();
      delaySrc.buffer = this.noiseBuffer;
      delaySrc.connect(bp);
      // Re-use the bandpass; route through a separate send gain
      const snareSend = ctx.createGain();
      snareSend.gain.setValueAtTime(0.2, time);
      noiseGain.connect(snareSend);
      snareSend.connect(this.delaySend);
    }

    this.triggerSnare();
  }

  // ─── Bass Voice (persistent) ──────────────────────────────────────

  private initBass(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    this.bassOsc = ctx.createOscillator();
    this.bassOsc.type = 'sawtooth';
    this.bassOsc.frequency.setValueAtTime(110, ctx.currentTime);

    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.setValueAtTime(this.config.bassCutoff, ctx.currentTime);
    this.bassFilter.Q.setValueAtTime(this.config.bassResonance, ctx.currentTime);

    this.bassGain = ctx.createGain();
    this.bassGain.gain.setValueAtTime(0.5, ctx.currentTime);

    this.bassOsc.connect(this.bassFilter);
    this.bassFilter.connect(this.bassGain);
    this.bassGain.connect(this.masterGain);
    this.bassOsc.start(ctx.currentTime);
  }

  private scheduleBassNote(time: number, freq: number): void {
    if (!this.bassOsc || !this.bassFilter) return;

    this.bassOsc.frequency.setValueAtTime(freq, time);

    // Filter cutoff envelope: ramp up then decay back
    const peakCutoff = this.config.bassCutoff * 4;
    this.bassFilter.frequency.setValueAtTime(peakCutoff, time);
    this.bassFilter.frequency.exponentialRampToValueAtTime(
      this.config.bassCutoff,
      time + 0.15,
    );
  }

  private duckBass(time: number): void {
    if (!this.bassGain) return;
    // Duck by ~3-4dB (factor of ~0.5) for ~80ms
    this.bassGain.gain.setValueAtTime(0.25, time);
    this.bassGain.gain.exponentialRampToValueAtTime(0.5, time + 0.08);
  }

  // ─── Arp Voice (persistent) ───────────────────────────────────────

  private initArp(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    this.arpOsc1 = ctx.createOscillator();
    this.arpOsc1.type = 'square';
    this.arpOsc1.frequency.setValueAtTime(220, ctx.currentTime);
    this.arpOsc1.detune.setValueAtTime(this.config.arpDetune, ctx.currentTime);

    this.arpOsc2 = ctx.createOscillator();
    this.arpOsc2.type = 'square';
    this.arpOsc2.frequency.setValueAtTime(220, ctx.currentTime);
    this.arpOsc2.detune.setValueAtTime(-this.config.arpDetune, ctx.currentTime);

    this.arpFilter = ctx.createBiquadFilter();
    this.arpFilter.type = 'lowpass';
    this.arpFilter.frequency.setValueAtTime(this.config.arpCutoff, ctx.currentTime);
    this.arpFilter.Q.setValueAtTime(this.config.arpResonance, ctx.currentTime);

    this.arpGain = ctx.createGain();
    this.arpGain.gain.setValueAtTime(0, ctx.currentTime);

    this.arpOsc1.connect(this.arpFilter);
    this.arpOsc2.connect(this.arpFilter);
    this.arpFilter.connect(this.arpGain);
    this.arpGain.connect(this.masterGain);

    // Send arp to delay bus
    if (this.delaySend) {
      const arpDelaySend = ctx.createGain();
      arpDelaySend.gain.setValueAtTime(0.2, ctx.currentTime);
      this.arpGain.connect(arpDelaySend);
      arpDelaySend.connect(this.delaySend);
    }

    this.arpOsc1.start(ctx.currentTime);
    this.arpOsc2.start(ctx.currentTime);
  }

  private scheduleArpNote(time: number, freq: number): void {
    if (!this.arpOsc1 || !this.arpOsc2 || !this.arpGain) return;

    this.arpOsc1.frequency.setValueAtTime(freq, time);
    this.arpOsc2.frequency.setValueAtTime(freq, time);

    // Short gain envelope per note
    const noteDuration = 0.05;
    this.arpGain.gain.setValueAtTime(0.25, time);
    this.arpGain.gain.exponentialRampToValueAtTime(0.001, time + noteDuration);
  }

  // ─── Delay Bus ────────────────────────────────────────────────────

  private initDelayBus(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    this.delayNode = ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime(this.config.delayTime, ctx.currentTime);

    const feedbackGain = ctx.createGain();
    feedbackGain.gain.setValueAtTime(this.config.delayFeedback, ctx.currentTime);

    const feedbackFilter = ctx.createBiquadFilter();
    feedbackFilter.type = 'lowpass';
    feedbackFilter.frequency.setValueAtTime(2000, ctx.currentTime);

    // Send input node
    this.delaySend = ctx.createGain();
    this.delaySend.gain.setValueAtTime(1, ctx.currentTime);

    // Routing: send → delay → filter → feedbackGain → delay (feedback loop)
    this.delaySend.connect(this.delayNode);
    this.delayNode.connect(feedbackFilter);
    feedbackFilter.connect(feedbackGain);
    feedbackGain.connect(this.delayNode);

    // Output to master
    this.delayNode.connect(this.masterGain);
  }

  // ─── Beat Scheduler ───────────────────────────────────────────────

  start(): void {
    const ctx = getCtx();
    if (!ctx) return;
    this.ctx = ctx;

    // Master gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.config.masterVolume, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    // Noise buffer
    this.noiseBuffer = createNoiseBuffer(ctx);

    // Init delay bus first (so bass/arp can route to it)
    this.initDelayBus();
    this.initBass();
    this.initArp();

    this.nextNoteTime = ctx.currentTime + 0.05;
    this.currentSixteenth = 0;
    this.arpIndex = 0;
    this.lastBeatTime = ctx.currentTime;

    ctx.addEventListener('statechange', () => {
      if (ctx.state === 'running' && this.schedulerInterval !== null) {
        this.handleResume();
      }
    });

    this.schedulerInterval = setInterval(
      this.schedulerTick,
      this.config.schedulerIntervalMs,
    );
  }

  stop(): void {
    // Clear scheduler
    if (this.schedulerInterval !== null) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    // Fade master gain
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.masterGain.gain.value,
        this.ctx.currentTime,
      );
      this.masterGain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + 0.2,
      );
    }

    // Stop and disconnect persistent oscillators
    try {
      this.bassOsc?.stop();
    } catch {
      // already stopped
    }
    try {
      this.arpOsc1?.stop();
    } catch {
      // already stopped
    }
    try {
      this.arpOsc2?.stop();
    } catch {
      // already stopped
    }

    this.bassOsc?.disconnect();
    this.bassFilter?.disconnect();
    this.bassGain?.disconnect();
    this.arpOsc1?.disconnect();
    this.arpOsc2?.disconnect();
    this.arpFilter?.disconnect();
    this.arpGain?.disconnect();
    this.delayNode?.disconnect();
    this.delaySend?.disconnect();
    this.masterGain?.disconnect();

    // Reset state
    this.bassOsc = null;
    this.bassFilter = null;
    this.bassGain = null;
    this.arpOsc1 = null;
    this.arpOsc2 = null;
    this.arpFilter = null;
    this.arpGain = null;
    this.delayNode = null;
    this.delaySend = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    this.ctx = null;
    this.currentSixteenth = 0;
    this.nextNoteTime = 0;
    this.arpIndex = 0;
    this.pendingBPM = null;
  }

  setBPM(bpm: number): void {
    this.pendingBPM = bpm;
  }

  private schedulerTick = (): void => {
    if (!this.ctx) return;

    const lookahead = this.config.lookaheadMs / 1000;

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      const time = this.nextNoteTime;
      const pos = this.currentSixteenth;

      // At bar boundary: apply pending BPM
      if (pos === 0 && this.pendingBPM !== null) {
        this.beatState.bpm = this.pendingBPM;
        this.pendingBPM = null;
      }

      const secondsPerSixteenth = 60 / this.beatState.bpm / 4;

      // Kick: positions 0, 4, 8, 12 (layer >= 1)
      if (this.activeLayers >= 1 && (pos === 0 || pos === 4 || pos === 8 || pos === 12)) {
        this.scheduleKick(time);
        this.duckBass(time);
        this.lastBeatTime = time;
      }

      // Hat: every other position (8th notes) (layer >= 2)
      if (this.activeLayers >= 2 && pos % 2 === 0) {
        this.scheduleHat(time);
      }

      // Snare: positions 4, 12 (layer >= 3)
      if (this.activeLayers >= 3 && (pos === 4 || pos === 12)) {
        this.scheduleSnare(time);
      }

      // Bass: per bassPattern (layer >= 4)
      if (this.activeLayers >= 4) {
        const bassNote = this.bassPattern[pos];
        if (bassNote !== null) {
          const freq = semitonesToFreq(110, bassNote);
          this.scheduleBassNote(time, freq);
        }
      }

      // Arp: cycle through arpNotes (layer >= 5)
      if (this.activeLayers >= 5) {
        const semitone = this.arpNotes[this.arpIndex % this.arpNotes.length];
        const freq = semitonesToFreq(220, semitone);
        this.scheduleArpNote(time, freq);
        this.arpIndex = (this.arpIndex + 1) % this.arpNotes.length;
      }

      // Advance
      this.nextNoteTime += secondsPerSixteenth;
      this.currentSixteenth = (this.currentSixteenth + 1) % 16;
    }
  };
}
