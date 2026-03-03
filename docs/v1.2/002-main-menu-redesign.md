# 002 — Main Menu Redesign

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §2.2 (US-MENU-02), product-vision.md §Part 2

---

## Description

Replace the current flat 3-button canvas menu with an animated hub screen that shows progression, streak status, and gives returning players context about where they are in the game. The menu should feel alive, with the existing arena ring and ambient particles in the background and the title glow synced to the background music beat.

First-time and returning players should see different states — no streak badge or high score for new players; streak badges, high scores, "NEW" indicators, and recently unlocked highlights for returning players.

### Layout (top to bottom)

| Element | Position | Details |
|---------|----------|---------|
| Player banner | Top | Player level + XP bar, streak flame icon, avatar (unlockable) |
| DEFLECT title | Upper center | White bold text, pulsing blue glow |
| Tagline | Below title | "Swipe to deflect. Match the colors." in muted gray (#8888aa) |
| Daily streak badge | Below tagline | If streak > 0: flame icon + "3-day streak!" in gold (#ffcc44). Hidden if no streak. |
| "Beat your best" | Below streak | "Last: 1,180 — 60 pts away!" if last score within 10% of high score. Hidden otherwise. |
| Mode Selector | Center | Mode cards (see ticket 003) |
| Stats button | Bottom left | "STATS" text button, muted style |
| Settings gear | Bottom right | Gear icon, muted style |
| High score | Below mode cards | "BEST: 1,240" in gold if > 0 |
| Arena ring | Background | Existing animated ring with 4 demo-colored ports |
| Ambient particles | Background | Existing slow particle drift |

---

## Acceptance Criteria

- [ ] All interactive elements have touch targets >= 44x44px
- [ ] Keyboard shortcuts still work: 1/A=Arcade, 2/Z=Zen, 3/D=Daily
- [ ] Stats and Settings buttons navigate to their respective screens
- [ ] First-time players see no streak badge and no high score
- [ ] Returning players see streak badge (if streak >= 1), high score, "NEW" badge on Daily Challenge if not yet attempted today
- [ ] Tapping anywhere outside a button does NOT auto-start Arcade (remove prototype shortcut)
- [ ] Title has gentle float animation (sine wave on Y) and glow pulse synced to ambient music
- [ ] Mode cards slide in with stagger delay (0ms, 100ms, 200ms)
- [ ] Daily challenge card has subtle shimmer effect
- [ ] Streak flame animates (small/medium/large based on streak length)
- [ ] Buttons have press animation (scale to 95%, bounce back to 100%)
- [ ] Newly unlocked modes/features have a subtle shimmer highlight
- [ ] Player banner at top shows current level, XP progress bar, and streak flame
- [ ] "Beat your best" reminder shown when last score was within 10% of high score

**Tech note (Morgan TL):** The current `Game.updateMenu()` uses manual rectangle hit-testing (game.ts:599-664). Extract a lightweight `UIButton` class with `{ x, y, w, h, label, onTap, render }` to avoid growing the hit-test `if` chain. See ticket 042 for the screen manager architecture.

---

## Dependencies

- 001 (Splash Screen) — transition source
- 003 (Mode Select Cards) — child component
- 004 (Settings Screen) — navigation target
- 005 (Stats Screen) — navigation target
- 023 (XP System) — level display data
