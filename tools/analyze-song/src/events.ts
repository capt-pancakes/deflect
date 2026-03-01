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

  // Detect drops and buildups (lowered threshold from 0.3 to 0.2)
  for (let i = windowSize; i < smoothed.length - 1; i++) {
    const prev = smoothed[i - windowSize];
    const curr = smoothed[i];
    if (curr - prev > 0.2 && curr > 0.4) {
      // Check for buildup: rising energy in the window before the drop
      let buildupStart = i - windowSize;
      let isBuildup = true;
      for (let j = buildupStart + 1; j < i; j++) {
        if (smoothed[j] < smoothed[j - 1] - 0.02) {
          isBuildup = false;
          break;
        }
      }

      // Add buildup event if energy was rising before the drop
      if (isBuildup && buildupStart > 0) {
        const buildupTime = energy[Math.max(0, buildupStart)].time;
        const buildupDuration = energy[i].time - buildupTime;
        if (buildupDuration > 1) {
          events.push({
            time: buildupTime,
            type: 'buildup',
            duration: buildupDuration,
          });
        }
      }

      // Add drop event
      let dropEnd = i;
      while (dropEnd < smoothed.length && smoothed[dropEnd] > curr * 0.7)
        dropEnd++;
      const dropTime = energy[i].time;
      const dropDuration = energy[Math.min(dropEnd, energy.length - 1)].time - dropTime;
      events.push({
        time: dropTime,
        type: 'drop',
        duration: dropDuration,
      });

      // Check for breakdown: sustained low energy after the drop
      if (dropEnd < smoothed.length) {
        let breakdownEnd = dropEnd;
        while (
          breakdownEnd < smoothed.length &&
          smoothed[breakdownEnd] < smoothed[dropEnd] * 1.3 &&
          smoothed[breakdownEnd] < 0.4
        ) {
          breakdownEnd++;
        }
        const breakdownDuration =
          energy[Math.min(breakdownEnd, energy.length - 1)].time -
          energy[Math.min(dropEnd, energy.length - 1)].time;
        if (breakdownDuration > 2) {
          events.push({
            time: energy[Math.min(dropEnd, energy.length - 1)].time,
            type: 'breakdown',
            duration: breakdownDuration,
          });
        }
      }

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
