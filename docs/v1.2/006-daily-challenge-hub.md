# 006 — Daily Challenge Hub

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §2.6 (US-MENU-06), product-vision.md §Part 3

---

## Description

Add a dedicated Daily Challenge screen that serves as the anchor of the retention loop. This screen shows today's challenge with its modifier, the player's streak, and past results. The daily challenge is the single most important mode for D7+ retention.

### Screen Layout

**Today's Challenge Card (prominent):**
- Large "DAY 47" or calendar date header
- **Countdown timer**: "12h 34m left" — creates urgency and FOMO
- Challenge modifier name and description (e.g., "SPEED DEMON — Orbs move 40% faster, ports 30% wider")
- Seed-based visual pattern (abstract geometric thumbnail from the day's seed)
- "PLAY" button if not yet attempted today
- Score + stats if already attempted
- "SHARE" button if completed

**Streak Section:**
- Current streak count (large number with flame icon)
- Best streak ever
- Calendar strip showing last 14 days (filled = played, empty = missed, today = highlighted)

**Past Results (scrollable):**
- Last 7 days of daily challenges
- Each row: Date | Score | Accuracy | Combo

---

## Acceptance Criteria

- [ ] Daily challenge seed is deterministic based on date (uses existing `dailySeed()`)
- [ ] Player can only play the daily challenge once per calendar day (local timezone)
- [ ] If already played today, PLAY button is replaced with "COMPLETED" badge and score
- [ ] Streak increments only when daily challenge is played (not regular games)
- [ ] Share button generates the existing emoji score card for the daily result
- [ ] Challenge modifier name and description are visible before playing (see ticket 046 for modifier pool)
- [ ] Countdown timer shows hours and minutes until daily challenge expires (midnight local time)
- [ ] Calendar strip shows last 14 days with clear filled/empty visual distinction
- [ ] Streak milestone reward goals are visible (e.g., "2 more days to unlock Ember trail!" — see ticket 047)
- [ ] Transition from Main Menu: slides up from bottom (300ms)
- [ ] Transition back: slides down (300ms)

---

**Tech note (Morgan TL):** The current daily mode (game.ts:318-323) uses a seeded RNG with standard arcade rules — there is no modifier system. The modifier engine (ticket 046) is a prerequisite. Without it, show the date and seed pattern but no modifier description.

## Dependencies

- 002 (Main Menu) — navigation source
- 033 (Share System) — share functionality
- 045 (Persistence Layer) — streak and daily data storage
- 046 (Daily Challenge Modifiers) — modifier pool and engine
- 047 (Streak Rewards) — streak milestone goals display
