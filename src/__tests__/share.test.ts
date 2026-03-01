import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { generateScoreCard } from '../share';

beforeAll(() => {
  vi.stubGlobal('window', { location: { href: 'https://example.com' } });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('generateScoreCard', () => {
  const baseStats = {
    score: 1000,
    survived: 60,
    catches: 10,
    misses: 2,
    maxCombo: 5,
    mode: 'arcade',
  };

  describe('mode labels', () => {
    it('shows ARCADE for arcade mode', () => {
      const card = generateScoreCard({ ...baseStats, mode: 'arcade' });
      expect(card).toContain('ARCADE');
    });

    it('shows ZEN for zen mode', () => {
      const card = generateScoreCard({ ...baseStats, mode: 'zen' });
      expect(card).toContain('ZEN');
    });

    it('shows DAILY for daily mode', () => {
      const card = generateScoreCard({ ...baseStats, mode: 'daily' });
      expect(card).toContain('DAILY');
    });

    it('defaults to ARCADE for unknown mode', () => {
      const card = generateScoreCard({ ...baseStats, mode: 'unknown' });
      expect(card).toContain('ARCADE');
    });
  });

  describe('accuracy bar', () => {
    it('shows all filled for 100% accuracy', () => {
      const card = generateScoreCard({ ...baseStats, catches: 10, misses: 0 });
      // 10 filled white squares, 0 black
      expect(card).toContain('\u2b1c\u2b1c\u2b1c\u2b1c\u2b1c\u2b1c\u2b1c\u2b1c\u2b1c\u2b1c 100%');
    });

    it('shows all empty for 0% accuracy', () => {
      const card = generateScoreCard({ ...baseStats, catches: 0, misses: 10 });
      // 0 filled, 10 black squares
      expect(card).toContain('\u2b1b\u2b1b\u2b1b\u2b1b\u2b1b\u2b1b\u2b1b\u2b1b\u2b1b\u2b1b 0%');
    });

    it('shows half filled for 50% accuracy', () => {
      const card = generateScoreCard({ ...baseStats, catches: 5, misses: 5 });
      expect(card).toContain('\u2b1c\u2b1c\u2b1c\u2b1c\u2b1c\u2b1b\u2b1b\u2b1b\u2b1b\u2b1b 50%');
    });

    it('shows 0% accuracy when no catches or misses', () => {
      const card = generateScoreCard({ ...baseStats, catches: 0, misses: 0 });
      expect(card).toContain('0%');
    });
  });

  describe('combo display', () => {
    it('shows no fire emoji for combo < 3', () => {
      const card = generateScoreCard({ ...baseStats, maxCombo: 2 });
      expect(card).not.toContain('\ud83d\udd25');
    });

    it('shows one fire emoji for combo 3-4', () => {
      const card = generateScoreCard({ ...baseStats, maxCombo: 3 });
      expect(card).toContain('3x \ud83d\udd25');
      expect(card).not.toContain('\ud83d\udd25\ud83d\udd25');
    });

    it('shows two fire emojis for combo 5-9', () => {
      const card = generateScoreCard({ ...baseStats, maxCombo: 7 });
      expect(card).toContain('7x \ud83d\udd25\ud83d\udd25');
      expect(card).not.toContain('\ud83d\udd25\ud83d\udd25\ud83d\udd25');
    });

    it('shows three fire emojis for combo >= 10', () => {
      const card = generateScoreCard({ ...baseStats, maxCombo: 15 });
      expect(card).toContain('15x \ud83d\udd25\ud83d\udd25\ud83d\udd25');
    });
  });

  describe('score and survival display', () => {
    it('includes score and survival time', () => {
      const card = generateScoreCard({ ...baseStats, score: 2500, survived: 90 });
      expect(card).toContain('2500 pts');
      expect(card).toContain('90s');
    });

    it('floors fractional survival time', () => {
      const card = generateScoreCard({ ...baseStats, survived: 0.8 });
      expect(card).toContain('<1s');
    });
  });

  describe('color performance pattern', () => {
    it('shows full color squares when no misses per color', () => {
      const card = generateScoreCard({
        ...baseStats,
        colorMisses: { red: 0, blue: 0, green: 0, yellow: 0 },
      });
      expect(card).toContain('\ud83d\udfe5\ud83d\udfe6\ud83d\udfe9\ud83d\udfe8');
    });

    it('shows orange for colors with 1-2 misses', () => {
      const card = generateScoreCard({
        ...baseStats,
        colorMisses: { red: 1, blue: 2, green: 0, yellow: 0 },
      });
      // red=orange, blue=orange, green=full, yellow=full
      expect(card).toContain('\ud83d\udfe7\ud83d\udfe7\ud83d\udfe9\ud83d\udfe8');
    });

    it('shows black for colors with 3+ misses', () => {
      const card = generateScoreCard({
        ...baseStats,
        colorMisses: { red: 5, blue: 0, green: 3, yellow: 0 },
      });
      // red=black, blue=full, green=black, yellow=full
      expect(card).toContain('\u2b1b\ud83d\udfe6\u2b1b\ud83d\udfe8');
    });

    it('shows no pattern when totalSignals is 0', () => {
      const card = generateScoreCard({ ...baseStats, catches: 0, misses: 0 });
      // No color pattern should appear
      expect(card).not.toContain('\ud83d\udfe5');
      expect(card).not.toContain('\ud83d\udfe6');
    });
  });

  describe('edge cases', () => {
    it('handles 0 catches and 0 misses', () => {
      const card = generateScoreCard({
        score: 0,
        survived: 0,
        catches: 0,
        misses: 0,
        maxCombo: 0,
        mode: 'arcade',
      });
      expect(card).toContain('0 pts');
      expect(card).toContain('<1s');
      expect(card).toContain('0%');
    });

    it('handles sub-second survival time', () => {
      const card = generateScoreCard({ ...baseStats, survived: 0.5 });
      expect(card).toContain('<1s');
    });

    it('handles no colorMisses property', () => {
      const card = generateScoreCard(baseStats);
      // Should not throw; colorMisses defaults to {}
      expect(card).toContain('DEFLECT');
    });
  });
});
