# 025 — Achievement System

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §5.3 (US-PROG-02), product-vision.md §Part 4

---

## Description

Implement an achievement system that recognizes specific accomplishments across multiple sessions. Achievements give players varied micro-goals that make every session productive. Each achievement awards XP and is tracked persistently.

### Achievement List

#### Beginner Achievements
| # | Name | Description | Criteria | XP |
|---|------|-------------|----------|-----|
| 1 | First Deflection | "Bounce your first orb" | Deflect 1 orb | 10 |
| 2 | First Catch | "Guide an orb into the right port" | Catch 1 orb | 10 |
| 3 | Getting Started | "Complete your first game" | Finish 1 game (any mode) | 10 |
| 4 | Colorful | "See all 4 colors in a single game" | Survive to 4-color phase | 15 |
| 5 | Daily Player | "Complete your first Daily Challenge" | Finish 1 daily challenge | 15 |

#### Combo Achievements
| # | Name | Description | Criteria | XP |
|---|------|-------------|----------|-----|
| 6 | Chain Reaction | "Reach a 5x combo" | 5x combo in one game | 15 |
| 7 | Combo King | "Reach a 10x combo" | 10x combo in one game | 25 |
| 8 | Unstoppable | "Reach a 20x combo" | 20x combo in one game | 40 |
| 9 | Perfect Machine | "Reach a 50x combo" | 50x combo in one game | 50 |

#### Score Achievements
| # | Name | Description | Criteria | XP |
|---|------|-------------|----------|-----|
| 10 | Century | "Score 100 points in one game" | Score >= 100 | 10 |
| 11 | High Roller | "Score 500 points in one game" | Score >= 500 | 20 |
| 12 | Thousand Club | "Score 1,000 points in one game" | Score >= 1,000 | 30 |
| 13 | Score Legend | "Score 5,000 points in one game" | Score >= 5,000 | 50 |

#### Survival Achievements
| # | Name | Description | Criteria | XP |
|---|------|-------------|----------|-----|
| 14 | Minute Man | "Survive 60 seconds" | Survive 60s in Arcade | 15 |
| 15 | Endurance | "Survive 120 seconds" | Survive 120s in Arcade | 30 |
| 16 | Marathon | "Survive 180 seconds" | Survive 180s in Arcade | 50 |

#### Special Achievements
| # | Name | Description | Criteria | XP |
|---|------|-------------|----------|-----|
| 17 | Close Call | "Trigger 3 near-misses in one game" | 3 near-miss events | 15 |
| 18 | Sharpshooter | "Finish a game with 90%+ accuracy" | Accuracy >= 90%, min 10 catches | 25 |
| 19 | Perfect Game | "Finish a game with 100% accuracy (min 20 catches)" | 100% accuracy, min 20 catches | 50 |
| 20 | Bomb Defuser | "Deflect 5 bomb orbs in a single game" | Deflect 5 bombs | 30 |
| 21 | Gold Rush | "Catch 3 gold orbs in a single game" | Catch 3 gold orbs | 20 |
| 22 | Ghost Buster | "Catch 3 ghost orbs in a single game" | Catch 3 ghost orbs | 25 |
| 23 | Trick Shot | "Triple-bounce an orb into a port" | 3-bounce catch (with Multi-Bounce) | 30 |
| 24 | Streak Master | "Maintain a 7-day daily challenge streak" | 7 consecutive daily completions | 40 |
| 25 | Dedicated | "Play 50 games total" | Cumulative 50 games played | 30 |

#### Cumulative Achievements
| # | Name | Description | Criteria | XP |
|---|------|-------------|----------|-----|
| 26 | Century | "Catch 100 orbs total" | 100 cumulative catches (all games) | 15 |
| 27 | Millennium | "Catch 1,000 orbs total" | 1,000 cumulative catches | 30 |
| 28 | Centurion | "Play 100 games total" | 100 cumulative games played | 40 |
| 29 | Veteran | "Reach Player Level 25" | Reach level 25 | 50 |

#### Secret Achievements (hidden until earned)
| # | Name | Description | Criteria | XP |
|---|------|-------------|----------|-----|
| 30 | Photo Finish | "Win with exactly 1 HP remaining" | End Arcade game at 1 HP | 25 |
| 31 | Untouchable | "Complete a daily with 5/5 HP" | Daily challenge, no damage taken | 30 |
| 32 | Speed Demon | "Score 1,000 points in under 45 seconds" | Score >= 1000, time < 45s | 40 |
| 33 | Zen Master | "100% accuracy in Zen for 60+ seconds" | Zen mode, 100% accuracy, >= 60s, min 10 catches | 50 |

### In-Game Popup Behavior

- Achievement unlocks appear as a banner sliding in from the top during gameplay (non-blocking)
- Banner shows: achievement icon, name, and XP earned
- Banner auto-dismisses after 3 seconds
- During game over screen, all newly earned achievements are listed in sequence
- Sound effect: triumphant chime distinct from catch sounds

---

## Acceptance Criteria

- [ ] Achievements persist in localStorage as a set of unlocked achievement IDs (`deflect_achievements`)
- [ ] Each achievement can only be earned once
- [ ] Achievement checks run at end of each game AND fire immediately in-game for banner display
- [ ] In-game banner is non-blocking (gameplay continues underneath)
- [ ] Banner slides in from top, shows icon + name + XP, auto-dismisses after 3s
- [ ] Game over screen shows all newly earned achievements in sequence (1.5s apart)
- [ ] Stats screen shows achievement gallery with locked/unlocked state
- [ ] Locked achievements show name and description but are grayed out
- [ ] Secret achievements show "???" for name and description until earned
- [ ] Cumulative achievements track across all games (not per-game)
- [ ] Achievement XP is added to the game's total XP earned
- [ ] Triumphant chime audio distinct from catch sounds
- [ ] Achievements requiring specific orb types (20-23) only become checkable after those orb types are implemented

**Tech note (Morgan TL):** In-game achievement banners require rendering a UI overlay on top of the game canvas during active play. Add a notification queue to the renderer: `notifications: { text, icon, duration, elapsed }[]`. Render after all game elements. For mid-game checks, use event-driven hooks: `achievementTracker.onCatch(combo, score)`, `achievementTracker.onGameOver(stats)` — see ticket 044 (Game Decomposition) for the event listener interface.

**Sizing note (Alex PO):** This is a large ticket (33 achievements, banners, gallery, XP integration). Consider splitting into "Achievement Framework + 10 beginner/combo achievements" (T1) and "Full Achievement List + gallery" (T2).

---

## Dependencies

- 023 (XP System) — XP rewards from achievements
- 007 (Game Over Screen) — achievement display on game over
- 005 (Stats Screen) — achievement gallery
- 041 (localStorage Schema) — storage format
