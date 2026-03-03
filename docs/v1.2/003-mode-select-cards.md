# 003 — Mode Select Cards

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §2.3 (US-MENU-03), product-vision.md §Part 2

---

## Description

Implement a vertically scrollable card-based mode selector on the Main Menu. Each mode is presented as a horizontal card with an icon, color accent, subtitle, and lock state. Players should understand what each mode offers before selecting it.

Locked modes show a grayed-out padlock overlay with the level required to unlock. Tapping a locked card shows a 2-second toast with the unlock requirement.

### Mode Card Definitions

| Mode | Color | Icon | Subtitle | Lock State |
|------|-------|------|----------|------------|
| ARCADE | Blue (#4488ff) | Shield | "Survive as long as you can" | Always unlocked |
| ZEN | Green (#44ff88) | Infinity | "No damage, pure flow" | Always unlocked |
| DAILY | Gold (#ffcc44) | Calendar | "Same pattern for everyone" | Always unlocked |
| CHALLENGE | Purple (#aa44ff) | Star | "Weekly modifiers" | Unlocks at Level 3 |
| BOSS RUSH | Red (#ff4466) | Skull | "Survive the waves" | Unlocks at Level 5 |
| PUZZLE | Cyan (#44ddff) | Puzzle piece | "Find the perfect path" | Unlocks at Level 8 |
| TIME ATTACK | Orange (#ff8844) | Stopwatch | "Race the clock" | Unlocks at Level 10 |

---

## Acceptance Criteria

- [ ] Locked modes are visually distinct (desaturated, padlock overlay with "LEVEL X" text)
- [ ] Tapping a locked mode shows unlock requirement toast ("Reach Level X to unlock [Mode Name]"), does NOT start a game
- [ ] Toast fades after 2 seconds
- [ ] Tapping an unlocked mode starts the game in that mode with a zoom-in transition
- [ ] "NEW" badge appears on newly unlocked modes until first played
- [ ] First 3 modes (Arcade, Zen, Daily) are visible without scrolling on standard phone screens
- [ ] If more than 3 cards fit on screen, the list scrolls vertically
- [ ] Cards have distinct color accents and recognizable icons

---

## Dependencies

- 002 (Main Menu) — parent screen
- 023 (XP System) — level data for lock state
- 024 (Level Unlocks) — which levels unlock which modes
