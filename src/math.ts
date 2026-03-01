import type { Vec2 } from './types';

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function reflect(v: Vec2, normal: Vec2): Vec2 {
  const d = 2 * dot(v, normal);
  return { x: v.x - d * normal.x, y: v.y - d * normal.y };
}

export function dist(a: Vec2, b: Vec2): number {
  return length(sub(a, b));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function angleOf(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

export function fromAngle(angle: number, magnitude: number = 1): Vec2 {
  return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
}

// --- Mutable variants for hot paths (modify target in place) ---

export function addMut(target: Vec2, b: Vec2): Vec2 {
  target.x += b.x;
  target.y += b.y;
  return target;
}

export function subMut(target: Vec2, b: Vec2): Vec2 {
  target.x -= b.x;
  target.y -= b.y;
  return target;
}

export function scaleMut(target: Vec2, s: number): Vec2 {
  target.x *= s;
  target.y *= s;
  return target;
}

export function normalizeMut(target: Vec2): Vec2 {
  const len = Math.sqrt(target.x * target.x + target.y * target.y);
  if (len > 0) {
    target.x /= len;
    target.y /= len;
  }
  return target;
}

/** Distance from point to line segment */
export function pointToSegmentDist(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = sub(b, a);
  const lenSq = dot(ab, ab);
  if (lenSq === 0) return dist(p, a); // Zero-length segment
  const ap = sub(p, a);
  const t = clamp(dot(ap, ab) / lenSq, 0, 1);
  return dist(p, add(a, scale(ab, t)));
}

/** Get the normal of a line segment (perpendicular) */
export function segmentNormal(a: Vec2, b: Vec2): Vec2 {
  const d = sub(b, a);
  return normalize({ x: -d.y, y: d.x });
}

/** Seeded random number generator (mulberry32) */
export function seededRng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Get today's seed for daily challenge */
export function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
