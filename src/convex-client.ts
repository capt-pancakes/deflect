import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

let client: ConvexHttpClient | null = null;

function getClient(): ConvexHttpClient | null {
  if (client) return client;
  const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
  if (!url) return null;
  client = new ConvexHttpClient(url);
  return client;
}

export async function submitDailyScore(seed: number, score: number): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    await c.mutation(api.dailyScores.submitScore, { seed, score });
  } catch {
    // Silently fail — game works offline
  }
}

export async function getDailyStats(
  seed: number,
  playerScore: number,
): Promise<{ attempts: number; percentile: number } | null> {
  const c = getClient();
  if (!c) return null;
  try {
    return await c.query(api.dailyScores.getStatsWithPercentile, { seed, playerScore });
  } catch {
    return null;
  }
}
