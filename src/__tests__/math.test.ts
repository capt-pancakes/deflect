import { describe, it, expect } from 'vitest';
import {
  vec2,
  add,
  sub,
  scale,
  length,
  normalize,
  dot,
  reflect,
  dist,
  lerp,
  clamp,
  angleOf,
  fromAngle,
  addMut,
  subMut,
  scaleMut,
  normalizeMut,
  pointToSegmentDist,
  segmentNormal,
  seededRng,
  dailySeed,
} from '../math';

describe('vec2', () => {
  it('creates a vector with x and y', () => {
    const v = vec2(3, 4);
    expect(v).toEqual({ x: 3, y: 4 });
  });

  it('handles negative values', () => {
    expect(vec2(-1, -2)).toEqual({ x: -1, y: -2 });
  });

  it('handles zero', () => {
    expect(vec2(0, 0)).toEqual({ x: 0, y: 0 });
  });
});

describe('add', () => {
  it('adds two vectors', () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
  });

  it('handles negative values', () => {
    expect(add({ x: 1, y: -2 }, { x: -3, y: 4 })).toEqual({ x: -2, y: 2 });
  });

  it('identity with zero vector', () => {
    const v = { x: 5, y: 7 };
    expect(add(v, { x: 0, y: 0 })).toEqual(v);
  });
});

describe('sub', () => {
  it('subtracts two vectors', () => {
    expect(sub({ x: 5, y: 7 }, { x: 2, y: 3 })).toEqual({ x: 3, y: 4 });
  });

  it('subtracting same vector gives zero', () => {
    const v = { x: 3, y: 4 };
    expect(sub(v, v)).toEqual({ x: 0, y: 0 });
  });
});

describe('scale', () => {
  it('scales a vector by a scalar', () => {
    expect(scale({ x: 2, y: 3 }, 2)).toEqual({ x: 4, y: 6 });
  });

  it('scales by zero gives zero vector', () => {
    expect(scale({ x: 5, y: 10 }, 0)).toEqual({ x: 0, y: 0 });
  });

  it('scales by negative flips direction', () => {
    expect(scale({ x: 1, y: 2 }, -1)).toEqual({ x: -1, y: -2 });
  });
});

describe('length', () => {
  it('computes length of a 3-4-5 triangle', () => {
    expect(length({ x: 3, y: 4 })).toBe(5);
  });

  it('length of zero vector is 0', () => {
    expect(length({ x: 0, y: 0 })).toBe(0);
  });

  it('length of unit vectors is 1', () => {
    expect(length({ x: 1, y: 0 })).toBe(1);
    expect(length({ x: 0, y: 1 })).toBe(1);
  });
});

describe('normalize', () => {
  it('normalizes a vector to unit length', () => {
    const n = normalize({ x: 3, y: 4 });
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
    expect(length(n)).toBeCloseTo(1);
  });

  it('normalize({0,0}) returns {0,0} (not NaN)', () => {
    const n = normalize({ x: 0, y: 0 });
    expect(n).toEqual({ x: 0, y: 0 });
    expect(isNaN(n.x)).toBe(false);
    expect(isNaN(n.y)).toBe(false);
  });

  it('normalizing a unit vector returns unit vector', () => {
    const n = normalize({ x: 1, y: 0 });
    expect(n.x).toBeCloseTo(1);
    expect(n.y).toBeCloseTo(0);
  });
});

describe('dot', () => {
  it('computes dot product', () => {
    expect(dot({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11);
  });

  it('perpendicular vectors have dot product 0', () => {
    expect(dot({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(0);
  });

  it('parallel same-direction vectors have positive dot', () => {
    expect(dot({ x: 2, y: 0 }, { x: 3, y: 0 })).toBe(6);
  });

  it('anti-parallel vectors have negative dot', () => {
    expect(dot({ x: 1, y: 0 }, { x: -1, y: 0 })).toBe(-1);
  });
});

describe('reflect', () => {
  it('reflects a vector off a horizontal surface', () => {
    const v = { x: 1, y: -1 };
    const normal = { x: 0, y: 1 };
    const r = reflect(v, normal);
    expect(r.x).toBeCloseTo(1);
    expect(r.y).toBeCloseTo(1);
  });

  it('reflects a vector off a vertical surface', () => {
    const v = { x: 1, y: 1 };
    const normal = { x: -1, y: 0 };
    const r = reflect(v, normal);
    expect(r.x).toBeCloseTo(-1);
    expect(r.y).toBeCloseTo(1);
  });

  it('preserves vector magnitude', () => {
    const v = { x: 3, y: 4 };
    const normal = normalize({ x: 1, y: 1 });
    const r = reflect(v, normal);
    expect(length(r)).toBeCloseTo(length(v));
  });

  it('reflecting along normal reverses direction', () => {
    const v = { x: 0, y: -5 };
    const normal = { x: 0, y: 1 };
    const r = reflect(v, normal);
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(5);
  });
});

describe('dist', () => {
  it('computes distance between two points', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('dist(a,a) === 0', () => {
    const a = { x: 7, y: 11 };
    expect(dist(a, a)).toBe(0);
  });

  it('is commutative', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 4, y: 6 };
    expect(dist(a, b)).toBe(dist(b, a));
  });
});

describe('lerp', () => {
  it('lerp at t=0 returns a', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('lerp at t=1 returns b', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('lerp at t=0.5 returns midpoint', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it('lerp with equal values returns that value', () => {
    expect(lerp(5, 5, 0.7)).toBe(5);
  });

  it('lerp works with negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });
});

describe('clamp', () => {
  it('clamps value below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps value above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('returns min when value equals min (exact boundary)', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max when value equals max (exact boundary)', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('handles min === max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe('angleOf', () => {
  it('angle of (1,0) is 0', () => {
    expect(angleOf({ x: 1, y: 0 })).toBe(0);
  });

  it('angle of (0,1) is PI/2', () => {
    expect(angleOf({ x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
  });

  it('angle of (-1,0) is PI', () => {
    expect(angleOf({ x: -1, y: 0 })).toBeCloseTo(Math.PI);
  });

  it('angle of (0,-1) is -PI/2', () => {
    expect(angleOf({ x: 0, y: -1 })).toBeCloseTo(-Math.PI / 2);
  });
});

describe('fromAngle', () => {
  it('angle 0 gives (1,0) direction', () => {
    const v = fromAngle(0);
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(0);
  });

  it('angle PI/2 gives (0,1) direction', () => {
    const v = fromAngle(Math.PI / 2);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(1);
  });

  it('respects magnitude parameter', () => {
    const v = fromAngle(0, 5);
    expect(v.x).toBeCloseTo(5);
    expect(v.y).toBeCloseTo(0);
    expect(length(v)).toBeCloseTo(5);
  });

  it('default magnitude is 1', () => {
    const v = fromAngle(Math.PI / 4);
    expect(length(v)).toBeCloseTo(1);
  });

  it('roundtrips with angleOf', () => {
    const angle = 1.234;
    const v = fromAngle(angle);
    expect(angleOf(v)).toBeCloseTo(angle);
  });
});

describe('pointToSegmentDist', () => {
  it('point on the segment returns 0', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };
    const p = { x: 5, y: 0 }; // on the segment
    expect(pointToSegmentDist(p, a, b)).toBeCloseTo(0);
  });

  it('point perpendicular to segment midpoint', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };
    const p = { x: 5, y: 3 };
    expect(pointToSegmentDist(p, a, b)).toBeCloseTo(3);
  });

  it('point past start endpoint clamps to start', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };
    const p = { x: -3, y: 4 }; // past start
    expect(pointToSegmentDist(p, a, b)).toBeCloseTo(5); // dist to (0,0) = 5
  });

  it('point past end endpoint clamps to end', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };
    const p = { x: 13, y: 4 }; // past end
    expect(pointToSegmentDist(p, a, b)).toBeCloseTo(5); // dist to (10,0) = 5
  });

  it('zero-length segment returns distance to the point', () => {
    const a = { x: 5, y: 5 };
    const p = { x: 8, y: 9 };
    expect(pointToSegmentDist(p, a, a)).toBeCloseTo(5);
  });
});

describe('segmentNormal', () => {
  it('horizontal segment has vertical normal', () => {
    const n = segmentNormal({ x: 0, y: 0 }, { x: 10, y: 0 });
    expect(Math.abs(n.x)).toBeCloseTo(0);
    expect(Math.abs(n.y)).toBeCloseTo(1);
  });

  it('vertical segment has horizontal normal', () => {
    const n = segmentNormal({ x: 0, y: 0 }, { x: 0, y: 10 });
    expect(Math.abs(n.x)).toBeCloseTo(1);
    expect(Math.abs(n.y)).toBeCloseTo(0);
  });

  it('normal has unit length', () => {
    const n = segmentNormal({ x: 1, y: 2 }, { x: 4, y: 7 });
    expect(length(n)).toBeCloseTo(1);
  });

  it('normal is perpendicular to segment', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 4, y: 7 };
    const n = segmentNormal(a, b);
    const d = sub(b, a);
    expect(dot(n, d)).toBeCloseTo(0);
  });
});

describe('seededRng', () => {
  it('produces same sequence from same seed', () => {
    const rng1 = seededRng(42);
    const rng2 = seededRng(42);
    const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];
    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences from different seeds', () => {
    const rng1 = seededRng(42);
    const rng2 = seededRng(99);
    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];
    expect(seq1).not.toEqual(seq2);
  });

  it('produces values in [0, 1)', () => {
    const rng = seededRng(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('dailySeed', () => {
  it('returns a numeric seed', () => {
    const seed = dailySeed();
    expect(typeof seed).toBe('number');
    expect(Number.isFinite(seed)).toBe(true);
  });

  it('returns same value when called twice in quick succession', () => {
    const s1 = dailySeed();
    const s2 = dailySeed();
    expect(s1).toBe(s2);
  });

  it('seed format is YYYYMMDD', () => {
    const seed = dailySeed();
    const d = new Date();
    const expected = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    expect(seed).toBe(expected);
  });
});

describe('addMut', () => {
  it('adds b to target in place', () => {
    const target = { x: 1, y: 2 };
    const result = addMut(target, { x: 3, y: 4 });
    expect(target).toEqual({ x: 4, y: 6 });
    expect(result).toBe(target); // same reference
  });

  it('does not modify the second argument', () => {
    const b = { x: 3, y: 4 };
    addMut({ x: 1, y: 2 }, b);
    expect(b).toEqual({ x: 3, y: 4 });
  });
});

describe('subMut', () => {
  it('subtracts b from target in place', () => {
    const target = { x: 5, y: 7 };
    const result = subMut(target, { x: 2, y: 3 });
    expect(target).toEqual({ x: 3, y: 4 });
    expect(result).toBe(target);
  });

  it('subtracting same values gives zero', () => {
    const target = { x: 3, y: 4 };
    subMut(target, { x: 3, y: 4 });
    expect(target).toEqual({ x: 0, y: 0 });
  });
});

describe('scaleMut', () => {
  it('scales target in place', () => {
    const target = { x: 2, y: 3 };
    const result = scaleMut(target, 2);
    expect(target).toEqual({ x: 4, y: 6 });
    expect(result).toBe(target);
  });

  it('scaling by zero gives zero vector', () => {
    const target = { x: 5, y: 10 };
    scaleMut(target, 0);
    expect(target).toEqual({ x: 0, y: 0 });
  });

  it('scaling by negative flips direction', () => {
    const target = { x: 1, y: 2 };
    scaleMut(target, -1);
    expect(target).toEqual({ x: -1, y: -2 });
  });
});

describe('normalizeMut', () => {
  it('normalizes target in place to unit length', () => {
    const target = { x: 3, y: 4 };
    const result = normalizeMut(target);
    expect(target.x).toBeCloseTo(0.6);
    expect(target.y).toBeCloseTo(0.8);
    expect(length(target)).toBeCloseTo(1);
    expect(result).toBe(target);
  });

  it('zero vector stays zero (no NaN)', () => {
    const target = { x: 0, y: 0 };
    normalizeMut(target);
    expect(target).toEqual({ x: 0, y: 0 });
    expect(isNaN(target.x)).toBe(false);
  });

  it('unit vector stays unchanged', () => {
    const target = { x: 1, y: 0 };
    normalizeMut(target);
    expect(target.x).toBeCloseTo(1);
    expect(target.y).toBeCloseTo(0);
  });

  it('matches pure normalize output', () => {
    const v = { x: 7, y: -3 };
    const pure = normalize({ x: 7, y: -3 });
    normalizeMut(v);
    expect(v.x).toBeCloseTo(pure.x);
    expect(v.y).toBeCloseTo(pure.y);
  });
});
