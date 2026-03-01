// tools/analyze-song/src/energy.ts
import type { EnergyFrame } from './types.js';

const FRAME_RATE = 30;

/**
 * Analyze energy using band-pass filtered RMS.
 * Uses time-domain filtering instead of full DFT for performance.
 * Filters approximate low (0-300Hz), mid (300-4000Hz), high (4000+Hz) bands.
 */
export function analyzeEnergy(
  samples: Float32Array,
  sampleRate: number,
): EnergyFrame[] {
  const frames: EnergyFrame[] = [];
  const frameSize = Math.floor(sampleRate / FRAME_RATE);
  const windowSize = 2048;

  // Pre-compute band-pass filter coefficients (simple biquad approximations)
  // Low-pass at 300Hz for low band
  const lowCutoff = 300 / sampleRate;
  // High-pass at 4000Hz for high band
  const highCutoff = 4000 / sampleRate;

  for (let offset = 0; offset + windowSize <= samples.length; offset += frameSize) {
    const time = offset / sampleRate;

    let lowEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;
    let totalEnergy = 0;

    // Compute energy in frequency bands using spectral sampling
    // Sample representative frequency bins with Goertzel algorithm
    const N = windowSize;

    // Low band: sample bins at ~50, 100, 150, 200, 250 Hz
    for (let freq = 50; freq <= 300; freq += 50) {
      const k = freq * N / sampleRate;
      const power = goertzel(samples, offset, N, k);
      lowEnergy += power;
    }

    // Mid band: sample bins at strategic frequencies
    for (let freq = 500; freq <= 4000; freq += 500) {
      const k = freq * N / sampleRate;
      const power = goertzel(samples, offset, N, k);
      midEnergy += power;
    }

    // High band: sample bins at higher frequencies
    for (let freq = 5000; freq <= 16000; freq += 2000) {
      const k = freq * N / sampleRate;
      if (k < N / 2) {
        const power = goertzel(samples, offset, N, k);
        highEnergy += power;
      }
    }

    // Also compute overall RMS for total
    for (let i = 0; i < N; i++) {
      const s = samples[offset + i];
      totalEnergy += s * s;
    }
    totalEnergy = Math.sqrt(totalEnergy / N);

    // Normalize to 0-1 (log scale for perceptual match)
    const total = Math.min(1, totalEnergy * 4);
    const sumBands = lowEnergy + midEnergy + highEnergy || 1;

    frames.push({
      time,
      low: Math.min(1, total * (lowEnergy / sumBands) * 1.5),
      mid: Math.min(1, total * (midEnergy / sumBands) * 1.5),
      high: Math.min(1, total * (highEnergy / sumBands) * 1.5),
      total,
    });
  }

  return frames;
}

/**
 * Goertzel algorithm: compute the power at a specific frequency bin k
 * Much faster than full DFT when you only need a few bins.
 * O(N) per bin instead of O(N*N) for full DFT.
 */
function goertzel(
  samples: Float32Array,
  offset: number,
  N: number,
  k: number,
): number {
  const w = (2 * Math.PI * k) / N;
  const coeff = 2 * Math.cos(w);
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;

  for (let i = 0; i < N; i++) {
    s0 = samples[offset + i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }

  // Power = s1^2 + s2^2 - coeff * s1 * s2
  return s1 * s1 + s2 * s2 - coeff * s1 * s2;
}
