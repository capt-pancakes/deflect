import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const submitScore = mutation({
  args: { seed: v.number(), score: v.number() },
  handler: async (ctx, { seed, score }) => {
    await ctx.db.insert('dailyScores', { seed, score });
  },
});

export const getStatsWithPercentile = query({
  args: { seed: v.number(), playerScore: v.number() },
  handler: async (ctx, { seed, playerScore }) => {
    const scores = await ctx.db
      .query('dailyScores')
      .withIndex('by_seed', (q) => q.eq('seed', seed))
      .collect();
    if (scores.length === 0) return { attempts: 0, percentile: 100 };
    const below = scores.filter((s) => s.score < playerScore).length;
    const percentile = Math.round((below / scores.length) * 100);
    return { attempts: scores.length, percentile };
  },
});
