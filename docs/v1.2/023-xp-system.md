# 023 — XP System & Leveling

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §5.1 (US-PROG-01), product-vision.md §Part 4

---

## Description

Implement an experience point system that gives players a sense of progress after every game, even when they don't beat their high score. XP feeds into a level system that unlocks modes, cosmetics, and other rewards. This is one of the three primary D7 retention levers.

### XP Sources

| Action | XP Earned |
|--------|-----------|
| Complete a game (any mode) | 20 base XP |
| Per catch | 2 XP each |
| Per 5x combo | 5 XP bonus |
| Per 10x combo | 15 XP bonus |
| New high score | 25 XP bonus |
| Daily challenge completed | 30 XP bonus |
| Daily streak day (consecutive) | 10 XP * streak_length (capped at 70 XP for 7+ day streak) |
| Achievement unlocked | 10-50 XP (varies by achievement) |
| Survive 60s+ | 10 XP bonus |
| Survive 120s+ | 25 XP bonus |
| First game of the day | 25 XP bonus |

### Level Curve

| Level | Total XP Required |
|-------|-------------------|
| 1 | 0 |
| 2 | 100 |
| 3 | 250 |
| 4 | 450 |
| 5 | 700 |
| 6 | 1,000 |
| 7 | 1,350 |
| 8 | 1,800 |
| 9 | 2,350 |
| 10 | 3,000 |
| 11+ | +750 XP per level |

---

## Acceptance Criteria

- [ ] XP is calculated and displayed on the game over screen
- [ ] XP bar animation shows the gain clearly (from old total to new total)
- [ ] Level up triggers a celebration overlay (particles, sound, "LEVEL UP!" text)
- [ ] Level and XP persist in localStorage (`deflect_xp`, `deflect_level`)
- [ ] XP cannot be lost or go negative
- [ ] XP calculation includes all sources listed in the table
- [ ] Level curve follows the specified thresholds
- [ ] Level 11+ uses the +750 XP per level formula
- [ ] First game for a new player yields ~40-80 XP (sanity check)
- [ ] Level up celebration shows what was unlocked at the new level
- [ ] First game of the day awards 25 XP bonus (tracked by date in localStorage)

**Design note:** The product vision uses score-based XP (1 XP per 100 points) and continuous survival XP (1 XP per 10s). The feature-specs use catch-based XP and threshold survival bonuses. We follow the feature-specs approach as it rewards engagement (catches) more directly than raw score.

**Tech note (Morgan TL):** Several XP sources depend on systems that don't exist yet (daily challenge, streak, achievements). Implement base sources first (completion, catches, combos, high score, survival). Add bonus sources as those systems come online. Design XP calculator to accept optional bonus source list.

---

## Dependencies

- 007 (Game Over Screen) — XP bar display location
- 024 (Level Unlocks) — what gets unlocked at each level
- 041 (localStorage Schema) — storage format
