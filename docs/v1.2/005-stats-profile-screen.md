# 005 — Stats / Profile Screen

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §2.5 (US-MENU-05), product-vision.md §Part 4

---

## Description

Add a Stats/Profile screen so players can track their improvement over time. This screen aggregates personal bests, per-color performance, recent game history, and streak data. It provides the meta-layer that makes every session feel productive, even when the high score doesn't fall.

### Screen Sections

**Summary Bar (top):**
- Player level + XP progress bar
- Total games played
- Total play time (formatted: "12h 34m")

**Personal Bests:**
- Arcade high score
- Zen best accuracy percentage
- Daily best score (today)
- Longest survival time
- Highest combo ever

**Per-Color Stats:**
- Four colored bars showing catch rate per color (catches / total signals of that color)
- Highlights weakest color with "Practice this!" label

**Achievement Gallery:**
- Grid of achievement icons (locked = grayed, unlocked = full color)
- Links to full achievement list (ticket 025)
- Shows X/25 unlocked count

**Recent Games (last 10):**
- Each row: Mode icon | Score | Duration | Combo | Date

**Streak Tracker:**
- Calendar-style row showing last 7 days
- Filled circles for days played, empty for missed
- Current streak count with flame icon

---

## Acceptance Criteria

- [ ] All stats stored in localStorage as a JSON blob under `deflect_stats`
- [ ] Stats update immediately after each game over
- [ ] If no games played, show "Play your first game!" prompt instead of empty stats
- [ ] Color catch-rate bars are proportional and use the correct signal colors
- [ ] Streak resets if a day is missed (based on local device date)
- [ ] Recent games list shows last 10 games with mode, score, duration, combo, and date
- [ ] Back arrow returns to Main Menu
- [ ] Transition: slide in from left, slide out to left on back
- [ ] Cosmetics menu accessible from this screen (links to ticket 026)
- [ ] Achievement gallery section showing locked/unlocked state (links to ticket 025)

**Tech note (Morgan TL):** The current `ScoreManager` tracks `colorMisses` but NOT `colorCatches`. Per-color catch tracking and per-color spawn tracking must be added to the game loop as a prerequisite. Add `colorCatches` and `colorSpawns` to the stats schema.

---

## Dependencies

- 002 (Main Menu) — navigation source
- 023 (XP System) — level and XP data
- 041 (localStorage Schema) — storage format
