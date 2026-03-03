import { describe, it, expect } from 'vitest';
import { submitDailyScore, getDailyStats } from '../convex-client';

describe('convex-client', () => {
  it('submitDailyScore returns without error when no URL configured', async () => {
    await expect(submitDailyScore(20260302, 500)).resolves.toBeUndefined();
  });

  it('getDailyStats returns null when no URL configured', async () => {
    const stats = await getDailyStats(20260302, 500);
    expect(stats).toBeNull();
  });
});
