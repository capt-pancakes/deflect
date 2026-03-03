# DEFLECT v1.2 — Work Items Index

> Consolidated from `docs/feature-specs.md` and `docs/product-vision.md`
> Reviewed and refined by Alex (PO) and Morgan (TL) — 2026-03-02

---

## Priority Tiers

| Tier | Focus | Description |
|------|-------|-------------|
| **T0** | Architecture Prerequisites | Foundational refactoring required before feature work (1-2 weeks) |
| **T1** | Core Retention Loop | Ship first — give players a reason to return (3-4 weeks) |
| **T2** | Depth | Gameplay variety and engagement (3-4 weeks) |
| **T3** | Variety | New modes and social hooks (2-3 weeks) |
| **T4** | Polish | Engagement, endurance modes, and community features (2-3 weeks) |

---

## Recommended Build Order (Morgan TL)

**Phase 0 — Foundation (T0):** 045 → 042 → 044 → 043
**Phase 1 — Core Retention (T1):** 041 → 008 → 004 → 002 → 001 → 003 → 023 → 024 → 025 → 039 → 046 → 047 → 007 → 005 → 006 → 040 → 028
**Phase 2 — Depth (T2):** 016 → 009 → 017 → 018 → 010 → 011 → 015 → 013 → 012 → 014 → 050 → 051 → 019 → 026 → 027 → 033 → 037 → 038 → 048 → 049 → 052 → 053
**Phase 3 — Variety (T3):** 020 → 021 → 029 → 030 → 034 → 035 → 054 → 055
**Phase 4 — Polish (T4):** 032 → 022 → 031 → 036

---

## Tickets by Area

### Architecture Prerequisites (T0) — NEW
| ID | Title | Tier |
|----|-------|------|
| 042 | [Screen Manager & State Machine](042-arch-screen-manager.md) | T0 |
| 043 | [Entity / Orb Type System Refactor](043-arch-orb-type-system.md) | T0 |
| 044 | [Game Class Decomposition](044-arch-game-decomposition.md) | T0 |
| 045 | [Unified Persistence Layer](045-arch-persistence-layer.md) | T0 |

### Menu & Navigation
| ID | Title | Tier | Notes |
|----|-------|------|-------|
| 001 | [Splash / Loading Screen](001-splash-loading-screen.md) | T1 | |
| 002 | [Main Menu Redesign](002-main-menu-redesign.md) | T1 | Updated: added player banner, "beat your best" reminder |
| 003 | [Mode Select Cards](003-mode-select-cards.md) | T1 | |
| 004 | [Settings Screen](004-settings-screen.md) | T1 | Updated: added color accessibility toggle, data export/import, HTML overlay recommendation |
| 005 | [Stats / Profile Screen](005-stats-profile-screen.md) | T1 | Updated: added achievement gallery section, per-color tracking prereq |
| 006 | [Daily Challenge Hub](006-daily-challenge-hub.md) | T1 | Updated: added countdown timer, modifier reference, streak reward goals |
| 007 | [Game Over Screen Redesign](007-game-over-screen-redesign.md) | T1 | Updated: added daily RETRY disabled state |
| 008 | [Screen Transition Definitions](008-screen-transitions.md) | T1 | Renamed: now defines animations only; architecture in 042 |

### Power-Up System
| ID | Title | Tier | Notes |
|----|-------|------|-------|
| 009 | [Power-Up Core System](009-powerup-core-system.md) | T2 | Updated: added design rules, particle budget note, core contact behavior |
| 010 | [Time Slow Power-Up](010-powerup-time-slow.md) | T2 | Updated: added signalSpeedMultiplier tech note, slow-mo precedence |
| 011 | [Shield Power-Up](011-powerup-shield.md) | T2 | |
| 012 | [Multi-Bounce Power-Up](012-powerup-multi-bounce.md) | T2 | Flagged: new proposal (not in product vision) |
| 013 | [Magnet Power-Up](013-powerup-magnet.md) | T2 | |
| 014 | [Score Doubler Power-Up](014-powerup-splitter.md) | T2 | **Renamed** from "Splitter" to avoid confusion with Splitter Orb |
| 015 | [Extra Life Power-Up](015-powerup-extra-life.md) | T2 | |
| 050 | [Wide Wall Power-Up](050-powerup-wide-wall.md) | T2 | **NEW** — from product vision |
| 051 | [Gold Rush Power-Up](051-powerup-gold-rush.md) | T2 | **NEW** — from product vision |
| 054 | [Additional Power-Ups (Steel Wall, Fourth Wall, Mirror Wall, Pulse)](054-powerups-additional.md) | T3 | **NEW** — remaining power-ups from product vision |

### New Orb Types
| ID | Title | Tier | Notes |
|----|-------|------|-------|
| 016 | [Orb Type System & Spawn Schedule](016-orb-spawn-schedule.md) | T2 | Updated: added Giant Orb to schedule |
| 017 | [Gold Orb](017-orb-gold.md) | T2 | **Updated: any-port matching** (product vision wins over feature-specs) |
| 018 | [Rainbow Orb](018-orb-rainbow.md) | T2 | Updated: added "never breaks combo" behavior |
| 019 | [Splitter Orb](019-orb-splitter.md) | T2 | |
| 020 | [Ghost Orb](020-orb-ghost.md) | T3 | |
| 021 | [Bomb Orb](021-orb-bomb.md) | T3 | Design decision: 2 HP damage (feature-specs), not instant kill (product vision) |
| 022 | [Giant Orb](022-orb-giant.md) | T4 | **Demoted** from T3; flagged as new proposal |

### Progression & Unlocks
| ID | Title | Tier | Notes |
|----|-------|------|-------|
| 023 | [XP System & Leveling](023-xp-system.md) | T1 | Updated: added first-game-of-day XP, formula rationale |
| 024 | [Level Unlock Rewards](024-level-unlocks.md) | T1 | |
| 025 | [Achievement System](025-achievements.md) | T1 | Updated: added 8 achievements (cumulative + secret), now 33 total |
| 026 | [Unlockable Cosmetics](026-cosmetics.md) | T2 | Updated: added Core Skins category, Theme interface note |
| 027 | [Daily Rewards System](027-daily-rewards.md) | T2 | **Promoted** from T4 — directly supports D7 retention |
| 028 | [Milestone Celebrations](028-milestone-celebrations.md) | T2 | |
| 046 | [Daily Challenge Modifier Pool](046-daily-challenge-modifiers.md) | T1 | **NEW** — critical: modifiers ARE the daily challenge feature |
| 047 | [Streak Reward Cosmetics](047-streak-reward-cosmetics.md) | T1 | **NEW** — escalating cosmetic rewards at streak milestones + Core Skins |

### New Game Modes
| ID | Title | Tier | Notes |
|----|-------|------|-------|
| 029 | [Challenge Mode (Weekly)](029-mode-challenge.md) | T3 | Updated: clarified daily vs weekly distinction, Mirror Mode tech note |
| 030 | [Boss Rush Mode](030-mode-boss-rush.md) | T3 | Updated: simplified initial version option |
| 031 | [Puzzle Mode](031-mode-puzzle.md) | T4 | Flagged: new proposal, most complex ticket, separate game loop needed |
| 032 | [Time Attack Mode](032-mode-time-attack.md) | T4 | Flagged: new proposal |
| 048 | [Practice Mode](048-practice-mode.md) | T2 | **NEW** — from product vision; retention tool |
| 049 | [Arcade Boss Waves](049-arcade-boss-waves.md) | T2 | **NEW** — from product vision; boss events at 60/120/180s |
| 055 | [Gauntlet Mode](055-mode-gauntlet.md) | T3 | **NEW** — from product vision; 5-round endurance |

### Social Features
| ID | Title | Tier | Notes |
|----|-------|------|-------|
| 033 | [Enhanced Share System](033-share-system.md) | T2 | |
| 034 | [Daily Leaderboard](034-daily-leaderboard.md) | T3 | **Promoted** from T4 — local fallback can ship at T2 |
| 035 | [Challenge-a-Friend](035-challenge-a-friend.md) | T3 | |
| 036 | [Replay System](036-replay-system.md) | T4 | Updated: input-recording approach, determinism notes |

### Polish & Accessibility
| ID | Title | Tier | Notes |
|----|-------|------|-------|
| 037 | [Mode-Specific Music & Audio](037-audio-modes.md) | T2 | Updated: lazy loading, power-down cue, bundle size notes |
| 038 | [Haptic Feedback System](038-haptic-feedback.md) | T2 | |
| 039 | [Color Accessibility Mode](039-color-accessibility.md) | T1 | |
| 040 | [First-Time User Experience](040-ftue.md) | T1 | Updated: keep existing tutorial, first-game orb restrictions |
| 041 | [localStorage Data Schema](041-localstorage-schema.md) | T1 | Updated: migration framework, daily history, schema version |
| 052 | [Zen Mode Accuracy HUD](052-zen-accuracy-hud.md) | T2 | **NEW** — from product vision |
| 053 | [Gameplay Juice Polish](053-gameplay-juice-polish.md) | T2 | **NEW** — deflector zip, chromatic aberration, combo bursts, etc. |

---

## Design Decisions Made During Review

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Gold Orb port matching | **Any port** (product vision) | Gold Orb role is "rewards reflexes"; color matching dilutes that. Ghost Orb fills "harder matching" niche. |
| Bomb Orb core damage | **2 HP** (feature-specs) | Better for game balance than instant kill. Extra drama added via enhanced death sequence at low HP. |
| Time Slow speed reduction | **40%** (feature-specs) | Matches feature-specs. Product vision said 50%. |
| XP formula | **Catch-based** (feature-specs) | Rewards engagement (catches) more directly than raw score. |
| Rainbow Orb combo behavior | **Never breaks combo** (product vision) | "Safety valve" that keeps combos alive during chaos. |
| Ticket 014 naming | **Score Doubler** (renamed) | Avoids confusion with Splitter Orb (019). |
| Ticket 022 priority | **Demoted to T4** | New proposal with untested deflector-length mechanic. |
| Ticket 027 priority | **Promoted to T2** | Daily rewards directly support D7 retention. |
| Ticket 034 priority | **Promoted to T3** | Social comparison drives retention; local fallback is low-effort. |

---

## Review Notes

Full reviewer notes preserved for reference:
- [REVIEW-alex-po.md](REVIEW-alex-po.md) — Product Owner review
- [REVIEW-morgan-tl.md](REVIEW-morgan-tl.md) — Technical Lead review

---

## Summary

| Category | Count |
|----------|-------|
| Total tickets | 55 |
| Architecture prerequisites (T0) | 4 |
| Core retention (T1) | 15 |
| Depth (T2) | 22 |
| Variety (T3) | 9 |
| Polish (T4) | 5 |
| New tickets added during review | 14 |
| Existing tickets updated | 25 |
