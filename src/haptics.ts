/** Haptic feedback via navigator.vibrate() */

let enabled = false;

function vibrate(pattern: number | number[]): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}

/** Short pulse on successful catch (15ms) */
export function vibrateOnCatch(): void {
  vibrate(15);
}

/** Double pulse on miss ([10, 50, 10] ms) */
export function vibrateOnMiss(): void {
  vibrate([10, 50, 10]);
}

/** Longer pulse on combo milestone (40ms) */
export function vibrateOnMilestone(): void {
  vibrate(40);
}

/** Enable/disable all haptic feedback */
export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}
