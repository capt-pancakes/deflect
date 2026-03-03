import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('convex-client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_CONVEX_URL', '');
    vi.resetModules();
  });

  it('submitDailyScore returns without error when no URL configured', async () => {
    const { submitDailyScore } = await import('../convex-client');
    await expect(submitDailyScore(20260302, 500)).resolves.toBeUndefined();
  });

  it('getDailyStats returns null when no URL configured', async () => {
    const { getDailyStats } = await import('../convex-client');
    const stats = await getDailyStats(20260302, 500);
    expect(stats).toBeNull();
  });
});
