# DEFLECT Product Vision

**Author:** Product Manager
**Date:** February 2026
**Status:** Draft v1.0

---

## Executive Summary

DEFLECT has the bones of a great arcade game: a one-thumb control scheme, satisfying physics, beat-reactive visuals, and a 3-second learn time. But right now it's a polished game jam prototype. Fun for 10 minutes, then forgotten.

The mission is to turn DEFLECT into a game players open every single day -- the kind of game that lives on your home screen between Wordle and Spotify. We do this by stealing the best ideas from the games that solved retention, then layering them on top of DEFLECT's already-tight core loop.

**Reference games and what we steal from each:**

| Game | What We Steal |
|------|---------------|
| **Wordle** | One-per-day scarcity, emoji share cards, daily ritual, social comparison |
| **Geometry Dash** | Rhythm-gameplay fusion, "one more try" death loop, community levels, practice mode |
| **Vampire Survivors** | Meta-progression, unlockable variety, power-up discovery, "just one more run" |
| **Super Hexagon** | Instant retry, flow state through escalation, survival time as the trophy |
| **Breakout/Brick Breaker** | Power-up variety, ball physics satisfaction, visual spectacle on combos |

---

## Part 1: The Player Journey Today vs. Tomorrow

### Today (Prototype)
```
Open game -> See text menu -> Tap "Arcade" -> Play 60-90s -> Die -> See score -> Close app -> Never return
```

### Tomorrow (Product)
```
Open game -> See animated menu with streak counter -> Check daily challenge ->
Play daily (seeded, one attempt) -> Share emoji score card -> Check leaderboard ->
See "NEW: Boss Rush unlocked!" -> Play Boss Rush -> Earn enough XP to unlock Neon Sakura theme ->
Close app -> Get notification: "Your daily challenge streak is at 14 days!" -> Return tomorrow
```

The difference is **reasons to come back**. Today there are zero. Tomorrow there are at least five on any given day.

---

## Part 2: Menu System & Navigation Vision

### The Problem
The current menu is three text buttons on a canvas. There is no sense of place, no personality, no progression visibility, no stats, and no settings. A new player and a 100-hour player see the exact same screen.

### The Vision

**Main Menu (Hub Screen)**
The main menu should feel alive. The circular arena lives in the background with ambient particle effects and the 4-color ports gently pulsing. The DEFLECT title should have a subtle glow animation tied to the background music beat.

Layout (top to bottom):
- **Player banner** at top: avatar icon (unlockable), player level, current streak flame icon, total stars earned
- **DEFLECT** title with glow, centered
- **Daily Challenge card**: a prominent, time-limited card showing today's challenge with a countdown timer ("12h 34m left"), a preview of the modifier ("FAST START: 3 colors from second 0"), and if completed, your score with a comparison to the global median
- **Mode selector** below: horizontally scrollable cards for each mode (Arcade, Zen, Daily, Boss Rush, Challenge Mode), each with an icon, a subtitle, and a padlock if locked
- **Bottom nav bar**: Play (current), Collection (unlockables), Stats, Settings

**First-Time Player Menu**
- Simplified: just the DEFLECT title and a large pulsing "TAP TO PLAY" button
- After completing the tutorial and first game, expand to show mode selection
- After 3 games, show the full menu with daily challenge card

**Returning Player Menu**
- Streak counter highlighted if active
- "NEW!" badges on recently unlocked items
- Daily challenge card is prominent and calls to action
- "Beat your best" reminder showing how close the last score was to the high score

**Transitions**
- Mode select to gameplay: arena zooms in, ports materialize, core pulses to life
- Gameplay to game over: slow-mo on final hit, dramatic camera shake, then score card slides up from bottom
- Game over to menu: score card slides down, menu fades in from behind
- Menu to collection: horizontal slide transition
- All transitions should be 300-400ms with easing curves, never instant cuts

**Settings Screen**
- Music volume slider
- SFX volume slider
- Reduced motion toggle (already supported)
- Haptic feedback toggle (for devices that support it)
- Color accessibility modes (deuteranopia, protanopia friendly palettes using shape indicators on orbs)
- Data: export/import save data
- Credits

---

## Part 3: Game Modes & Variety

### Current Modes (Keep, Improve)

**Arcade (Core Mode)**
- This stays as the primary "prove yourself" mode
- Improvement: add power-up drops (see below), boss waves at 60s/120s/180s
- Improvement: visible milestones during the run ("SURVIVED 60s!", "100 CATCHES!")

**Zen (Chill Mode)**
- Keep as the "no stakes" mode for practice and relaxation
- Improvement: zen should have its own ambient music track (slower, more atmospheric)
- Improvement: add an accuracy percentage HUD and a personal best accuracy to beat

**Daily Challenge (Retention Anchor)**
- This is the single most important mode for Day 7+ retention. Treat it as the flagship.
- One attempt per day (keep this constraint -- scarcity drives value, as Wordle proved)
- Each daily has a unique modifier that changes how you play:
  - "SPEED DEMON": orbs move 40% faster, but ports are 30% wider
  - "MINIMALIST": only 1 deflector allowed at a time
  - "COLOR BLIND": all orbs start gray, reveal color only when deflected
  - "BOSS RUSH": boss waves every 20 seconds
  - "FRAGILE": core has 2 HP instead of 5
  - "GENEROUS": start with 8 HP but no combo multiplier
  - "BACKWARDS": ports rotate slowly clockwise during play
  - "RAINBOW": rainbow orbs that match any port, but worth 1x points
- After completing, show: your score, global percentile rank, friend comparison (if friends exist), and the emoji share card
- Daily streak tracking with escalating rewards (3-day, 7-day, 14-day, 30-day milestones)

### New Modes

**Boss Rush**
- Unlocked after surviving 90 seconds in Arcade
- Continuous boss waves (dense clusters of same-color orbs from one direction) with short breaks
- Bosses get progressively harder: faster, more colors, tighter groupings
- Each boss wave cleared = 1 star; track how many stars per run
- This mode tests strategic deflector placement rather than reactive play

**Challenge Mode (Weekly Rotating)**
- A new hand-crafted challenge every week with specific constraints and a target score
- Examples:
  - "Combo King": reach a 20x combo in under 60 seconds
  - "Efficiency Expert": catch 50 orbs with fewer than 20 deflectors drawn
  - "Survivor": last 120 seconds with only 2 HP
  - "Perfectionist": 100% accuracy for 30 seconds
- Completing a challenge awards a unique badge for your profile
- Three difficulty tiers: Bronze, Silver, Gold targets

**Gauntlet (Endurance)**
- Unlocked after reaching Level 5 (meta-progression)
- Series of 5 back-to-back rounds with escalating difficulty
- HP carries over between rounds (no reset)
- Between rounds: choose 1 of 3 random power-ups (Vampire Survivors style)
- Final score is cumulative across all 5 rounds
- This is the "serious player" mode for leaderboard chasers

**Practice Mode**
- Unlocked from the start
- Choose specific difficulty settings: number of colors, orb speed, spawn rate
- No scoring, no HP loss
- Useful for learning new color patterns before they appear in Arcade
- Geometry Dash proved that giving players a way to practice specific sections dramatically increases retention because it reduces frustration

### Power-Ups

Power-ups drop as glowing pickups when you catch orbs (chance-based, roughly 1 per 15-20 catches). Swipe through them to collect, or let them expire.

**Deflector Power-ups:**
- **Steel Wall**: next deflector lasts 8 seconds instead of 3 and can bounce unlimited orbs
- **Wide Wall**: next deflector is 50% longer
- **Mirror Wall**: next deflector reflects orbs at double speed toward the nearest matching port (auto-aim assist)
- **Fourth Wall**: temporarily allows 4 active deflectors instead of 3

**Orb Power-ups:**
- **Time Slow**: all orbs move at 50% speed for 5 seconds (distinct from near-miss slow-mo: this is player-controlled)
- **Magnet**: all orbs on screen are gently pulled toward their matching port for 4 seconds
- **Splitter**: next orb that hits a deflector splits into 2 orbs of the same color (bonus catch potential, like Breakout multi-ball)
- **Gold Rush**: for 5 seconds, all catches are worth 3x points (visual: orbs turn gold-tinted)

**Core Power-ups:**
- **Shield**: absorbs the next 1 hit to the core without losing HP
- **Heal**: restores 1 HP (max cap still applies)
- **Pulse**: sends a shockwave from the core that slows all orbs for 2 seconds

**Power-up Design Rules:**
1. Power-ups enhance the core mechanic (swiping to deflect), they never replace it
2. No power-up should last longer than 8 seconds -- they're moments of excitement, not sustained advantages
3. Power-ups should be visually distinct (unique glow color, icon) so players can make split-second decisions
4. Power-ups should feel amazing to use -- big particle effects, satisfying sound, brief screen flash

### New Orb Types

Beyond the 4 base colors:

- **Bomb Orb (black with red pulse)**: if it reaches the core, instant death (lose ALL remaining HP). Must be deflected out of the arena (any direction) or into any port. Appears after 75 seconds in Arcade. High tension, high drama.
- **Gold Orb (shimmering gold)**: worth 5x points but moves 1.5x faster. No color matching needed -- any port works. Rewards sharp reflexes.
- **Rainbow Orb (cycling through all colors)**: matches ANY port. Worth 1x points, but always extends your combo (never breaks it). The "safety valve" that keeps combos alive during hectic moments.
- **Ghost Orb (translucent white)**: passes through deflectors once, then becomes solid. Requires you to position a deflector where the orb will be on its second pass. Skill-testing.
- **Split Orb (double-ringed)**: when it hits a deflector, splits into 2 smaller orbs of random colors. Chaotic and exciting.

---

## Part 4: Meta-Progression & Retention

This is what turns a fun 10-minute game into a daily habit. Every element below serves one goal: give the player a reason to come back tomorrow.

### Player Level (XP System)

Every game earns XP based on:
- Score (1 XP per 100 points)
- Survival time (1 XP per 10 seconds survived)
- Combo bonus (max combo as bonus XP)
- Daily challenge completion (flat 50 XP bonus)
- First game of the day (25 XP bonus)

Level thresholds follow a gentle exponential curve. Levels 1-10 are fast (1-2 games each). Levels 10-25 are moderate. Levels 25-50 are a long-term chase.

Each level unlock awards one of:
- A new theme
- A new deflector style
- A new orb trail effect
- A new arena background
- Access to a new mode or modifier

### Achievement System

Achievements are the backbone of long-term engagement. They give players micro-goals that make every session productive, even when the high score doesn't fall.

**Skill Achievements (tiered: bronze/silver/gold)**
- "Combo Starter" / "Combo Machine" / "Combo Legend": reach 5x / 15x / 30x combo
- "Survivor" / "Endurance" / "Immortal": survive 60s / 120s / 300s in Arcade
- "Sharpshooter" / "Marksman" / "Perfect Eye": 80% / 90% / 98% accuracy in a single run
- "Close Call" / "Living Dangerously" / "Death Wish": trigger 3 / 10 / 25 near-misses in one run
- "Century" / "Millennium": catch 100 / 1000 total orbs

**Discovery Achievements**
- "First Daily": complete your first daily challenge
- "Power Player": collect every type of power-up at least once
- "Bomb Defuser": successfully deflect 10 bomb orbs
- "Gold Digger": catch 50 gold orbs
- "Rainbow Road": catch 25 rainbow orbs

**Dedication Achievements**
- "Regular": play 3 days in a row
- "Dedicated": play 7 days in a row
- "Obsessed": play 30 days in a row
- "Centurion": play 100 total games
- "Veteran": reach Player Level 25

**Secret Achievements (hidden until earned)**
- "Photo Finish": win with exactly 1 HP remaining
- "Untouchable": complete a daily challenge with 5/5 HP
- "Speed Demon": reach 1000 points in under 45 seconds
- "Zen Master": achieve 100% accuracy in Zen mode for 60+ seconds

Each achievement awards XP, and gold-tier achievements award a unique cosmetic item.

### Daily & Weekly Challenges

**Daily Challenge** (described in modes section)
- The anchor of the retention loop
- Streak tracking with visual flame that grows with consecutive days
- Streak milestones award exclusive cosmetics:
  - 3-day streak: "Ember" deflector trail
  - 7-day streak: "Blaze" arena theme
  - 14-day streak: "Inferno" orb trail
  - 30-day streak: "Phoenix" core skin (the most prestigious cosmetic)

**Weekly Challenge**
- Resets every Monday
- A specific skill challenge with bronze/silver/gold tiers
- Completing gold awards a "weekly star" -- collect 4 weekly stars to unlock a monthly cosmetic

### Unlock Tree (Cosmetics)

All cosmetics are purely visual. Nothing affects gameplay balance.

**Arena Themes** (background + arena ring appearance):
- Default: Dark Neon (unlocked)
- Sakura: pink cherry blossom particles, warm tones
- Deep Sea: underwater bubbles, teal glow, gentle sway
- Cyberpunk: harsh neon, glitch effects, rain
- Void: ultra-minimal, black with white wireframe
- Retro: pixel-art style, 8-bit particle effects
- Sunset: warm gradient background, gold tones

**Deflector Styles** (the wall you draw):
- Default: white glow (unlocked)
- Laser: thin, bright, red with end sparks
- Lightning: electric blue, jagged edges
- Brush: paint-stroke effect, thick and textured
- Glass: transparent with refraction effect
- Fire: orange glow with flame particles
- Ice: crystalline blue with frost particles

**Orb Trails** (particle trail behind orbs):
- Default: color-matched dots (unlocked)
- Comet: long streaking tail
- Sparkle: glittering particles
- Smoke: wispy, atmospheric
- Geometric: tiny shapes (triangles, squares)
- None: clean, minimal look

**Core Skins** (appearance of the center core):
- Default: blue ring (unlocked)
- Heart: pulses like a heartbeat
- Eye: tracks the nearest orb
- Crystal: faceted, prismatic reflections
- Skull: for players who love danger
- Phoenix: earned through 30-day streak, animated flame

---

## Part 5: Visual Polish & Juice

The game already has good foundations (particles, screen shake, slow-mo, beat-reactive rendering). Here is what takes it from "good" to "people-share-screenshots-of-this."

### Menu Animations
- Title text should have a gentle float animation (sine wave on Y position) and a glow pulse synced to ambient music
- Mode cards should slide in with a stagger delay (first card at 0ms, second at 100ms, third at 200ms)
- Daily challenge card should have a subtle shimmer effect
- Streak flame should animate (small/medium/large based on streak length)
- Buttons should have a satisfying press animation (scale down to 95%, then bounce back to 100%)

### Gameplay Juice Improvements
- **Catch celebration**: when combo reaches 5x, 10x, 15x, add escalating screen-wide particle bursts
- **Combo text scaling**: combo counter text should grow physically larger with the combo (caps at reasonable size)
- **Port satisfaction**: when an orb enters the correct port, the port should briefly flash brighter and emit a directional particle burst inward
- **Deflector draw feel**: the deflector should materialize with a quick "zip" animation from start to end, not appear instantly
- **Near-miss enhancement**: in addition to slow-mo, add a chromatic aberration effect (RGB split) for 200ms
- **New high score moment**: if the player beats their high score mid-game, brief golden flash + "NEW BEST!" floating text + haptic pulse
- **Boss wave entrance**: screen darkens at edges, warning indicator flashes the direction of incoming wave, dramatic drum roll in music

### Game Over Screen Polish
- Final hit should trigger a 500ms slow-mo death sequence where the core cracks and shatters
- Score should count up from 0 to final score (satisfying number animation)
- Stats should slide in one-by-one with stagger timing
- If new high score: firework particle burst, gold text, special sound
- If close to high score (within 10%): "SO CLOSE!" text to drive retry

### Celebration Screens
- First-time achievements: full-screen overlay with the achievement badge, name, description, and XP awarded
- New level: level-up animation with a brief particle burst and the new unlock preview
- Streak milestones: dramatic reveal of the streak reward cosmetic

### Loading & Splash
- PWA splash: DEFLECT logo on dark background with 4-color accent ring
- Loading should be near-instant (keep bundle under 200KB), but if it takes >500ms, show a minimal progress bar with the logo

---

## Part 6: Social & Viral Features

### Share System (Evolution from Current)

**Current state**: text-based emoji score card copied to clipboard. This is good! It is exactly how Wordle started. But we can do better.

**Phase 1 (V1.0): Enhanced Emoji Cards**
Keep the current format but make it richer:
```
DEFLECT DAILY #47
SPEED DEMON modifier

1,240 pts | 78s | 12x combo
Red:   Green:   Blue:   Yellow:
[accuracy bar] 87%

Streak: 14 days
```
Add the daily challenge number (for community comparison), the modifier name, and the streak count. The streak count is social proof that drives FOMO.

**Phase 2 (V1.5): Canvas-Rendered Image Cards**
Generate a shareable image (PNG) using canvas rendering:
- Dark background with the DEFLECT neon aesthetic
- Score prominently displayed
- Color-coded performance per orb type
- Mini-replay: a small visualization of the player's deflector patterns during the game (abstract art from their play style)
- This becomes the "I want to share this because it looks cool" moment
- Use Web Share API for native sharing on mobile, clipboard fallback on desktop

**Phase 3 (V2.0): Replay Clips**
- Record the last 10 seconds of a high-scoring run as a short video/GIF
- Auto-capture on new high score or on particularly dramatic moments (near-miss sequences, long combos)
- Share to social with the DEFLECT branding overlaid

### Challenge-a-Friend
- Generate a URL that encodes a specific challenge: "Beat my score of 1,240 on today's daily"
- When the friend opens the link, it drops them directly into the daily challenge (or the same seeded run)
- After they finish, show a head-to-head comparison screen
- This is the single best viral mechanic: it combines competition with a direct call-to-action

### Leaderboards
- **Daily Leaderboard**: top scores on today's daily challenge (anonymous -- show player-chosen 3-letter initials like arcade cabinets)
- **Weekly Leaderboard**: best Arcade score this week
- **All-Time**: top 100 Arcade scores ever
- **Friends Leaderboard**: if friends are connected (via shared challenge links that establish a friend connection)
- Leaderboards should be visible from the main menu stats screen
- Display the player's rank and the scores immediately above and below them (so they see how close they are to climbing)

### Social Features We Intentionally Skip
- No real-time multiplayer in V1 (engineering complexity too high, and the core game is single-player first)
- No chat or messaging (not that kind of game)
- No user profiles visible to strangers (privacy-first)
- No social login required (everything works with local storage first)

---

## Part 7: Audio Vision

The current procedural audio and layered music system is genuinely impressive. Here is where to push it further:

### Mode-Specific Music
- **Arcade**: current energetic electronic track (keep, it's great)
- **Zen**: new ambient track -- slower BPM (70-80), pads instead of drums, evolves gently over time
- **Daily Challenge**: slight variation on Arcade theme that matches the daily modifier (e.g., "SPEED DEMON" gets a faster base BPM, "MINIMALIST" gets a stripped-down arrangement)
- **Boss Rush**: aggressive, driving beat with a heavier kick and distorted bass
- **Menu**: ambient background that smoothly transitions into gameplay music when a mode is selected

### Sound Design Additions
- Power-up collect: satisfying "ding" with pitch variation based on power-up type
- Power-up activate: whoosh/shimmer that communicates the power-up effect
- Bomb orb warning: low rumbling sound when a bomb orb spawns
- Gold orb: high-pitched shimmer trail sound
- Achievement unlock: triumphant 3-note chime
- Level up: ascending arpeggio
- Streak milestone: dramatic stinger (think Zelda chest-open sound)
- New high score (mid-game): brief musical flourish layered on top of the current track

### Haptic Feedback (Mobile)
- Light pulse on deflector draw
- Medium pulse on successful catch
- Heavy pulse on core damage
- Pattern pulse on combo milestones (5x, 10x, 15x)
- This is hugely underrated -- Geometry Dash players consistently cite the tactile feedback as part of why the game "feels right"

---

## Part 8: Monetization Philosophy

DEFLECT is a web game first. The monetization needs to respect that context: no app store gatekeeping, no forced ads, no pay-to-win. The game must be fully playable and enjoyable at zero cost.

### What is Always Free
- All game modes (including future ones)
- Daily challenges and streaks
- Core progression system (XP, levels)
- Base set of cosmetics (enough to feel personalized)
- Leaderboards and sharing
- All gameplay mechanics and power-ups

### What Could Be Paid (Cosmetic Only)

**Premium Theme Packs ($1.99 each)**
- Themed bundles of arena + deflector + orb trail
- Examples: "Synthwave Pack", "Ocean Depths Pack", "Pixel Retro Pack"
- Each pack has 3-5 items that share a visual theme

**"Supporter" Tier ($4.99 one-time)**
- Unlocks ALL current cosmetics
- A special "Supporter" badge on your profile
- Early access to new themes
- Supports ongoing development
- This is the "I love this game and want to support the developer" option

**Season Pass (if seasons are implemented, V2.0)**
- $2.99 per season (runs 4-6 weeks)
- Free track: basic rewards for playing (XP boosts, common cosmetics)
- Paid track: premium cosmetics, exclusive deflector styles, unique core skins
- The paid track should feel like a bonus on top of already-generous free rewards

### What We Never Do
- No pay-to-win (no power-up purchases, no HP boosts, no score multipliers)
- No forced ads (no "watch ad to continue" or "ad before every game")
- No loot boxes or gacha (every purchase is exactly what you see)
- No energy systems (play as much as you want, whenever you want)
- No paywalled modes (everyone gets every mode)

### Optional Ad Support
- Rewarded video ads (player-initiated): watch a 30-second ad to earn bonus XP or a random cosmetic drop
- This is entirely optional and clearly labeled
- Never interrupts gameplay
- Maximum 3 per day to prevent ad fatigue

---

## Part 9: Prioritized Feature Roadmap

### V1.0 -- "The Real Game" (Launch)

The goal: someone can discover DEFLECT, play it, and have a reason to come back tomorrow.

**Must Have:**
1. Proper menu system with animated transitions (main menu, mode select, settings, game over)
2. Enhanced Daily Challenge with modifiers (at least 5 unique modifier types), one-attempt limit, streak tracking
3. Achievement system (20+ achievements across skill, discovery, and dedication categories)
4. Player level / XP system with visible progress bar on menu
5. 4-6 unlockable arena themes (earned through XP levels)
6. 4-6 unlockable deflector styles (earned through achievements and levels)
7. Enhanced share cards with daily challenge number, modifier name, and streak count
8. Settings screen (volume, reduced motion, color accessibility)
9. Game over screen polish (count-up score animation, staggered stats, new high score celebration)
10. Gameplay transitions (menu to game, game to game over, game over to menu)
11. First-time user experience (simplified menu, expanded tutorial, gentle onboarding over first 3 games)
12. Color accessibility mode (shape indicators on orbs for color-blind players)

**Should Have:**
13. Power-ups (at least 4 types: Time Slow, Shield, Wide Wall, Gold Rush)
14. Boss waves in Arcade mode (at 60s and 120s marks)
15. Gold orbs (bonus points, faster speed)
16. Bomb orbs (high-risk, high-tension)
17. Haptic feedback on mobile devices
18. Practice mode

**Estimated Scope:** This is a substantial release. The daily challenge + achievements + XP loop is the retention core. The menu system and polish are what make it feel like a real product instead of a prototype.

### V1.5 -- "The Depth Update"

The goal: players who loved V1.0 discover there is way more to this game. This is the update that converts casual players into dedicated players.

1. Boss Rush mode (continuous boss waves, star tracking per run)
2. Gauntlet mode (5 rounds, power-up selection between rounds)
3. Challenge mode (weekly rotating challenges with bronze/silver/gold tiers)
4. Full power-up system (all 10+ power-ups from the design above)
5. New orb types: Rainbow, Ghost, Split
6. Canvas-rendered image share cards (PNG generation with neon aesthetic)
7. Challenge-a-friend via shareable URLs
8. Daily and weekly leaderboards
9. 6+ additional cosmetics (new themes, deflector styles, orb trails)
10. Core skins (new cosmetic layer)
11. Mode-specific music tracks (Zen ambient, Boss Rush aggressive)
12. Weekly challenge system with badge rewards
13. Premium theme packs (first monetization)

### V2.0 -- "The Community Update"

The goal: DEFLECT becomes a platform, not just a game. Players create content, compete with friends, and express their identity.

1. Season system (4-6 week seasons with free + paid tracks)
2. Replay recording and sharing (last 10 seconds as video/GIF)
3. Friends system (established through challenge links, persistent)
4. Friends leaderboard
5. Player profile with achievement showcase, stats dashboard, and equipped cosmetics
6. Advanced daily challenge modifiers (rotating arena, color-blind mode, etc.)
7. Expanded achievement system (50+ achievements)
8. "Supporter" tier and premium monetization
9. Monthly rotating event modes (limited-time game modifiers with exclusive cosmetics)
10. Global stats dashboard (total orbs caught worldwide, community milestones)
11. Notification system for streaks and friend challenges (PWA push notifications)
12. Arena editor? (stretch goal: let players create custom modifier sets and share them)

---

## Part 10: Success Metrics

How do we know if the product vision is working?

| Metric | Current (Estimate) | V1.0 Target | V1.5 Target | V2.0 Target |
|--------|-------------------|-------------|-------------|-------------|
| D1 Retention | ~10% | 35% | 40% | 45% |
| D7 Retention | ~2% | 18% | 22% | 28% |
| D30 Retention | ~0% | 8% | 12% | 16% |
| Avg Session Length | 2 min | 5 min | 8 min | 10 min |
| Sessions per Day | 1 | 1.5 | 2.0 | 2.5 |
| Daily Challenge Completion | N/A | 60% of DAU | 70% of DAU | 75% of DAU |
| Share Rate | <1% | 5% | 10% | 15% |
| Avg Streak Length | N/A | 3 days | 5 days | 7 days |

The single most important metric is **D7 retention**. If a player comes back on day 7, they are likely to become a long-term player. Everything in V1.0 is designed to get someone to day 7.

The three levers for D7:
1. **Daily Challenge** -- "I need to do today's challenge before it expires"
2. **Streak** -- "I can't break my 5-day streak"
3. **Progression** -- "I'm 200 XP away from unlocking the Sakura theme"

---

## Part 11: What Makes DEFLECT Special

There are a thousand arcade games. Here is what makes DEFLECT worth playing:

1. **The swipe mechanic is unique.** Drawing temporary physics walls is not a common input method. It feels novel and satisfying in a way that tapping or swiping-to-move does not. This is our moat.

2. **The music-gameplay fusion.** The beat-reactive visuals and layered procedural music are not decoration -- they are part of how the game communicates difficulty and tempo. This is rare for a web game.

3. **The near-miss system.** The slow-mo on near-misses is pure game feel genius. It creates highlight-reel moments in every single run. These moments are what players remember and talk about.

4. **Instant retry.** Death to playing in under 0.5 seconds. This is not something to take for granted. Super Hexagon proved that sub-second retry is worth more than any feature.

5. **It runs everywhere.** A PWA that loads in under 2 seconds on 3G, runs at 60fps on mid-range phones, and works offline. No app store, no install, no account creation. URL to playing in 3 seconds. This is a distribution advantage that native games cannot match.

The product vision is not about adding features to a prototype. It is about building systems that give players reasons to care about their next game, their streak, their cosmetics, their rank, and their personal bests. The core gameplay is already fun. Now we make it matter.

---

*This document should be treated as a living vision, not a rigid specification. The specific features and priorities should be validated through player feedback and metrics as each version is released. Ship fast, measure, iterate.*
