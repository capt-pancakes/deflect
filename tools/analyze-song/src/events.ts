// tools/analyze-song/src/events.ts
import type { SongEvent, EnergyFrame } from './types.js';

export function detectEvents(
  energy: EnergyFrame[],
  duration: number,
): SongEvent[] {
  const events: SongEvent[] = [];
  if (energy.length < 2) return events;

  const windowSize = 30;

  // Compute smoothed energy
  const smoothed: number[] = [];
  for (let i = 0; i < energy.length; i++) {
    let sum = 0;
    let count = 0;
    for (
      let j = Math.max(0, i - windowSize);
      j <= Math.min(energy.length - 1, i + windowSize);
      j++
    ) {
      sum += energy[j].total;
      count++;
    }
    smoothed.push(sum / count);
  }

  // Detect intro
  if (smoothed[0] < 0.3) {
    let introEnd = 0;
    while (introEnd < smoothed.length && smoothed[introEnd] < 0.3) introEnd++;
    if (introEnd > 0) {
      events.push({
        time: 0,
        type: 'intro',
        duration: energy[Math.min(introEnd, energy.length - 1)].time,
      });
    }
  }

  // Detect drops
  for (let i = windowSize; i < smoothed.length - 1; i++) {
    const prev = smoothed[i - windowSize];
    const curr = smoothed[i];
    if (curr - prev > 0.3 && curr > 0.5) {
      let dropEnd = i;
      while (dropEnd < smoothed.length && smoothed[dropEnd] > curr * 0.7)
        dropEnd++;
      events.push({
        time: energy[i].time,
        type: 'drop',
        duration:
          energy[Math.min(dropEnd, energy.length - 1)].time - energy[i].time,
      });
      i = dropEnd;
    }
  }

  // Detect outro
  const lastIdx = smoothed.length - 1;
  if (smoothed[lastIdx] < 0.3) {
    let outroStart = lastIdx;
    while (outroStart > 0 && smoothed[outroStart] < 0.3) outroStart--;
    events.push({
      time: energy[outroStart].time,
      type: 'outro',
      duration: duration - energy[outroStart].time,
    });
  }

  return events;
}
