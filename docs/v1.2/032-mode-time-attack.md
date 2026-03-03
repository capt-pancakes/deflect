# 032 — Time Attack Mode

**Priority:** T4 — Polish
**Refs:** feature-specs.md §6.4 (US-MODE-04)

---

## Description

Implement Time Attack Mode — a race to reach a target score of 500 points as fast as possible. Timer counts up from 0. All 4 colors are active from the start with no ramp-up period. High score = fastest completion time. Unlocks at Level 10.

### HUD Changes

- Large timer in center top (replaces score display position)
- Score shown as progress bar: "340 / 500" with fill bar
- Golden marker on the bar at the 500-point threshold

### Difficulty

- Speed and spawn rate fixed at the 45-second Arcade difficulty level (no ramp)
- All orb types active from the start
- Power-ups spawn at normal rate

---

## Acceptance Criteria

- [ ] Timer precision to 1 decimal place (e.g., "42.3s")
- [ ] When target score (500) reached, timer freezes and "COMPLETE!" celebration plays
- [ ] Game over screen shows time as primary metric (not score)
- [ ] Best time saved separately from Arcade high score
- [ ] If core HP reaches 0 before target score: game over shows "FAILED — reached [score]/500"
- [ ] All 4 colors active from second 0 (no ramp-up)
- [ ] Score progress bar with golden 500-point marker
- [ ] Speed and spawn rate are fixed (no difficulty ramp)
- [ ] All orb types available from start
- [ ] Unlocks at Level 10

---

## Dependencies

- 003 (Mode Select Cards) — locked/unlocked display
- 024 (Level Unlocks) — unlock at Level 10
