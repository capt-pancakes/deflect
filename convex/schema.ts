import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  dailyScores: defineTable({
    seed: v.number(),
    score: v.number(),
  }).index('by_seed', ['seed']),
});
