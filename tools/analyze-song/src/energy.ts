// tools/analyze-song/src/energy.ts
import type { EnergyFrame } from './types.js';

const FRAME_RATE = 30;

export function analyzeEnergy(
  samples: Float32Array,
  sampleRate: number,
): EnergyFrame[] {
  const frames: EnergyFrame[] = [];
  const frameSize = Math.floor(sampleRate / FRAME_RATE);
  const fftSize = 2048;

  for (let offset = 0; offset + fftSize <= samples.length; offset += frameSize) {
    const time = offset / sampleRate;
    const window = samples.slice(offset, offset + fftSize);

    // Compute RMS for total energy
    let sum = 0;
    for (let i = 0; i < window.length; i++) {
      sum += window[i] * window[i];
    }
    const rms = Math.sqrt(sum / window.length);

    const total = Math.min(1, rms * 4);

    frames.push({
      time,
      low: total * 0.6,
      mid: total * 0.3,
      high: total * 0.1,
      total,
    });
  }

  return frames;
}
