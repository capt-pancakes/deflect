import { describe, it, expect } from 'vitest';
import { vec2, normalize, scale, length, reflect } from '../math';
import type { Vec2 } from '../types';

/**
 * Tests for the aim assist blending logic from game.ts (~lines 738-747).
 *
 * The real code blends the bounce direction with a vector toward the
 * matching port. If the blended result is near-zero length, the guard
 * falls back to a raw reflect instead of producing a {0,0} velocity
 * that would freeze the signal.
 */

/** Mirrors the aim assist blending logic from game.ts */
function aimAssistBlend(
  newVel: Vec2,
  toPort: Vec2,
  aimAssistStrength: number,
  signalVel: Vec2,
  effectiveNormal: Vec2,
): Vec2 {
  const spd = length(newVel);
  const blended = vec2(
    newVel.x + toPort.x * aimAssistStrength * spd,
    newVel.y + toPort.y * aimAssistStrength * spd,
  );
  if (length(blended) > 0.001) {
    return scale(normalize(blended), spd);
  } else {
    return reflect(signalVel, effectiveNormal);
  }
}

describe('aim assist blending zero-vector guard', () => {
  it('blends toward port when result is non-zero', () => {
    const newVel = vec2(100, 0);
    const toPort = vec2(0, 1); // port is above
    const result = aimAssistBlend(newVel, toPort, 0.3, newVel, vec2(0, 1));

    // Result should have the same speed
    expect(length(result)).toBeCloseTo(100);
    // Result should be biased toward the port (positive y component)
    expect(result.y).toBeGreaterThan(0);
  });

  it('falls back to reflect when blended vector is near-zero', () => {
    // Construct a scenario where newVel + toPort * strength * spd ~ 0
    // newVel = (100, 0), toPort aimed exactly opposite at same magnitude ratio
    const spd = 100;
    const aimStrength = 1.0;
    // toPort must cancel newVel: newVel.x + toPort.x * strength * spd = 0
    // 100 + toPort.x * 1.0 * 100 = 0 => toPort.x = -1
    const newVel = vec2(spd, 0);
    const toPort = vec2(-1, 0);
    const signalVel = vec2(spd, 0);
    const normal = vec2(-1, 0);

    const result = aimAssistBlend(newVel, toPort, aimStrength, signalVel, normal);

    // Should NOT be zero — should fall back to reflect
    expect(length(result)).toBeGreaterThan(0);
    // reflect(vel=(100,0), normal=(-1,0)) => (-100, 0)
    expect(result.x).toBeCloseTo(-100);
    expect(result.y).toBeCloseTo(0);
  });

  it('does not produce NaN values on zero-length blend', () => {
    const newVel = vec2(50, 0);
    const toPort = vec2(-1, 0);
    const result = aimAssistBlend(newVel, toPort, 1.0, newVel, vec2(-1, 0));

    expect(Number.isNaN(result.x)).toBe(false);
    expect(Number.isNaN(result.y)).toBe(false);
  });

  it('preserves speed after blending', () => {
    const speed = 150;
    const newVel = vec2(speed, 0);
    const toPort = vec2(0.5, 0.5);
    const result = aimAssistBlend(newVel, toPort, 0.3, newVel, vec2(0, 1));

    expect(length(result)).toBeCloseTo(speed);
  });
});
