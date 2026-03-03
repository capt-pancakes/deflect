# 041 — localStorage Data Schema

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md Appendix A

---

## Description

Define and implement the localStorage schema for all player data. All player data is stored locally with no server-side accounts. This schema underpins every persistence feature in the game and must be established before other features that read/write player data.

### Schema

```
deflect_high         : number         // Arcade high score
deflect_played       : "1"            // Has completed tutorial
deflect_daily        : {seed, score}  // Today's daily best
deflect_xp           : number         // Total XP earned
deflect_level        : number         // Current level
deflect_achievements : number[]       // Array of unlocked achievement IDs
deflect_stats        : {
  gamesPlayed: number,
  totalPlayTime: number,             // seconds
  totalCatches: number,
  totalMisses: number,
  bestCombo: number,
  bestSurvival: number,              // seconds
  colorCatches: {red, blue, green, yellow},
  colorMisses: {red, blue, green, yellow},
  recentGames: [{mode, score, duration, combo, accuracy, date}]  // last 10
}
deflect_streak       : {current, best, lastDate}
deflect_cosmetics    : {arena, deflector, trail}  // active cosmetic selections
deflect_unlocks      : string[]       // unlocked cosmetic IDs
deflect_settings     : {sfx, music, musicVol, sfxVol, reducedMotion, haptic, showFps}
deflect_puzzles      : {[id]: stars}  // puzzle completion + star ratings
deflect_challenges   : {[weekId]: bestScore}  // weekly challenge best scores
deflect_daily_reward : {day, lastClaimDate}   // daily reward cycle position
deflect_milestones   : string[]       // first-ever milestones that have fired
deflect_schema_ver   : number         // schema version for migration
deflect_daily_history: [{date, modifier, score, accuracy, combo}]  // last 7 daily results
```

---

## Acceptance Criteria

- [ ] All keys use the `deflect_` prefix
- [ ] Schema is documented in code (TypeScript interfaces or JSDoc)
- [ ] Read/write helpers handle JSON serialization/deserialization
- [ ] Missing keys return sensible defaults (not crashes or undefined)
- [ ] `deflect_stats.recentGames` is capped at 10 entries (oldest dropped)
- [ ] Schema supports the Reset Progress feature (clear all `deflect_` keys)
- [ ] Data migration strategy: if schema version changes, old data is migrated or safely ignored
- [ ] No PII is stored
- [ ] Total localStorage usage stays under 100KB for a typical player
- [ ] `deflect_schema_ver` key tracks schema version number
- [ ] Migration framework: on load, if version < current, run sequential migration functions
- [ ] Migration functions kept in dedicated `migrations.ts` file
- [ ] `deflect_stats` includes `colorCatches` and `colorSpawns` per color (for Stats screen)
- [ ] `deflect_daily_history` stores last 7 daily results with modifier info

**Tech note (Morgan TL):** Safari private mode has 0 bytes localStorage quota. All writes must be wrapped in try/catch with graceful degradation (already done in existing code — maintain this pattern). The 100KB limit is generous — typical player data will be under 10KB. The real risk is the 5MB browser limit on some browsers. See ticket 045 for the unified persistence layer that implements this schema.

---

## Dependencies

- **045 (Persistence Layer)** — implements the read/write layer for this schema
- None otherwise (foundational — most other tickets depend on this)
