# 055 — Gauntlet Mode

**Priority:** T3 — Variety
**Source:** Alex (PO) review — M2; product-vision.md Part 3

---

## Description

Implement Gauntlet Mode — a 5-round endurance mode where HP carries over between rounds and players choose power-ups between rounds (Vampire Survivors style). This is the "serious player" mode for leaderboard chasers. Unlocks at Level 5.

### Structure

- 5 back-to-back rounds with escalating difficulty
- HP carries over between rounds (no reset)
- Between rounds: choose 1 of 3 random power-ups
- Final score is cumulative across all 5 rounds
- Each round is 30 seconds

### Round Escalation

| Round | Colors | Speed | Spawn Rate | Special |
|-------|--------|-------|------------|---------|
| 1 | 2 | 1.0x | Normal | Standard orbs only |
| 2 | 3 | 1.2x | 1.2x | Gold orbs introduced |
| 3 | 3 | 1.4x | 1.4x | Rainbow + splitter orbs |
| 4 | 4 | 1.6x | 1.6x | Ghost orbs introduced |
| 5 | 4 | 1.8x | 1.8x | All orb types + bomb orbs |

### Between-Round UI

- Dark overlay with "ROUND X COMPLETE" text
- Round stats (catches, misses, remaining HP)
- 3-card power-up selection (tap to choose)
- 5-second countdown to next round

---

## Acceptance Criteria

- [ ] 5 rounds of 30 seconds each with escalating difficulty
- [ ] HP carries over between rounds (not restored)
- [ ] Power-up selection between rounds: 3 random cards, tap to choose
- [ ] Score is cumulative across all rounds
- [ ] Game over shows rounds completed + total score
- [ ] Each round introduces new orb types per the escalation table
- [ ] Unlocks at Level 5
- [ ] Between-round UI shows stats and countdown timer
- [ ] If HP reaches 0 mid-round, game ends immediately

---

## Dependencies

- 003 (Mode Select Cards) — mode card entry
- 009 (Power-Up Core System) — power-up selection between rounds
- 024 (Level Unlocks) — unlock at Level 5
- 016-022 (Orb Types) — orb types for later rounds
