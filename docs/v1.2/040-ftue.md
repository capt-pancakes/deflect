# 040 — First-Time User Experience

**Priority:** T1 — Core Retention Loop
**Refs:** product-vision.md §Part 2, feature-specs.md §8.1

---

## Description

Redesign the first-time user experience to gradually introduce the game's systems over the first 3 games. The current tutorial is a single swipe demo. The new FTUE should be a progressive onboarding that expands the menu and introduces features as the player demonstrates readiness.

### Progressive Onboarding

**First visit (0 games played):**
- Simplified menu: just DEFLECT title and a large pulsing "TAP TO PLAY" button
- No mode selection, no stats, no settings visible
- Tapping starts Arcade mode with tutorial

**Tutorial (enhanced):**
- Phase 1: Slow signal approaches, ghost swipe animation shows how to draw a deflector, "SWIPE TO DEFLECT!" hint pulses
- Phase 2: Signal bounces off deflector, enters port (or misses + timeout), "NICE!" or auto-complete after 3s

**After first game:**
- Menu expands to show mode selection (Arcade, Zen, Daily)
- High score visible
- "Getting Started" achievement popup

**After 3 games:**
- Full menu visible (stats, settings, daily challenge card)
- Daily streak tracking begins

### First-Game XP

- First game should yield ~40-80 XP (enough to feel meaningful progress)

---

## Acceptance Criteria

- [ ] Brand-new players see simplified menu (title + "TAP TO PLAY" only)
- [ ] Tutorial Phase 1: ghost swipe animation with "SWIPE TO DEFLECT!" hint
- [ ] Tutorial Phase 2: demonstrates bounce and port catch
- [ ] Tutorial auto-completes after 3 seconds if player doesn't interact
- [ ] After first game completion, menu expands to show 3 mode cards
- [ ] After 3 games, full menu is visible (stats, settings, daily card)
- [ ] Progressive disclosure is tracked in localStorage (`deflect_played`)
- [ ] First game awards 20+ base XP (game completion + catches)
- [ ] Tutorial does not replay after first completion unless progress is reset
- [ ] First game only spawns standard orbs (no special orb types or power-ups — avoid overwhelming new players)

**Tech note (Morgan TL):** The current tutorial (tutorial.ts) is a thorough 10-phase state machine with 3 steps: deflect, multi-deflect, color matching. Do NOT reduce it to 2 phases — that loses the color-matching lesson. Keep the existing tutorial as-is. "Phase 1" and "Phase 2" in this ticket refer to FTUE stages (simplified menu → expanded menu), not tutorial phases. Add progressive menu disclosure as a separate concern tracked by `gamesPlayed` count.

---

## Dependencies

- 002 (Main Menu) — progressive menu states
- 023 (XP System) — first-game XP calculation
- 025 (Achievements) — "Getting Started" achievement
