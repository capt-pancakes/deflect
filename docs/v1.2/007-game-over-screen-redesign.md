# 007 — Game Over Screen Redesign

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §2.7 (US-MENU-07), product-vision.md §Part 5

---

## Description

Replace the current minimal game over screen with a rich, celebratory screen that shows performance, progress, and makes it effortless to retry. This is a critical retention moment — the player just died, and we need to immediately give them a reason to play again (XP progress, coaching tips, achievements, retry button).

### Layout (top to bottom)

| Element | Details |
|---------|---------|
| Title | "CORE BREACH" (red) for Arcade/Daily; "SESSION END" (green) for Zen |
| Final Score | Large white bold number with count-up animation (0 to final over 1s) |
| New High Score banner | Gold text, bouncing animation, only if new record |
| XP Earned bar | "+120 XP" with animated fill bar showing progress toward next level |
| Level Up celebration | If XP crosses level threshold: "LEVEL UP!" with particle burst, shows unlocks |
| Stats row | Survived time, catches, best combo, accuracy % |
| Per-color breakdown | 4 colored circles with catch counts, worst color highlighted |
| Coaching tip | Contextual advice based on performance |
| Achievement popups | Newly earned achievements slide in from right, 1.5s apart |
| **RETRY** button | Blue, large, prominent — restarts same mode immediately |
| **SHARE** button | Outlined style, next to retry |
| **MENU** button | Small text link below action buttons |

### Coaching Tip Logic

- If accuracy < 50%: "Focus on bouncing orbs toward matching colors"
- If worst color has > 3 misses: "Practice aiming [COLOR] orbs — they leaked the most"
- If max combo < 5: "Try to chain 5 catches in a row for bonus points!"
- If max combo >= 10: "Incredible combos! Aim for [maxCombo + 5]x next time"
- If survived > 90s: "Amazing endurance! Can you push to [next 30s milestone]?"

### Transition Animations

- Dark overlay fades in over 400ms
- Elements appear staggered: title (0ms), score (200ms), XP bar (400ms), stats (600ms), buttons (800ms)
- Achievement popups begin at 1200ms

---

## Acceptance Criteria

- [ ] RETRY button restarts the same mode without returning to menu
- [ ] Score count-up animation runs over 1 second with easing
- [ ] XP bar animates to show gain (from pre-game XP to post-game XP)
- [ ] Level up celebration interrupts the normal flow with a 2s fanfare overlay
- [ ] Achievement popups queue and display one at a time (1.5s each)
- [ ] Tapping anywhere except buttons does NOT dismiss the screen
- [ ] MENU button returns to Main Menu with fade transition
- [ ] Coaching tip is contextual and never generic
- [ ] If new high score: firework particle burst, gold text, special sound
- [ ] If close to high score (within 10%): "SO CLOSE!" text to drive retry
- [ ] Death sequence: 500ms slow-mo where the core cracks and shatters before overlay (split as polish sub-task if needed)
- [ ] For Daily Challenge: RETRY button is grayed out with "1 attempt per day" text (not clickable)
- [ ] Staggered element animation shares the timeline/sequencing system from ticket 008/042

---

## Dependencies

- 023 (XP System) — XP calculation and level-up logic
- 025 (Achievements) — achievement popup data
- 033 (Share System) — share button functionality
- 008 (Screen Transitions) — transition system
