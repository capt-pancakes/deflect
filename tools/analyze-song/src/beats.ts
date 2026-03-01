// tools/analyze-song/src/beats.ts
import type { Beat } from './types.js';

export interface BeatAnalysis {
  bpm: number;
  beats: Beat[];
}

export async function analyzeBeats(
  samples: Float32Array,
  sampleRate: number,
): Promise<BeatAnalysis> {
  // Try Essentia.js first
  try {
    return await analyzeBeatsEssentia(samples, sampleRate);
  } catch {
    console.warn('Essentia.js unavailable, using fallback beat detection');
    return analyzeBeatsSimple(samples, sampleRate);
  }
}

async function analyzeBeatsEssentia(
  samples: Float32Array,
  sampleRate: number,
): Promise<BeatAnalysis> {
  // Dynamic import -- Essentia.js uses CJS with a WASM module factory.
  // The WASM module is huge and loading can fail in some environments.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EssentiaWASM, Essentia: EssentiaCore } = await import('essentia.js');

  // EssentiaWASM is a factory function that returns a promise of the WASM module
  const wasmModule = await EssentiaWASM();
  const essentia = new EssentiaCore(wasmModule, false);

  // Convert Float32Array to Essentia's vector format
  const signal = essentia.arrayToVector(samples);

  // Use RhythmExtractor2013 for beat detection
  const rhythm = essentia.RhythmExtractor2013(signal);
  const bpm = Math.round(rhythm.bpm);

  // Extract beat ticks (times in seconds)
  const ticksVector = rhythm.ticks;
  const numTicks = ticksVector.size();

  const beats: Beat[] = [];
  for (let i = 0; i < numTicks; i++) {
    const time = ticksVector.get(i);
    // Classify based on position in bar (assume 4/4 time)
    const beatInBar = i % 4;
    let type: Beat['type'];
    if (beatInBar === 0) type = 'kick';
    else if (beatInBar === 2) type = 'snare';
    else type = 'hat';

    beats.push({ time, type, intensity: 0.8 });
  }

  // Cleanup Essentia vectors
  signal.delete();
  ticksVector.delete();

  return { bpm, beats };
}

function analyzeBeatsSimple(
  samples: Float32Array,
  sampleRate: number,
): BeatAnalysis {
  // Simple onset detection using energy flux
  const hopSize = 512;
  const windowSize = 1024;
  const beats: Beat[] = [];

  // Compute energy in short windows
  const energies: number[] = [];
  for (let i = 0; i + windowSize <= samples.length; i += hopSize) {
    let energy = 0;
    for (let j = 0; j < windowSize; j++) {
      energy += samples[i + j] * samples[i + j];
    }
    energies.push(energy / windowSize);
  }

  // Detect onsets: local maxima above threshold
  const threshold = 0.01;
  const minGapFrames = Math.floor((sampleRate * 0.1) / hopSize); // min 100ms between onsets
  let lastOnset = -minGapFrames;

  for (let i = 2; i < energies.length - 2; i++) {
    const flux = energies[i] - energies[i - 1];
    if (
      flux > threshold &&
      energies[i] > energies[i - 1] &&
      energies[i] > energies[i + 1] &&
      i - lastOnset >= minGapFrames
    ) {
      const time = (i * hopSize) / sampleRate;

      // Classify based on spectral content at this position
      const windowStart = i * hopSize;
      const windowEnd = Math.min(windowStart + windowSize, samples.length);
      const window = samples.slice(windowStart, windowEnd);

      const beatType = classifyBeat(window, sampleRate);
      beats.push({ time, type: beatType, intensity: Math.min(1, flux * 10) });
      lastOnset = i;
    }
  }

  // Estimate BPM from beat intervals
  const bpm = estimateBPM(beats);

  return { bpm, beats };
}

function classifyBeat(window: Float32Array, sampleRate: number): Beat['type'] {
  // Simple spectral analysis: compute energy in low/mid/high bands
  // Using a rough approximation without full FFT
  const lowCutoff = Math.floor((300 / sampleRate) * window.length);
  const highCutoff = Math.floor((4000 / sampleRate) * window.length);

  let lowEnergy = 0;
  let midEnergy = 0;
  let highEnergy = 0;
  for (let i = 0; i < window.length; i++) {
    const val = window[i] * window[i];
    if (i < lowCutoff) lowEnergy += val;
    else if (i < highCutoff) midEnergy += val;
    else highEnergy += val;
  }

  // Normalize
  const total = lowEnergy + midEnergy + highEnergy || 1;
  lowEnergy /= total;
  midEnergy /= total;
  highEnergy /= total;

  if (lowEnergy > 0.5) return 'kick';
  if (highEnergy > 0.3) return 'hat';
  if (midEnergy > 0.3) return 'snare';
  return 'kick'; // default
}

function estimateBPM(beats: Beat[]): number {
  if (beats.length < 3) return 120; // default

  // Calculate intervals between consecutive beats
  const intervals: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i].time - beats[i - 1].time);
  }

  // Find median interval
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];

  // Convert to BPM (assuming 8th note grid for electronic music)
  const bpm = 60 / (median * 2);

  // Clamp to reasonable range
  return Math.round(Math.max(60, Math.min(200, bpm)));
}
