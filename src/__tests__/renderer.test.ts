import { describe, it, expect } from 'vitest';
import { hexToRgb, fontString } from '../renderer';

describe('hexToRgb', () => {
  it('parses standard hex colors', () => {
    expect(hexToRgb('#ff4466')).toEqual([255, 68, 102]);
    expect(hexToRgb('#4488ff')).toEqual([68, 136, 255]);
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
  });

  it('returns cached result on repeat calls', () => {
    const first = hexToRgb('#44ff88');
    const second = hexToRgb('#44ff88');
    expect(first).toBe(second); // Same reference (cached)
  });

  it('handles lowercase and uppercase hex equally', () => {
    // These are different cache keys but should produce correct values
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
  });
});

describe('fontString', () => {
  it('generates non-bold font string', () => {
    const result = fontString(16);
    expect(result).toContain('16px');
    expect(result).not.toMatch(/^bold /);
    expect(result).toContain('-apple-system');
  });

  it('generates bold font string', () => {
    const result = fontString(24, true);
    expect(result).toMatch(/^bold /);
    expect(result).toContain('24px');
  });

  it('includes standard font family stack', () => {
    const result = fontString(12);
    expect(result).toContain('BlinkMacSystemFont');
    expect(result).toContain('Segoe UI');
    expect(result).toContain('sans-serif');
  });
});
