# 024 — Level Unlock Rewards

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §5.2, product-vision.md §Part 4

---

## Description

Define and implement the rewards granted at each player level. Every level up should feel meaningful — unlocking a new mode, theme, deflector skin, or trail effect. The unlock system is the bridge between the XP system and the cosmetics/mode systems.

### Unlock Table

| Level | Unlock |
|-------|--------|
| 1 | Starting state (Arcade, Zen, Daily) |
| 2 | Arena theme: "Nebula" (purple/pink starfield background) |
| 3 | Challenge Mode unlocked; Deflector skin: "Neon Green" |
| 4 | Arena theme: "Ocean" (deep blue with wave particles) |
| 5 | Boss Rush Mode unlocked; Deflector skin: "Fire Trail" |
| 6 | Orb trail effect: "Sparkle" |
| 7 | Arena theme: "Sunset" (warm oranges and reds) |
| 8 | Puzzle Mode unlocked; Deflector skin: "Ice Crystal" |
| 9 | Orb trail effect: "Rainbow" |
| 10 | Time Attack Mode unlocked; Arena theme: "Void" (minimal, high contrast) |
| 12 | Deflector skin: "Lightning" |
| 15 | Arena theme: "Retro" (pixel art style, 8-bit colors) |
| 20 | Deflector skin: "Gold Plated"; Title: "Deflect Master" |

---

## Acceptance Criteria

- [ ] Each level unlock is displayed during the Level Up celebration overlay
- [ ] Unlocked modes become selectable on the Mode Select Cards
- [ ] Unlocked cosmetics appear in the cosmetics selection menu
- [ ] Unlocked items are tracked in localStorage (`deflect_unlocks`)
- [ ] "NEW" badge appears on newly unlocked items until first viewed/used
- [ ] Unlock table is data-driven (easy to add new level rewards)
- [ ] Mode unlocks at their specified levels (Challenge at 3, Boss Rush at 5, etc.)

---

## Dependencies

- 023 (XP System) — level progression triggers unlocks
- 003 (Mode Select Cards) — locked/unlocked mode display
- 026 (Cosmetics) — cosmetic item definitions
