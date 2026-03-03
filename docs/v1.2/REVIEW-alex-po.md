# Product Owner Review -- DEFLECT v1.2 Work Items

**Reviewer:** Alex (Product Owner)
**Date:** 2026-03-02
**Scope:** All 41 tickets (000-041) against source documents `feature-specs.md` and `product-vision.md`

---

## Executive Summary

Overall, this is a strong set of tickets. The consolidation from the two source documents is thorough, the tier structure is sound, and most tickets are well-scoped with concrete acceptance criteria. A developer could pick up the majority of these and start work with confidence.

That said, I have concerns in five areas:

1. **Missing power-ups from the source docs.** The product vision specifies 11 power-ups (4 deflector, 4 orb, 3 core). The tickets only cover 6. The "Steel Wall," "Wide Wall," "Fourth Wall," "Mirror Wall," "Gold Rush," and "Pulse" power-ups are absent. This is a significant gap in the T2 depth layer.

2. **Invented features not in source docs.** Tickets 022 (Giant Orb), 031 (Puzzle Mode), and 032 (Time Attack Mode) do not appear in the source documents. This is not necessarily wrong -- they may be good ideas -- but they should be explicitly flagged as new proposals so the team knows they lack a spec baseline.

3. **Product vision drift on Gold Orb.** The product vision says gold orbs match "any port" (no color matching needed). The ticket requires color matching with a subtle tint. This is a meaningful design change that affects difficulty and player experience. Needs a deliberate decision.

4. **Daily challenge modifiers are underspecified.** The product vision lists 8 specific daily challenge modifiers (Speed Demon, Minimalist, Color Blind, Boss Rush, Fragile, Generous, Backwards, Rainbow). Ticket 006 mentions modifiers but never enumerates them. The modifier pool appears only in ticket 029 (Challenge Mode), which is a different feature. Daily and weekly modifiers should not be conflated.

5. **Streak reward cosmetics are missing.** The product vision specifies escalating streak rewards (3-day: "Ember" deflector trail, 7-day: "Blaze" arena theme, 14-day: "Inferno" orb trail, 30-day: "Phoenix" core skin). No ticket covers these. They are a core retention lever.

Despite these gaps, the ticket set covers approximately 85-90% of the source material. The gaps are fixable and the existing tickets are high quality.

---

## Per-Ticket Notes

### 001 -- Splash / Loading Screen
**Status:** Looks good. Minor note.
- AC mentions "Bundle stays under 200KB" -- this is a performance constraint, not a splash screen concern. Consider moving this to a cross-cutting "Performance Budget" ticket or noting it as a global constraint. Having it here makes it look like only the splash screen owns the bundle size.

### 002 -- Main Menu Redesign
**Status:** Mostly good. Two gaps.
- **Missing:** The product vision specifies a **player banner at top** with "avatar icon (unlockable), player level, current streak flame icon, total stars earned." The ticket has no player banner -- it has a streak badge and a separate high score element, but no level display or avatar. The level display is particularly important because it ties into the XP system (ticket 023 is listed as a dependency, but the menu ticket does not specify where/how the level is displayed).
- **Missing:** Product vision calls for a **"Beat your best" reminder** on the returning player menu showing how close the last score was to the high score. Not in the ticket.
- **Minor:** The product vision describes the mode selector as "horizontally scrollable cards." Ticket 003 implements them as vertically scrollable. This is a deliberate change (and probably correct for mobile), but worth noting as a conscious deviation.

### 003 -- Mode Select Cards
**Status:** Good. One question.
- The product vision mentions a **Practice Mode** (unlocked from the start, choose specific difficulty settings, no scoring, no HP loss). This mode is absent from the card definitions and has no ticket. See "Missing Tickets" section below.

### 004 -- Settings Screen
**Status:** Good. One missing item.
- **Missing:** Product vision specifies **color accessibility modes** (deuteranopia, protanopia friendly palettes) as a Settings item. The ticket does not include a toggle for color accessibility mode. Ticket 039 covers the feature itself, but the settings toggle should be referenced here (or listed in 039's dependencies). Currently, 039 says "Toggle available in Settings screen" in its ACs, but 004 does not mention it.
- **Missing:** Product vision specifies **"Data: export/import save data"** as a Settings item. Not present in the ticket. Only "Reset Progress" exists.
- **Removed:** Feature-specs mentions "Settings screen is accessible during gameplay via pause (future: pause overlay)" as an AC. The ticket drops this. Fine if intentional, but worth confirming the pause overlay is deferred or out of scope.

### 005 -- Stats / Profile Screen
**Status:** Good. Minor gap.
- The feature-specs mention "Tapping a row could expand to show color breakdown (stretch goal)" for recent games. The ticket drops this. Fine as a cut, just noting it.
- **Missing:** The product vision mentions the Stats screen should house an **achievement showcase** as part of the player profile. Ticket 025 mentions "Stats screen shows achievement gallery" in its ACs, but ticket 005 does not reference the achievement gallery in its own screen sections or ACs. A developer building 005 might not know to leave room for it.

### 006 -- Daily Challenge Hub
**Status:** Needs work. Key gaps.
- **Missing modifier enumeration.** The product vision lists 8 specific daily challenge modifiers (Speed Demon, Minimalist, Color Blind, Boss Rush, Fragile, Generous, Backwards, Rainbow). The ticket says "Challenge modifier description" but never defines the modifier pool. This is critical -- the daily challenge is called "the single most important mode for D7+ retention" in the source docs. The modifier pool should be explicitly defined.
- **Missing:** Product vision says the daily challenge card on the main menu should show a **countdown timer** ("12h 34m left"). Not mentioned in either 002 or 006.
- **Missing:** Product vision specifies that after completing the daily, the player should see their **"global percentile rank"** and **"friend comparison (if friends exist)"**. The ticket only shows score + stats. The percentile could tie into ticket 034 (leaderboard), but the connection is not made.
- **Missing:** The product vision specifies **daily streak tracking with escalating rewards** at specific milestones (3-day, 7-day, 14-day, 30-day). The ticket mentions streak tracking but not the reward milestones or the specific cosmetic rewards. See "Missing Tickets" section.

### 007 -- Game Over Screen Redesign
**Status:** Good. Thorough.
- **Minor:** The feature-specs mention that for daily challenges, the RETRY button should be **grayed out** with "1 attempt per day" text (from UX flow 8.2). This is not in the ticket's ACs. This is an important edge case -- without it, a player might be confused about why they cannot retry a daily.
- **Missing:** Product vision specifies an **"instant retry"** from death to playing in under 0.5 seconds (Super Hexagon reference). Ticket 008 has a 200ms retry transition, which is good, but 007 does not specify how fast the retry path should be end-to-end.

### 008 -- Screen Transitions System
**Status:** Looks good. Well-specified.
- No issues.

### 009 -- Power-Up Core System
**Status:** Good framework. One question.
- The description says "Only one power-up can be active at a time." The feature-specs section 3.3 clarifies this: "the second replaces the first." The ticket's ACs cover this ("Collecting a new power-up replaces current with 'REPLACED' brief indicator"). Good.
- **Missing:** The feature-specs specify 4 **power-up design rules** (enhance core mechanic, no > 8s duration, visually distinct, feel amazing). These are good constraints that should be referenced somewhere -- either here or as a shared design principle. Currently they exist only in the product vision.

### 010 -- Time Slow Power-Up
**Status:** Minor discrepancy.
- **Discrepancy:** The product vision says Time Slow reduces speed to **50%** for 5 seconds. The ticket says **40%**. The feature-specs also say 40%. The product vision's 50% and feature-specs' 40% disagree, and the ticket followed feature-specs. This should be a deliberate decision -- pick one value and update both source docs.

### 011 -- Shield Power-Up
**Status:** Looks good.
- The ACs proactively address interactions with bomb orb (2 HP) and giant orb (3 HP) damage. Good forward-thinking.

### 012 -- Multi-Bounce Power-Up
**Status:** Good. This power-up is a **ticket invention** -- neither the product vision nor the feature-specs list a "Multi-Bounce" power-up. The closest source concept is "Steel Wall" (next deflector lasts 8s and bounces unlimited orbs). The multi-bounce concept is arguably more interesting, but this should be flagged as a deviation.

### 013 -- Magnet Power-Up
**Status:** Looks good. Faithful to source docs.

### 014 -- Splitter (Score Doubler) Power-Up
**Status:** Naming concern.
- The ticket is titled "Splitter" but the behavior is a score doubler (2x points on catches). The product vision's "Splitter" power-up is entirely different: "next orb that hits a deflector splits into 2 orbs of the same color." There is also a Splitter Orb (ticket 019). Having a "Splitter Power-Up" and a "Splitter Orb" that do completely different things will cause confusion. Recommend renaming this power-up to **"Score Doubler"** or **"Double Down"** to avoid ambiguity.
- The source doc's actual Splitter power-up behavior is not covered by any ticket. See "Missing Tickets."
- The source doc's **"Gold Rush"** power-up (5s of 3x points, orbs turn gold-tinted) is the closest match to this ticket's behavior, but the values differ (3x for 5s vs 2x for 6s). The ticket seems to be a hybrid. Needs a clear decision on what this power-up actually is.

### 015 -- Extra Life Power-Up
**Status:** Looks good. Matches the "Heal" power-up from the product vision (restores 1 HP, max cap applies).

### 016 -- Orb Type System & Spawn Schedule
**Status:** Good. Faithful to source.
- **Missing:** The schedule does not include Giant Orb (ticket 022). If Giant Orb is kept, it needs a row in the spawn schedule. Currently 022 says "appears after 75s, max 1 per run" but that is not reflected in 016's schedule table.

### 017 -- Gold Orb
**Status:** Needs a design decision.
- **Critical discrepancy:** The product vision says: "No color matching needed -- any port works." The ticket says: "Must enter correct-colored port; underlying color shown as subtle tint/ring inside gold." This is a fundamental gameplay difference. The product vision's version is a simple high-reward target (fast but any port). The ticket's version adds a color-matching challenge on top of the speed challenge. Either is valid, but someone needs to decide. I recommend the product vision's version (any port) because the Gold Orb's role is "rewards sharp reflexes," and adding color matching dilutes that identity. The Ghost Orb already fills the "harder matching challenge" niche.
- **Discrepancy:** Product vision says gold orb moves **1.5x** faster. Feature-specs and ticket say **1.3x**. Minor, but should be aligned.

### 018 -- Rainbow Orb
**Status:** Looks good.
- **Minor note:** Product vision says rainbow orbs are "worth 1x points, but always extends your combo (never breaks it)." The "never breaks combo" property is not in the ticket. The product vision specifically says rainbow orbs are a "safety valve" for combos. This is a meaningful omission -- adding "Rainbow orb core hit does NOT reset combo" as an AC would match the vision's intent.

### 019 -- Splitter Orb
**Status:** Looks good. Faithful to source.

### 020 -- Ghost Orb
**Status:** Looks good. Faithful to source.

### 021 -- Bomb Orb
**Status:** Needs a design decision.
- **Discrepancy:** Product vision says bomb orb deals "instant death (lose ALL remaining HP)." Feature-specs and ticket say 2 HP damage. This is a significant gameplay difference. The product vision's version is much more dramatic and high-stakes. My recommendation: keep the 2 HP version (feature-specs) for game balance, but add an AC that says "If bomb orb hits core at 1 HP, the death sequence is especially dramatic (extra screen shake, extended slow-mo)." This preserves the drama without the binary kill mechanic.
- **Missing:** Product vision says bomb orb "appears after 75 seconds in Arcade." The ticket does not specify the spawn timing -- it defers to ticket 016's schedule, which shows bomb at 90s+. The 75s vs 90s discrepancy should be resolved.

### 022 -- Giant Orb
**Status:** Not in source docs.
- This orb type does not appear in either `feature-specs.md` or `product-vision.md`. It is an invention of the ticket author. The design is interesting (requires long deflector, 5x points, 3 HP damage), but it should be explicitly flagged as a new proposal. The T3 priority seems appropriate if it is approved.
- **Concern:** The "requires deflector at least 60% of arena radius length" mechanic is novel and untested. It introduces a new skill dimension (drawing long enough deflectors) that does not exist elsewhere. Consider whether this adds welcome variety or unintuitive frustration.

### 023 -- XP System & Leveling
**Status:** Mostly good. Minor discrepancy.
- **Discrepancy:** Product vision XP sources differ from the ticket:
  - Vision: "1 XP per 100 points" (score-based). Ticket: "2 XP per catch" (catch-based). These are very different formulas. A 1000-point game could yield very different XP depending on which formula is used.
  - Vision: "1 XP per 10 seconds survived." Ticket: "Survive 60s+ = 10 XP, survive 120s+ = 25 XP" (threshold-based). Again, different approaches.
  - Vision: "Daily challenge completion = flat 50 XP bonus." Ticket: "30 XP bonus."
  - Vision: "First game of the day = 25 XP bonus." Not in the ticket at all.
- The ticket's approach (catch-based, threshold-based) is arguably better for game feel, but these are conscious design changes from the vision that should be documented as such.

### 024 -- Level Unlock Rewards
**Status:** Looks good. Matches source docs exactly.

### 025 -- Achievement System
**Status:** Good. Comprehensive.
- **Minor:** The product vision includes several achievements not in the ticket:
  - "Century" / "Millennium": catch 100 / 1000 **total** orbs (cumulative across all games). The ticket's achievements are all per-game. No cumulative catch achievement exists.
  - "Centurion": play 100 total games. Ticket has "Dedicated" at 50 games but nothing at 100.
  - "Veteran": reach Player Level 25. No level-based achievement in the ticket.
  - Secret achievements (Photo Finish, Untouchable, Speed Demon, Zen Master) are absent. The product vision specifically calls these "hidden until earned."
- These gaps reduce the long-term achievement chase. Recommend adding at least the cumulative and secret categories.

### 026 -- Unlockable Cosmetics
**Status:** Good but incomplete.
- **Missing:** Product vision lists **Core Skins** as a cosmetic category (Heart, Eye, Crystal, Skull, Phoenix). The ticket only covers arena themes, deflector skins, and orb trails. Core skins are absent. The Phoenix core skin (30-day streak reward) is called "the most prestigious cosmetic" in the product vision.
- **Missing:** Product vision lists additional cosmetics not in the ticket:
  - Arena themes: Sakura, Deep Sea, Cyberpunk (ticket has Nebula, Ocean, Sunset, Void, Retro -- different set)
  - Deflector: Brush, Glass, Fire (ticket has Neon Green, Fire Trail, Ice Crystal, Lightning, Gold Plated)
  - Orb trails: Comet, Smoke, Geometric, None (ticket only has Sparkle, Rainbow)
- The ticket covers a reasonable V1 subset, but the product vision has a much larger cosmetic catalog. The ticket should note what is deferred.

### 027 -- Daily Rewards System
**Status:** Looks good. Matches feature-specs.
- T4 priority seems too low. Daily rewards directly support the D7 retention goal. Consider T2 or T3.

### 028 -- Milestone Celebrations
**Status:** Good.
- **Missing:** Product vision specifies **"Deflector draw feel: the deflector should materialize with a quick 'zip' animation from start to end, not appear instantly."** This is gameplay juice, not a milestone, but it has no home in any ticket. Consider adding it here or creating a separate "Gameplay Juice Polish" ticket.
- **Missing:** Product vision specifies **"Near-miss enhancement: in addition to slow-mo, add a chromatic aberration effect (RGB split) for 200ms."** Also homeless. Same recommendation.

### 029 -- Challenge Mode (Weekly)
**Status:** Needs clarification.
- The modifier pool here is for the **weekly** challenge mode. The **daily** challenge also has modifiers (product vision lists 8 specific ones). These are different pools for different features but the ticket does not distinguish them. The daily modifier pool from the product vision (Speed Demon, Minimalist, Color Blind, Boss Rush, Fragile, Generous, Backwards, Rainbow) overlaps with but is not identical to the weekly pool in this ticket.
- **Missing dependency:** Ticket lists 021 (Bomb Orb) as NOT a dependency, but the "Bomb Squad" modifier spawns bomb orbs only. This should be a dependency or a note that "Bomb Squad" modifier is only available after bomb orbs are implemented.

### 030 -- Boss Rush Mode
**Status:** Good. Well-structured.
- **Minor:** Product vision says Boss Rush unlocks "after surviving 90 seconds in Arcade." Ticket says unlock at Level 5. The level-based unlock is consistent with the rest of the unlock system and is probably the better approach, but this is a deviation from the product vision.

### 031 -- Puzzle Mode
**Status:** Not in source docs. New proposal.
- Neither `feature-specs.md` nor `product-vision.md` describe a Puzzle Mode. The source docs describe a **Practice Mode** and a **Gauntlet Mode** instead. The Puzzle Mode concept (fixed scenarios, limited deflectors, star ratings) is creative and different from anything in the source docs.
- If this is approved as a new mode, T4 priority is appropriate. But the team should be aware this displaces Practice Mode (which is explicitly called out in the product vision as a retention tool: "Geometry Dash proved that giving players a way to practice specific sections dramatically increases retention").

### 032 -- Time Attack Mode
**Status:** Not in source docs. New proposal.
- The source docs do not include a Time Attack mode. The closest concept is the product vision's score milestones during Arcade ("SURVIVED 60s!", "100 CATCHES!"). Time Attack as a standalone mode is a reasonable addition. T4 priority is appropriate.

### 033 -- Enhanced Share System
**Status:** Good.
- **Missing:** Product vision specifies the text card should include **"daily challenge number"** for community comparison (e.g., "DEFLECT DAILY #47"). The ticket's enhanced text format includes this, but the AC says "includes daily challenge number, modifier name, and streak count (when applicable)" -- the "(when applicable)" is slightly vague. Recommend specifying: daily challenge number and modifier name appear ONLY for daily challenge games; streak count appears ONLY when streak >= 1.
- **Missing:** Product vision mentions a **QR code or short URL** at the bottom of the image card. The ticket does not include this. This connects to the Challenge-a-Friend feature (ticket 035).

### 034 -- Daily Leaderboard
**Status:** Good. Well-handled backend dependency.
- T4 seems too low given the product vision's emphasis on social comparison as a retention driver. The fallback (personal daily history) is a good compromise and could ship at T2.

### 035 -- Challenge-a-Friend
**Status:** Good. Matches source docs well.

### 036 -- Replay System
**Status:** Good. Appropriately scoped as T4.

### 037 -- Mode-Specific Music & Audio
**Status:** Good.
- **Missing:** Product vision specifies a **"power down" audio cue** when a power-up expires. This is mentioned in feature-specs UX flow 8.4 but not in this ticket's sound effects table.

### 038 -- Haptic Feedback System
**Status:** Good. Matches source docs.

### 039 -- Color Accessibility Mode
**Status:** Good.
- Should list ticket 004 (Settings) as a dependency since the toggle lives there. Currently only 004 is mentioned in the description but not in the Dependencies section. (Edit: I see 004 is listed as a dependency. Good.)

### 040 -- First-Time User Experience
**Status:** Needs work.
- **Discrepancy with product vision:** The product vision says first-time players see a **simplified menu with just "TAP TO PLAY"** and no mode selection. After completing the tutorial and first game, the menu expands to show mode selection. After 3 games, the full menu with daily challenge card appears. The ticket matches this.
- **Missing:** The product vision's FTUE flow (section 8.1) shows that the first game should introduce **power-ups at ~20s** and **new orb types per schedule**. But ticket 040 does not address whether power-ups and special orbs should appear in the first game. For a brand-new player, encountering a Splitter Orb or Ghost Orb in their first game could be overwhelming. Consider an AC that says "First game only spawns standard orbs (no special types, no power-ups)" or at minimum addresses this explicitly.

### 041 -- localStorage Data Schema
**Status:** Good. Comprehensive.
- **Missing key:** No storage key for **daily challenge modifier history** or daily challenge number. If the daily challenge hub (006) shows "past 7 days of daily challenges" with their modifiers, the schema needs to store which modifier was active each day.
- **Missing key:** No storage key for **Gauntlet mode** progress (if Gauntlet is added later). Not urgent, but the schema should note it is extensible.

---

## Cross-Cutting Concerns

### 1. Power-Up Coverage Gap
The product vision describes 11 power-ups across 3 categories:
- **Deflector:** Steel Wall, Wide Wall, Mirror Wall, Fourth Wall
- **Orb:** Time Slow, Magnet, Splitter (actual split behavior), Gold Rush
- **Core:** Shield, Heal, Pulse

The tickets cover 6 power-ups: Time Slow, Shield, Multi-Bounce (new), Magnet, Splitter/Score Doubler (behavior mismatch), Extra Life (= Heal).

**Missing entirely:** Steel Wall, Wide Wall, Mirror Wall, Fourth Wall, Gold Rush, Pulse, actual Splitter behavior.
**New (not in source):** Multi-Bounce.
**Misnamed:** Ticket 014 "Splitter" is actually a Score Doubler.

The T2 power-up set should include at least the "must have" 4 from the product vision (V1.0 section): Time Slow, Shield, Wide Wall, Gold Rush. Currently only 2 of those 4 are covered.

### 2. Daily Challenge Modifier Pool
The product vision describes 8 specific daily challenge modifiers. These are distinct from the weekly challenge mode modifiers in ticket 029. No ticket defines the daily modifier pool. This is the single most important mode for retention and its modifier system is unspecified.

### 3. Streak Reward Cosmetics
The product vision specifies milestone cosmetic rewards at 3, 7, 14, and 30 days:
- 3-day: "Ember" deflector trail
- 7-day: "Blaze" arena theme
- 14-day: "Inferno" orb trail
- 30-day: "Phoenix" core skin

These are absent from all tickets. They span the cosmetics system (026), the streak tracker (006/005), and the milestone celebrations (028). A dedicated ticket or additions to existing tickets are needed.

### 4. Inconsistent Terminology: "Signal" vs "Orb"
The codebase and some tickets use "signal" (the original term from the prototype). The source docs and most tickets use "orb." Tickets 009-015 and 016-022 consistently use "orb," but ticket 010 mentions "signal movement speed" and "signal trails." Ticket 013 uses "signals" throughout. Recommend standardizing on "orb" across all tickets for consistency with the player-facing terminology.

### 5. Boss Waves in Arcade Mode
The product vision specifies **boss waves at 60s/120s/180s in Arcade mode**: "dense clusters of same-color orbs from one direction." No ticket covers this. Ticket 030 covers Boss Rush as a separate mode, but the Arcade mode boss waves are a different feature. This was listed as a "Should Have" in the product vision's V1.0 section.

### 6. Zen Mode Improvements
The product vision specifies two improvements for Zen mode:
- Its own ambient music track (covered by ticket 037)
- An **accuracy percentage HUD** and **personal best accuracy to beat** (not covered by any ticket)

### 7. "Visible milestones during the run" in Arcade
Product vision V1.0 says Arcade should add "visible milestones during the run ('SURVIVED 60s!', '100 CATCHES!')." Ticket 028 partially covers this with score and survival milestones, but the "100 CATCHES!" milestone is not in the milestone table.

---

## Missing Tickets

The following features from the source documents have no corresponding ticket:

| # | Feature | Source | Recommended Tier | Notes |
|---|---------|--------|-----------------|-------|
| M1 | **Practice Mode** | product-vision Part 3 | T2 | Choose difficulty settings, no scoring, no HP loss. Explicitly called a retention tool. |
| M2 | **Gauntlet Mode** | product-vision Part 3 | T3 | 5 back-to-back rounds, HP carries over, power-up selection between rounds. |
| M3 | **Daily Challenge Modifier Pool** | product-vision Part 3 | T1 | 8 modifiers (Speed Demon, Minimalist, etc.) for daily challenges specifically. Should be part of ticket 006 or a new ticket. |
| M4 | **Streak Reward Cosmetics** | product-vision Part 4 | T1 | 3-day, 7-day, 14-day, 30-day streak rewards with specific cosmetics. Core retention lever. |
| M5 | **Core Skins (cosmetic category)** | product-vision Part 4 | T2 | Heart, Eye, Crystal, Skull, Phoenix core appearance options. |
| M6 | **Boss Waves in Arcade** | product-vision Part 3 | T2 | Dense same-color clusters at 60s/120s/180s thresholds in Arcade mode. |
| M7 | **Wide Wall Power-Up** | product-vision Part 3 | T2 | Next deflector is 50% longer. Listed in product vision's V1.0 "Should Have." |
| M8 | **Gold Rush Power-Up** | product-vision Part 3 | T2 | 5s of 3x points, orbs turn gold-tinted. Listed in product vision's V1.0 "Should Have." |
| M9 | **Pulse Power-Up** | product-vision Part 3 | T3 | Shockwave from core slows all orbs for 2s. |
| M10 | **Steel Wall Power-Up** | product-vision Part 3 | T3 | Next deflector lasts 8s and bounces unlimited orbs. |
| M11 | **Fourth Wall Power-Up** | product-vision Part 3 | T3 | Temporarily allows 4 active deflectors instead of 3. |
| M12 | **Mirror Wall Power-Up** | product-vision Part 3 | T3 | Next deflector auto-aims orbs at nearest matching port. |
| M13 | **Zen Mode Accuracy HUD** | product-vision Part 3 | T2 | Accuracy percentage HUD and personal best accuracy in Zen. |
| M14 | **Data Export/Import** | product-vision Part 2 | T3 | Export/import save data from Settings. |
| M15 | **Gameplay Juice Polish** | product-vision Part 5 | T2 | Deflector "zip" animation, near-miss chromatic aberration, port catch particle burst. Several juice items from the vision have no home. |
| M16 | **Daily Challenge Countdown Timer** | product-vision Part 2 | T1 | "12h 34m left" on the daily challenge card. Creates urgency. |
| M17 | **Catch Milestone Achievement** | product-vision Part 4 | T1 | "Century"/"Millennium" cumulative catch achievements (100/1000 total orbs). |
| M18 | **Secret Achievements** | product-vision Part 4 | T2 | Photo Finish, Untouchable, Speed Demon, Zen Master. Hidden until earned. |

---

## Prioritization Recommendations

### Promotions (move to higher priority)
| Ticket | Current | Recommended | Rationale |
|--------|---------|-------------|-----------|
| 027 (Daily Rewards) | T4 | **T2** | Directly supports D7 retention. The daily reward cycle gives players another reason to come back tomorrow. The product vision places this alongside daily challenges and streaks as a retention anchor. |
| 034 (Daily Leaderboard) | T4 | **T3** | Social comparison drives retention. The fallback (personal history) can ship at T2. Even the fallback version creates a "beat yesterday" loop. |
| M3 (Daily Modifiers) | N/A | **T1** | The daily challenge without modifiers is just "play Arcade with a seed." The modifiers ARE the feature. Without them, the daily challenge is not meaningfully different from a regular game. |
| M4 (Streak Rewards) | N/A | **T1** | The streak flame without rewards is just a number. The escalating cosmetic rewards create the "I can't break my streak" feeling cited as a primary D7 lever. |
| M16 (Daily Countdown) | N/A | **T1** | Creates urgency and FOMO. Low effort, high retention impact. |

### Demotions (move to lower priority)
| Ticket | Current | Recommended | Rationale |
|--------|---------|-------------|-----------|
| 022 (Giant Orb) | T3 | **T4** | Novel concept not in source docs. The deflector-length mechanic is untested and could frustrate players. Defer until other orb types are validated. |

### Ticket Sizing Concerns
| Ticket | Concern |
|--------|---------|
| 025 (Achievements) | This is a large ticket: 25 achievements, in-game banners, game-over display, stats gallery, per-achievement XP integration. Consider splitting into "Achievement Framework" (T1: infrastructure + 10 beginner/combo achievements) and "Full Achievement List" (T2: remaining 15 + gallery). |
| 026 (Cosmetics) | Covers 3 cosmetic categories, a selection UI, preview system, and persistence. Consider splitting the selection/preview UI from the cosmetic rendering. |
| 030 (Boss Rush) | 5 unique waves + endless mode + between-wave UI + power-up selection = large scope. Consider splitting wave definitions from the mode infrastructure. |
| 031 (Puzzle Mode) | 20+ hand-crafted puzzles is a content creation task, not just an engineering task. The puzzle data authoring is a separate workstream. Flag this. |

---

## Summary of Required Actions

**Must fix before development starts:**
1. Decide on Gold Orb port matching behavior (any port vs color-matching) -- ticket 017
2. Create or augment ticket for daily challenge modifier pool -- M3
3. Rename ticket 014 from "Splitter" to "Score Doubler" or "Gold Rush" to avoid confusion with Splitter Orb
4. Add streak reward cosmetics (M4) -- either new ticket or augment 006/026/028
5. Add daily countdown timer to ticket 006 or create M16
6. Add missing Settings toggle reference for color accessibility in ticket 004

**Should fix:**
7. Resolve Bomb Orb damage discrepancy (all HP vs 2 HP) -- ticket 021
8. Add "First game of the day = 25 XP bonus" to ticket 023 (missing from product vision)
9. Add Rainbow Orb "never breaks combo" behavior to ticket 018
10. Add Practice Mode ticket (M1)
11. Add daily RETRY disabled state to ticket 007
12. Standardize "signal" vs "orb" terminology across all tickets
13. Add player level display to main menu ticket 002
14. Add Giant Orb to spawn schedule in ticket 016

**Nice to have:**
15. Add secret achievements (M18) to ticket 025
16. Add cumulative catch achievements (M17) to ticket 025
17. Create Gameplay Juice Polish ticket (M15)
18. Add data export/import to ticket 004
19. Split large tickets (025, 030, 031) for better estimation
