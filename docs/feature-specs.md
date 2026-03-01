# DEFLECT -- Feature Specifications & UX Flows

> **Document purpose:** Detailed user stories, acceptance criteria, UX flows, and interaction specs for expanding DEFLECT from a working prototype into a retainable product. Written for a development team to pick up and build from.

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Menu System & Screen Flow](#2-menu-system--screen-flow)
3. [Power-Up System](#3-power-up-system)
4. [New Orb Types](#4-new-orb-types)
5. [Progression & Unlock System](#5-progression--unlock-system)
6. [Enhanced Game Modes](#6-enhanced-game-modes)
7. [Social Features](#7-social-features)
8. [UX Flow Diagrams](#8-ux-flow-diagrams)

---

## 1. Current State Summary

### What Exists Today

- **Arena:** Circular play area with a core (5 HP) in the center, 2-6 colored ports around the perimeter
- **Mechanics:** Swipe to draw deflectors (max 3, last 3s each), bounce orbs into matching ports
- **Scoring:** 10 points per catch multiplied by combo counter; combo resets on any miss
- **Difficulty:** Ramps from 1 color to 4 colors over 90 seconds; speed and spawn rate increase continuously
- **Modes:** Arcade (survive for score), Zen (no damage, accuracy focus), Daily Challenge (seeded RNG, same for everyone)
- **Feedback:** Particle effects, screen shake, near-miss slow-mo, floating score text, procedural audio, beat-reactive music
- **Tutorial:** Single swipe demo for first-time players (phase 1: ghost swipe hint, phase 2: watch the bounce)
- **Persistence:** Local storage for high scores and daily best; no accounts, no progression
- **Share:** Text-based score card with emoji color blocks and accuracy bar; copies to clipboard or uses Web Share API

### What Is Missing

- No reason to return tomorrow (no progression, no unlocks, no meta-game)
- No power-ups (gameplay has zero variance run-to-run)
- Only one orb type (colored signal)
- No settings screen (sound, music, reduced motion toggleable only via OS)
- No stats/profile (players cannot see their history)
- No proper screen navigation (menu is flat canvas with 3 buttons)
- Game over screen has no retry button
- No achievement system
- No social hooks beyond clipboard share

---

## 2. Menu System & Screen Flow

### 2.1 Splash / Loading Screen

**US-MENU-01:** As a player, I want to see a quick branded splash screen when I open the game so that I know the app is loading and I feel anticipation.

**Screen description:**
- Dark background (#0a0a1a)
- "DEFLECT" title in center, white text, large bold font
- Subtle pulsing glow behind the title (blue #4488ff shadow, oscillates over 1s)
- Thin horizontal progress bar below title showing asset load progress
- No interactive elements -- auto-transitions to Main Menu when ready

**Acceptance criteria:**
- [ ] Splash displays within 200ms of page load
- [ ] Progress bar fills as audio context, fonts, and localStorage are initialized
- [ ] Auto-transitions to Main Menu after load completes (target: under 1.5s on 4G)
- [ ] If load takes longer than 3s, show "Tap to start" fallback text
- [ ] Transition to Main Menu: title stays in place, progress bar fades out, menu elements fade/slide in from below over 300ms

---

### 2.2 Main Menu

**US-MENU-02:** As a player, I want a clear, attractive main menu that shows me what I can do and gives me a reason to explore.

**Screen description (top to bottom):**

| Element | Position | Details |
|---------|----------|---------|
| DEFLECT title | Upper center | White bold text, pulsing blue glow (existing) |
| Tagline | Below title | "Swipe to deflect. Match the colors." in muted gray (#8888aa) |
| Daily streak badge | Below tagline | If streak > 0: flame icon + "3-day streak!" in gold (#ffcc44). If no streak: hidden. |
| **Mode Selector** | Center | Three mode cards (see 2.3) |
| Stats button | Bottom left | "STATS" text button, muted style |
| Settings gear | Bottom right | Gear icon, muted style |
| High score | Below mode cards | "BEST: 1,240" in gold if > 0 |
| Decorative arena ring | Background | Existing animated ring with 4 demo-colored ports |
| Ambient particles | Background | Existing slow particle drift |

**Returning player differences:**
- Daily streak badge is visible if streak >= 1
- "NEW" badge on Daily Challenge card if today's challenge has not been attempted
- High score displays below mode cards
- If a new mode or feature was recently unlocked, a subtle shimmer highlight appears on that element

**Acceptance criteria:**
- [ ] All interactive elements have touch targets >= 44x44px
- [ ] Keyboard shortcuts still work: 1/A=Arcade, 2/Z=Zen, 3/D=Daily
- [ ] Stats and Settings buttons navigate to their respective screens
- [ ] First-time players see no streak badge and no high score
- [ ] Tapping anywhere outside a button no longer auto-starts Arcade (was a prototype shortcut; remove for production)

---

### 2.3 Mode Select Cards

**US-MENU-03:** As a player, I want to understand what each mode offers before I select it so that I pick the experience that matches my mood.

Each mode is a horizontal card with:

| Mode | Color | Icon | Subtitle | Lock state |
|------|-------|------|----------|------------|
| ARCADE | Blue (#4488ff) | Shield icon | "Survive as long as you can" | Always unlocked |
| ZEN | Green (#44ff88) | Infinity symbol | "No damage, pure flow" | Always unlocked |
| DAILY | Gold (#ffcc44) | Calendar icon | "Same pattern for everyone" | Always unlocked |
| CHALLENGE | Purple (#aa44ff) | Star icon | "Weekly modifiers" | Unlocks at Level 3 |
| BOSS RUSH | Red (#ff4466) | Skull icon | "Survive the waves" | Unlocks at Level 5 |
| PUZZLE | Cyan (#44ddff) | Puzzle piece | "Find the perfect path" | Unlocks at Level 8 |
| TIME ATTACK | Orange (#ff8844) | Stopwatch icon | "Race the clock" | Unlocks at Level 10 |

**Locked card appearance:**
- Grayed out with a padlock icon overlay
- Shows "LEVEL X" below the padlock
- Tapping a locked card shows a brief toast: "Reach Level X to unlock [Mode Name]"
- The toast fades after 2 seconds

**Scrolling behavior:**
- Cards are arranged vertically
- If more than 3 cards fit on screen, the list scrolls vertically
- First 3 modes (Arcade, Zen, Daily) are always visible without scrolling on standard phone screens

**Acceptance criteria:**
- [ ] Locked modes are visually distinct (desaturated, padlock overlay)
- [ ] Tapping a locked mode shows unlock requirement toast, does NOT start a game
- [ ] Tapping an unlocked mode starts the game in that mode with a zoom-in transition
- [ ] "NEW" badge appears on newly unlocked modes until first played

---

### 2.4 Settings Screen

**US-MENU-04:** As a player, I want to control sound, music, and visual settings so that I can play comfortably in different environments.

**Screen layout (scrollable list):**

| Setting | Control type | Default | Details |
|---------|-------------|---------|---------|
| Sound Effects | Toggle | ON | Mutes all SFX (swipe, bounce, catch, damage, game over) |
| Music | Toggle | ON | Mutes procedural music engine |
| Music Volume | Slider (0-100%) | 80% | Only visible when Music is ON |
| SFX Volume | Slider (0-100%) | 100% | Only visible when Sound Effects is ON |
| Reduced Motion | Toggle | Matches OS | Disables screen shake, reduces particle count, disables slow-mo |
| Haptic Feedback | Toggle | ON | Vibration on swipe, catch, and damage (if device supports it) |
| Show FPS | Toggle | OFF | Developer option: shows frame rate counter top-right |
| Reset Progress | Button (red) | -- | Confirmation dialog: "This will erase all progress. Are you sure?" |
| About | Link | -- | Opens a small overlay with version number, credits, link to source |

**Navigation:**
- Back arrow in top-left corner returns to Main Menu
- Transition: slide in from right, slide out to right on back

**Acceptance criteria:**
- [ ] All settings persist to localStorage
- [ ] Reduced Motion toggle overrides OS-level prefers-reduced-motion when explicitly set
- [ ] Music volume change takes effect immediately (no need to restart)
- [ ] Reset Progress requires a confirmation tap ("RESET" button turns red, tap again to confirm)
- [ ] Settings screen is accessible during gameplay via pause (future: pause overlay)

---

### 2.5 Stats / Profile Screen

**US-MENU-05:** As a player, I want to see my personal stats and history so that I can track my improvement over time.

**Screen sections:**

**Summary Bar (top):**
- Player level + XP progress bar (see Section 5)
- Total games played
- Total play time (formatted: "12h 34m")

**Personal Bests:**
- Arcade high score
- Zen best accuracy percentage
- Daily best score (today)
- Longest survival time
- Highest combo ever

**Per-Color Stats:**
- Four colored bars showing catch rate per color (catches / total signals of that color)
- Highlights weakest color with "Practice this!" label

**Recent Games (last 10):**
- Each row: Mode icon | Score | Duration | Combo | Date
- Tapping a row could expand to show color breakdown (stretch goal)

**Streak Tracker:**
- Calendar-style row showing last 7 days
- Filled circles for days played, empty for missed
- Current streak count with flame icon

**Navigation:**
- Back arrow returns to Main Menu
- Transition: slide in from left, slide out to left on back

**Acceptance criteria:**
- [ ] All stats stored in localStorage as a JSON blob
- [ ] Stats update immediately after each game over
- [ ] If no games played, show "Play your first game!" prompt instead of empty stats
- [ ] Color catch-rate bars are proportional and use the correct signal colors
- [ ] Streak resets if a day is missed (based on local device date)

---

### 2.6 Daily Challenge Hub

**US-MENU-06:** As a player, I want a dedicated daily challenge screen so that I can see my streak, today's challenge details, and compare with past attempts.

**Screen layout:**

**Today's Challenge Card (prominent):**
- Large "DAY 47" or calendar date header
- Challenge modifier description (e.g., "Fast orbs, 3 colors only")
- Seed-based visual pattern (abstract geometric thumbnail generated from the day's seed)
- "PLAY" button if not yet attempted today
- Score + stats if already attempted today
- "SHARE" button if already completed

**Streak Section:**
- Current streak count (large number with flame icon)
- Best streak ever
- Calendar strip showing last 14 days (filled = played, empty = missed, today = highlighted)

**Past Results (scrollable):**
- Last 7 days of daily challenges
- Each row: Date | Score | Accuracy | Combo
- Tap to see full stats breakdown

**Acceptance criteria:**
- [ ] Daily challenge seed is deterministic based on date (already uses `dailySeed()`)
- [ ] Player can only play the daily challenge once per calendar day (local timezone)
- [ ] If already played today, PLAY button is replaced with "COMPLETED" badge and score
- [ ] Streak increments only when daily challenge is played (not regular games)
- [ ] Share button generates the existing emoji score card for the daily result

---

### 2.7 Game Over Screen (Redesigned)

**US-MENU-07:** As a player, I want a rich game over screen that celebrates my performance, shows me progress, and makes it effortless to try again.

**Screen layout (top to bottom):**

| Element | Details |
|---------|---------|
| "CORE BREACH" / "SESSION END" | Red text for Arcade/Daily, Green "SESSION END" for Zen |
| Final Score | Large white bold number with count-up animation (0 to final over 1s) |
| New High Score banner | Gold text, bouncing animation, only if new record |
| XP Earned bar | "+120 XP" with animated fill bar showing progress toward next level |
| Level Up celebration | If XP crosses level threshold: "LEVEL UP!" with particle burst, shows what was unlocked |
| Stats row | Survived time, catches, best combo, accuracy % |
| Per-color breakdown | 4 small colored circles with catch counts, worst color highlighted |
| Coaching tip | Contextual advice (e.g., "Try focusing on red orbs early" or "Great combo -- aim for 15x next!") |
| Achievement popups | Any newly earned achievements slide in from right, one at a time, 1.5s apart |
| **RETRY** button | Blue, large, prominent -- restarts same mode immediately |
| **SHARE** button | Outlined style, next to retry |
| **MENU** button | Small text link below the action buttons |

**Coaching tip logic:**
- If accuracy < 50%: "Focus on bouncing orbs toward matching colors"
- If worst color has > 3 misses: "Practice aiming [COLOR] orbs -- they leaked the most"
- If max combo < 5: "Try to chain 5 catches in a row for bonus points!"
- If max combo >= 10: "Incredible combos! Aim for [maxCombo + 5]x next time"
- If survived > 90s: "Amazing endurance! Can you push to [next 30s milestone]?"

**Transition animations:**
- Dark overlay fades in over 400ms
- Elements appear staggered: title (0ms), score (200ms), XP bar (400ms), stats (600ms), buttons (800ms)
- Achievement popups begin at 1200ms

**Acceptance criteria:**
- [ ] RETRY button restarts the same mode without returning to menu
- [ ] Score count-up animation runs over 1 second with easing
- [ ] XP bar animates to show gain (from pre-game XP to post-game XP)
- [ ] Level up celebration interrupts the normal flow with a 2s fanfare overlay
- [ ] Achievement popups queue and display one at a time
- [ ] Tapping anywhere except buttons does NOT dismiss the screen (prevents accidental dismissal)
- [ ] MENU button returns to Main Menu with fade transition
- [ ] Coaching tip is contextual and never generic

---

### 2.8 Screen Transitions

| From | To | Animation | Duration |
|------|----|-----------|----------|
| Splash | Main Menu | Title stays, elements fade/slide up | 300ms |
| Main Menu | Playing | Arena zooms in, menu fades out | 400ms |
| Main Menu | Settings | Settings slides in from right | 250ms |
| Settings | Main Menu | Settings slides out to right | 250ms |
| Main Menu | Stats | Stats slides in from left | 250ms |
| Stats | Main Menu | Stats slides out to left | 250ms |
| Main Menu | Daily Hub | Daily Hub slides up from bottom | 300ms |
| Daily Hub | Main Menu | Slides down | 300ms |
| Playing | Game Over | Dark overlay fades in, staggered elements | 400ms |
| Game Over | Playing (Retry) | Quick flash-to-white wipe, 200ms | 200ms |
| Game Over | Main Menu | Fade to dark, menu fades in | 350ms |

**Reduced motion behavior:**
- All transitions become instant cuts (0ms) with a simple opacity crossfade (150ms)
- No sliding, zooming, or scaling animations

---

## 3. Power-Up System

### 3.1 Overview

**US-PWR-01:** As a player, I want power-ups to appear during gameplay so that I have exciting tactical choices and moments of empowerment.

**Spawn mechanics:**
- Power-ups spawn as glowing pickup orbs that float slowly toward the center (same path as signals but 40% speed)
- Power-up orbs are white with a colored icon inside indicating their type
- They pulse with a gentle glow and have a distinct sparkle particle trail
- Power-ups despawn if not collected within 8 seconds
- A player collects a power-up by swiping a deflector through it (same mechanic as deflecting orbs)

**Spawn conditions:**
- First power-up never spawns before 20 seconds of play
- After 20s, a power-up has a 15% chance to spawn with each signal spawn event
- Maximum 1 power-up visible on screen at a time
- No power-ups in Zen mode (keeps it pure)
- Daily Challenge mode: power-up spawns are deterministic (seeded)

**Activation:**
- Power-ups activate instantly on collection (no inventory, no tap-to-use)
- Active power-up is shown as an icon in the top-center HUD with a circular timer ring
- Only one power-up can be active at a time; collecting a new one replaces the current

---

### 3.2 Power-Up Definitions

#### 3.2.1 Time Slow

**US-PWR-02:** As a player, I want to slow down time temporarily so that I can handle overwhelming waves of orbs.

| Property | Value |
|----------|-------|
| Icon | Hourglass |
| Color | Cyan (#44ddff) |
| Duration | 5 seconds |
| Effect | All signal movement speed reduced to 40% of current; deflectors still draw at normal speed |
| Visual | Blue-tinted screen overlay, signal trails become longer and more visible |
| Audio | Low-pass filter on all sounds, pitch drops |

**Acceptance criteria:**
- [ ] Player's swipe input is unaffected (only signals slow down)
- [ ] Deflector lifetime still ticks at normal rate
- [ ] Duration timer visible in HUD as shrinking ring around power-up icon
- [ ] Speed returns to normal with a brief 0.5s ease-out (not instant snap)

---

#### 3.2.2 Shield

**US-PWR-03:** As a player, I want a temporary shield so that I can survive a mistake without losing HP.

| Property | Value |
|----------|-------|
| Icon | Shield |
| Color | Gold (#ffcc44) |
| Duration | 4 seconds |
| Effect | Core is invulnerable; signals that hit the core are destroyed but deal no damage |
| Visual | Golden ring around core, pulses outward on each blocked hit |
| Audio | Metallic "ting" on each blocked hit |

**Acceptance criteria:**
- [ ] Blocked hits still reset combo (shield protects HP, not combo)
- [ ] Blocked hits add to miss counter (they were not caught in a port)
- [ ] Shield visual is clearly distinct from the danger ring (gold vs red)
- [ ] Shield activates even if coreHP is already at 1

---

#### 3.2.3 Multi-Bounce

**US-PWR-04:** As a player, I want my deflectors to bounce orbs multiple times so that I can set up impressive chain deflections.

| Property | Value |
|----------|-------|
| Icon | Double-arrow |
| Color | Purple (#aa44ff) |
| Duration | 6 seconds |
| Effect | Signals can bounce off deflectors up to 3 times instead of the default 1 |
| Visual | Deflectors glow purple; on each extra bounce, a small "x2" / "x3" text appears |
| Audio | Bounce pitch increases with each successive bounce |

**Acceptance criteria:**
- [ ] Each additional bounce off a deflector adds +5 bonus points (on top of eventual catch points)
- [ ] Orbs that bounce 3 times and then enter the correct port earn a "TRICK SHOT" floating text
- [ ] The bounced flag on the signal tracks bounce count, not just boolean
- [ ] Multi-bounce does NOT affect orb-to-orb interactions (if implemented later)

---

#### 3.2.4 Magnet

**US-PWR-05:** As a player, I want a magnet power-up that pulls orbs toward their matching ports so that accuracy becomes easier temporarily.

| Property | Value |
|----------|-------|
| Icon | Horseshoe magnet |
| Color | Red (#ff4466) |
| Duration | 5 seconds |
| Effect | Port magnetism strength increased 4x (from 0.25 to 1.0) and activation range increased from 0.8 radians to full arena |
| Visual | Visible attraction lines between deflected signals and their matching ports (thin dotted colored lines) |
| Audio | Subtle humming sound while active |

**Acceptance criteria:**
- [ ] Magnet only affects deflected signals (same as current magnetism logic)
- [ ] Attraction lines only render for signals currently being pulled
- [ ] Signals still need to reach the port (magnet assists but does not auto-catch)
- [ ] Non-matching signals are unaffected

---

#### 3.2.5 Splitter

**US-PWR-06:** As a player, I want a power-up that splits each caught orb into bonus points so that I can rack up high scores during its duration.

| Property | Value |
|----------|-------|
| Icon | Forking arrow |
| Color | Green (#44ff88) |
| Duration | 6 seconds |
| Effect | Each successful port catch during duration awards 2x points |
| Visual | Green aura around ports; caught signals produce double particle bursts |
| Audio | Double "ding" on catch instead of single |

**Acceptance criteria:**
- [ ] Points doubling applies to the base (10 * combo) calculation, then doubled
- [ ] Combo still increments by 1 per catch (not doubled)
- [ ] Visual feedback clearly communicates the bonus (larger floating text, different color)
- [ ] Works correctly with all orb types

---

#### 3.2.6 Extra Life

**US-PWR-07:** As a player, I want to occasionally find an extra life so that long runs feel more sustainable.

| Property | Value |
|----------|-------|
| Icon | Heart / plus |
| Color | Pink (#ff88aa) |
| Duration | Instant (no timer) |
| Effect | Restores 1 HP (up to max of 5) |
| Visual | HP pip refills with a pulse animation; heart floats up from core |
| Audio | Warm chime |

**Acceptance criteria:**
- [ ] If already at max HP (5), the extra life still spawns but collecting it shows "MAX HP" text and grants 50 bonus points instead
- [ ] Does not appear in Zen mode (HP is infinite)
- [ ] Only spawns when coreHP <= 3 (weighted spawn: more likely when lower HP)

---

### 3.3 Power-Up Interactions

- **Time Slow + Shield:** Both active simultaneously if collected in sequence (replace rule only applies to new pickups, not active durations overlapping from staggered collection). In practice, since only one can be active at a time, the second replaces the first.
- **Scoring during power-ups:** Power-up-assisted catches are tagged in stats as "power-up catches" for stat tracking but count normally for combo.

---

## 4. New Orb Types

### 4.1 Overview

**US-ORB-01:** As a player, I want different orb types to appear as the game progresses so that each run feels varied and I have to adapt my strategy.

**Spawn schedule (Arcade mode):**

| Time | New orb type available | Spawn weight |
|------|----------------------|--------------|
| 0-30s | Standard only | 100% standard |
| 30-45s | Gold orb introduced | 85% standard, 15% gold |
| 45-60s | Rainbow orb introduced | 75% standard, 15% gold, 10% rainbow |
| 60-75s | Splitter orb introduced | 65% standard, 12% gold, 10% rainbow, 13% splitter |
| 75-90s | Ghost orb introduced | 55% standard, 12% gold, 8% rainbow, 12% splitter, 13% ghost |
| 90s+ | Bomb orb introduced | 45% standard, 10% gold, 8% rainbow, 12% splitter, 12% ghost, 13% bomb |

Zen mode: Same schedule but shifted later (double all time thresholds).
Daily mode: Deterministic based on seed; may include any orb type at any time.

---

### 4.2 Orb Type Definitions

#### 4.2.1 Gold Orb

**US-ORB-02:** As a player, I want to see gold orbs that are worth extra points so that I have high-risk/high-reward targets to chase.

| Property | Value |
|----------|-------|
| Appearance | Gold color (#ffcc44), sparkle particles, slightly smaller radius (6 vs 8) |
| Speed | 1.3x current signal speed |
| Points | 3x normal catch value (30 * combo instead of 10 * combo) |
| Port matching | Still must enter correct-colored port (gold orb has an underlying color shown as a subtle tint) |
| Miss penalty | Standard (combo reset, miss counter) |

**Acceptance criteria:**
- [ ] Gold orbs have a visible underlying color indicator (small colored ring inside the gold)
- [ ] They are noticeably faster than standard orbs
- [ ] Floating text on catch shows gold-colored "+[points]" with a star symbol
- [ ] Gold orbs are affected by power-ups (magnet, time slow, etc.)

---

#### 4.2.2 Rainbow Orb

**US-ORB-03:** As a player, I want rainbow orbs that match any port so that I get a moment of relief during chaotic waves.

| Property | Value |
|----------|-------|
| Appearance | Cycles through all 4 colors smoothly (color shifts every 0.5s), white sparkle trail |
| Speed | Standard |
| Points | Standard (10 * combo) |
| Port matching | Any port counts as a match |
| Miss penalty | Standard if hits core; no wrong-port penalty |

**Acceptance criteria:**
- [ ] Color cycling is purely visual; the orb has no "wrong" port
- [ ] Hitting any port triggers the catch effect with that port's color
- [ ] Rainbow orbs hitting the core still deal 1 HP damage
- [ ] Rainbow orbs are clearly visually distinct from standard single-color orbs

---

#### 4.2.3 Splitter Orb

**US-ORB-04:** As a player, I want splitter orbs that break into two when deflected so that I face a fun aiming challenge.

| Property | Value |
|----------|-------|
| Appearance | Standard colored orb with a visible crack/split line through the middle |
| Speed | 0.9x standard (slightly slower) |
| Behavior on deflect | Splits into 2 standard-sized orbs of the same color, diverging at +/- 30 degrees from the original bounce angle |
| Points | Each child orb awards standard catch points independently |
| Miss penalty | Each child orb that misses counts as an independent miss |

**Acceptance criteria:**
- [ ] Split produces exactly 2 child orbs
- [ ] Child orbs are standard orbs (they do not split further)
- [ ] If the splitter orb hits the core before being deflected, it deals 1 HP (does not split)
- [ ] Split animation: brief flash at split point, two orbs fly apart
- [ ] Deflector that caused the split still has its normal bounce effect applied to both children
- [ ] Both children inherit the "deflected" flag (eligible for port magnetism)

---

#### 4.2.4 Ghost Orb

**US-ORB-05:** As a player, I want ghost orbs that pass through the first deflector so that I have to plan my wall placement more carefully.

| Property | Value |
|----------|-------|
| Appearance | Semi-transparent (50% opacity), with a wispy/smoky trail instead of solid trail |
| Speed | Standard |
| Behavior | Passes through the first deflector it touches (no bounce); bounces normally off the second deflector it touches |
| Points | 2x normal catch points (20 * combo) as reward for the extra difficulty |
| Miss penalty | Standard |

**Acceptance criteria:**
- [ ] Ghost orb visually "phases through" the first deflector with a ghostly ripple effect
- [ ] After phasing, ghost orb becomes fully opaque (solid), indicating it is now bounceable
- [ ] If only 1 deflector exists on screen, the ghost orb passes through it and heads toward core
- [ ] Ghost orbs interact normally with ports (must enter matching color)
- [ ] The deflector the ghost phases through is unaffected (does not lose life faster)

---

#### 4.2.5 Bomb Orb

**US-ORB-06:** As a player, I want bomb orbs that I absolutely must deflect so that high-tension moments create memorable plays.

| Property | Value |
|----------|-------|
| Appearance | Dark red/black pulsing orb with a ticking animation (pulses faster as it approaches core), flame particle trail |
| Speed | 0.8x standard (menacingly slow) |
| Behavior on core hit | Deals 2 HP damage instead of 1; screen shake is 2x intensity; large explosion particle effect |
| Behavior on deflect | Bounces normally; if it enters any port (any color), it is neutralized for standard points (10 * combo) |
| Special | Any port accepts a bomb orb (like rainbow, but for survival, not for ease) |
| Miss penalty | 2 HP damage + combo reset + miss counter |

**Acceptance criteria:**
- [ ] Bomb orb pulse animation accelerates as distance to core decreases
- [ ] 2 HP damage can kill the player if at 2 HP or less
- [ ] Warning indicator: when a bomb orb enters the arena, a brief "DANGER" text flashes at screen top
- [ ] Bomb orbs are affected by power-ups (shield blocks the 2 HP damage; time slow works; magnet pulls toward nearest port)
- [ ] Bomb orbs do not spawn in Zen mode
- [ ] Audio: ticking sound that increases in tempo as bomb approaches core

---

#### 4.2.6 Giant Orb

**US-ORB-07:** As a player, I want rare giant orbs that are slow but worth a lot so that I get exciting "boss target" moments.

| Property | Value |
|----------|-------|
| Appearance | 2.5x normal radius, same color system, with a thick glowing outline and inner geometric pattern |
| Speed | 0.5x standard |
| Points | 5x normal catch points (50 * combo) |
| Deflection | Requires a deflector of at least 60% of the arena radius length to bounce (shorter deflectors are ignored) |
| Port matching | Must enter matching color port; since the giant orb is larger, the port "catch zone" check uses its larger radius |
| Core damage | 3 HP damage if it reaches core |
| Spawn rate | Very rare; max 1 per run in arcade; appears after 75s |

**Acceptance criteria:**
- [ ] Giant orb is visually imposing (large size with strong glow)
- [ ] Short deflectors pass through the giant orb with a "TOO SMALL" floating text
- [ ] Deflecting a giant orb successfully shows "NICE!" floating text
- [ ] Giant orb approaching the core triggers a sustained warning vibration (if haptic enabled)
- [ ] 3 HP core damage can be blocked by shield power-up (reduced to 0 damage)

---

## 5. Progression & Unlock System

### 5.1 XP System

**US-PROG-01:** As a player, I want to earn experience points after each game so that I feel a sense of progress even when I don't beat my high score.

**XP sources:**

| Action | XP earned |
|--------|-----------|
| Complete a game (any mode) | 20 base XP |
| Per catch | 2 XP each |
| Per 5x combo | 5 XP bonus |
| Per 10x combo | 15 XP bonus |
| New high score | 25 XP bonus |
| Daily challenge completed | 30 XP bonus |
| Daily streak day (consecutive) | 10 XP * streak_length (capped at 70 XP for 7+ day streak) |
| Achievement unlocked | 10-50 XP (varies by achievement difficulty) |
| Survive 60s+ | 10 XP bonus |
| Survive 120s+ | 25 XP bonus |

**Level curve:**
- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 250 XP
- Level 4: 450 XP
- Level 5: 700 XP
- Level 6: 1,000 XP
- Level 7: 1,350 XP
- Level 8: 1,800 XP
- Level 9: 2,350 XP
- Level 10: 3,000 XP
- Level 11+: +750 XP per level

**Acceptance criteria:**
- [ ] XP is calculated and displayed on the game over screen
- [ ] XP bar animation shows the gain clearly (from old total to new total)
- [ ] Level up triggers a celebration overlay (particles, sound, "LEVEL UP!" text)
- [ ] Level and XP persist in localStorage
- [ ] XP cannot be lost or go negative

---

### 5.2 Level Unlocks

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
| 10 | Time Attack Mode unlocked; Arena theme: "Void" (minimal, high contrast black/white) |
| 12 | Deflector skin: "Lightning" |
| 15 | Arena theme: "Retro" (pixel art style, 8-bit colors) |
| 20 | Deflector skin: "Gold Plated"; Title: "Deflect Master" |

---

### 5.3 Achievements

**US-PROG-02:** As a player, I want achievements that recognize specific accomplishments so that I have varied goals to chase across multiple sessions.

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
| 23 | Trick Shot | "Triple-bounce an orb into a port (with Multi-Bounce)" | 3-bounce catch | 30 |
| 24 | Streak Master | "Maintain a 7-day daily challenge streak" | 7 consecutive daily completions | 40 |
| 25 | Dedicated | "Play 50 games total" | Cumulative 50 games played | 30 |

**Achievement popup behavior:**
- Achievement unlocks appear as a banner sliding in from the top during gameplay (non-blocking)
- Banner shows: achievement icon, name, and XP earned
- Banner auto-dismisses after 3 seconds
- During game over screen, all newly earned achievements are listed in sequence
- Sound effect: triumphant chime distinct from catch sounds

**Acceptance criteria:**
- [ ] Achievements persist in localStorage as a set of unlocked achievement IDs
- [ ] Each achievement can only be earned once
- [ ] Achievement checks run at end of each game (not real-time during play, to avoid performance impact), except the in-game banner which fires immediately on the triggering event
- [ ] Stats screen shows achievement gallery with locked/unlocked state
- [ ] Locked achievements show name and description but are grayed out

---

### 5.4 Unlockable Cosmetics

**US-PROG-03:** As a player, I want to customize my arena and deflector appearance so that the game feels personal and I have something to work toward.

**Arena Themes:**
Each theme changes the background, arena ring color, particle color palette, and core appearance.

| Theme | Description | Visual feel |
|-------|-------------|-------------|
| Default | Dark navy (#0a0a1a) with blue accents | Current look |
| Nebula | Deep purple (#120a20) with pink/purple star particles | Cosmic, dreamy |
| Ocean | Dark teal (#0a1a20) with flowing wave particle patterns | Calming, fluid |
| Sunset | Warm dark (#1a0f0a) with orange/red ambient particles | Intense, warm |
| Void | Pure black (#000000) with stark white ring, no ambient particles | Minimal, focused |
| Retro | Dark gray (#1a1a1a) with pixelated elements, limited color palette | Nostalgic, fun |

**Deflector Skins:**
Each skin changes the visual appearance of drawn deflectors.

| Skin | Description |
|------|-------------|
| Default | White line with white glow (current) |
| Neon Green | Green (#44ff88) line with green glow |
| Fire Trail | Orange-red gradient with flame particles along the line |
| Ice Crystal | Light blue (#88ccff) with crystalline end caps and frost particles |
| Lightning | Jagged line (slight random offsets) with electric spark particles |
| Gold Plated | Gold (#ffcc44) with sparkle particles |

**Orb Trail Effects:**
Changes the particle trail behind all orbs.

| Trail | Description |
|-------|-------------|
| Default | Standard colored dots (current) |
| Sparkle | Twinkling star-shaped particles |
| Rainbow | Trail shifts through rainbow colors regardless of orb color |

**Acceptance criteria:**
- [ ] Active cosmetics stored in localStorage
- [ ] Cosmetics are purely visual; they do not affect gameplay
- [ ] Selecting a cosmetic shows a preview before confirming
- [ ] Cosmetics menu accessible from Stats/Profile screen
- [ ] Locked cosmetics show unlock requirement ("Reach Level X")

---

### 5.5 Daily Rewards

**US-PROG-04:** As a player, I want to receive daily login rewards so that I have an extra incentive to open the game each day.

**Daily reward mechanic:**
- Triggered on first game completion each calendar day (not on app open -- must actually play)
- Rewards cycle on a 7-day rotation:

| Day | Reward |
|-----|--------|
| 1 | 25 bonus XP |
| 2 | 50 bonus XP |
| 3 | Random cosmetic hint ("You're close to unlocking Neon Green!") |
| 4 | 75 bonus XP |
| 5 | 100 bonus XP |
| 6 | Random cosmetic hint |
| 7 | 150 bonus XP + random unlockable if eligible |

**Acceptance criteria:**
- [ ] Daily reward triggers once per calendar day (local timezone)
- [ ] Reward popup appears on game over screen, after XP calculation
- [ ] 7-day cycle resets after day 7
- [ ] Missing a day resets the cycle to day 1
- [ ] "Random unlockable" on day 7 grants the next locked cosmetic in level order if the player has reached the required level, otherwise grants 200 XP

---

### 5.6 Milestone Celebrations

**US-PROG-05:** As a player, I want the game to celebrate my milestones so that I feel recognized for improving.

| Milestone | Trigger | Celebration |
|-----------|---------|-------------|
| First catch ever | First successful port catch in any game | "NICE!" large floating text + extra particles |
| First 5x combo | Reaching 5x combo for the first time ever | Screen border flashes gold for 1s |
| First 10x combo | Reaching 10x combo for the first time ever | "COMBO MASTER!" banner slides in |
| Score milestone (100, 500, 1000, 5000) | Crossing threshold during gameplay | Brief screen flash + milestone text |
| Survival milestone (30s, 60s, 90s, 120s) | Clock crossing threshold | Timer text pulses and changes color briefly |
| New high score | Score exceeds personal best during active game | "NEW RECORD!" floats up from score display |
| Perfect accuracy at 10+ catches | 10th consecutive catch with no misses | "PERFECT!" rainbow text |

**Acceptance criteria:**
- [ ] Milestone celebrations are non-disruptive (floating text / brief visual, no pausing)
- [ ] "First ever" milestones only fire once per player lifetime (tracked in localStorage)
- [ ] In-game milestones (score, survival) fire every game when crossed
- [ ] Reduced motion: milestones show as simple text without screen effects

---

## 6. Enhanced Game Modes

### 6.1 Challenge Mode

**US-MODE-01:** As a player, I want weekly challenge modes with unique modifiers so that each week brings a fresh twist on gameplay.

**Structure:**
- New challenge every Monday at 00:00 UTC
- Each challenge has a modifier that changes one rule
- Players can attempt challenges unlimited times during the week
- Best score is recorded and displayed

**Challenge modifier pool:**

| Modifier | Description | Rules change |
|----------|-------------|-------------|
| One Wall | "Only 1 deflector allowed at a time" | maxDeflectors = 1 |
| Speed Demon | "Everything moves 1.5x faster" | signalSpeed multiplied by 1.5 |
| Glass Cannon | "1 HP, huge score multiplier" | coreHP = 1, all points x3 |
| Color Blind | "All orbs are white; ports still colored" | Orb rendering ignores color (shows white) but underlying color still matters |
| Bomb Squad | "Bomb orbs only, all game long" | Only bomb orbs spawn (standard orbs disabled) |
| Mirror Mode | "Deflectors bounce orbs in the opposite direction" | Reflection angle is inverted |
| Tiny Arena | "Arena radius is 60% of normal" | arenaRadius multiplied by 0.6 |
| Rapid Fire | "Signals spawn 3x faster but move slower" | spawnInterval divided by 3, signalSpeed multiplied by 0.6 |

**Challenge select UI:**
- Shows this week's challenge with modifier name, description, and icon
- Best score for this challenge displayed below
- "PLAY" button to start
- Upcoming next week's challenge teaser (grayed out)

**Acceptance criteria:**
- [ ] Challenge rotation is deterministic (all players see the same challenge on the same week)
- [ ] Challenge seed can be derived from week number to make it predictable
- [ ] Players can attempt the same challenge multiple times; best score saved
- [ ] Challenge results are separate from Arcade high scores
- [ ] Modifier effects are applied on top of the standard difficulty ramp

---

### 6.2 Boss Rush Mode

**US-MODE-02:** As a player, I want a boss rush mode where I face increasingly difficult waves so that I feel like I am conquering levels.

**Structure:**
- 5 waves, each lasting 30 seconds
- Between waves: 5-second breather with HP restored to max and "WAVE X" title card
- Each wave has a specific pattern and escalating difficulty
- After wave 5, endless mode with continuously escalating difficulty

**Wave definitions:**

| Wave | Name | Description |
|------|------|-------------|
| 1 | "The Swarm" | 2 colors, fast spawn rate (0.8s interval), slow speed. Overwhelm with quantity. |
| 2 | "Speedsters" | 2 colors, normal spawn rate, 2x speed. Tests reaction time. |
| 3 | "The Split" | 3 colors, splitter orbs only. Every deflection creates 2 orbs. |
| 4 | "Ghost Protocol" | 3 colors, ghost orbs only. Must plan deflector placement carefully. |
| 5 | "The Gauntlet" | 4 colors, mix of all orb types, fast speed, fast spawn. Ultimate test. |
| 6+ | "Endless" | 4 colors, speed and spawn rate increase every 15s. No more HP restores. |

**Between-wave UI:**
- Dark overlay with "WAVE X COMPLETE" text
- Stats for the wave (catches, misses, combo)
- "NEXT WAVE" countdown timer (5 seconds)
- Brief power-up selection: player chooses 1 of 3 random power-ups to start the next wave with

**Acceptance criteria:**
- [ ] Waves transition smoothly with a brief pause (5s)
- [ ] HP is restored to max between waves 1-5 (not in endless)
- [ ] Each wave's orb type restriction is enforced (e.g., Wave 3 = splitter only)
- [ ] "WAVE X" title card displays at start of each wave with wave name
- [ ] Score is cumulative across all waves
- [ ] Power-up selection between waves is a simple 3-card UI (tap to select)
- [ ] Game over in any wave shows total waves completed + total score

---

### 6.3 Puzzle Mode

**US-MODE-03:** As a player, I want puzzle levels with pre-set scenarios so that I can exercise strategic thinking and replay for perfect solutions.

**Structure:**
- Series of 20+ hand-crafted puzzles, unlocked sequentially
- Each puzzle has a fixed starting state: specific orbs at specific positions with specific velocities
- Player has a limited number of deflectors to draw (e.g., "Place 2 walls to catch all 3 orbs")
- Time is frozen until the player taps "GO" -- then physics runs and orbs move
- Star rating: 1 star = all orbs caught, 2 stars = under time limit, 3 stars = minimum deflectors used

**Puzzle select UI:**
- Grid of numbered puzzle cards (4 columns)
- Completed puzzles show star count (1-3 stars)
- Locked puzzles show padlock
- Completing puzzle N unlocks puzzle N+1

**Puzzle gameplay:**
1. Puzzle loads: orbs are frozen in place, ports are visible, core is visible
2. Player draws deflectors (limited count shown in HUD: "Walls: 2/2")
3. Player taps "GO" button to start physics
4. Orbs move and interact with deflectors and ports
5. Result: Success (all orbs caught) or Failure (any orb hits core or escapes)
6. On success: star rating + "NEXT PUZZLE" button
7. On failure: "RETRY" button (instant reset)

**Acceptance criteria:**
- [ ] Puzzle definitions stored as JSON data (positions, velocities, colors, deflector limit)
- [ ] Deflectors placed during puzzle planning phase do not decay until "GO" is pressed
- [ ] After "GO", deflectors decay normally (3s lifetime)
- [ ] Star rating criteria displayed before the puzzle starts
- [ ] Player can clear placed deflectors before pressing "GO" (undo last, or clear all)
- [ ] Puzzle progress (completion + stars) persists in localStorage

---

### 6.4 Time Attack Mode

**US-MODE-04:** As a player, I want a time attack mode where I race to reach a target score so that I can test my speed and efficiency.

**Structure:**
- Target score: 500 points
- Timer counts UP from 0
- All 4 colors active from the start (no ramp-up period)
- Orbs spawn at medium-fast rate throughout
- Game ends when target score is reached
- High score = fastest time to reach target

**HUD changes:**
- Large timer in center top (replaces score display position)
- Score shows as progress bar: "340 / 500" with fill bar
- Target score threshold has a golden marker on the bar

**Difficulty:**
- Speed and spawn rate are fixed (no ramp) at the 45-second Arcade difficulty level
- All orb types are active from the start
- Power-ups spawn at normal rate

**Acceptance criteria:**
- [ ] Timer precision to 1 decimal place (e.g., "42.3s")
- [ ] When target score reached, timer freezes and "COMPLETE!" celebration plays
- [ ] Game over screen shows time as the primary metric (not score)
- [ ] Best time saved separately from Arcade high score
- [ ] If core HP reaches 0 before target score: game over shows "FAILED - reached [score]/500"

---

## 7. Social Features

### 7.1 Share System Redesign

**US-SOC-01:** As a player, I want to share my results in a visually appealing format so that my friends are impressed and want to try the game.

**Share card redesign:**
- Keep the existing text-based emoji card (it works great for Twitter/text)
- Add an image-based share card option:
  - Canvas-rendered image (400x600px)
  - Dark background matching game theme
  - "DEFLECT" title at top
  - Mode and date
  - Score in large bold text
  - Stats (survived, combo, accuracy) in a clean layout
  - Color performance blocks (existing emoji pattern, but rendered as colored squares)
  - QR code or short URL at bottom
  - "Challenge me!" call-to-action text

**Share flow:**
1. Player taps "SHARE" on game over
2. Bottom sheet appears with two options: "Copy Text" and "Share Image"
3. "Copy Text" = existing clipboard behavior
4. "Share Image" = generates canvas image, uses Web Share API if available, falls back to download

**Acceptance criteria:**
- [ ] Text share still works exactly as today (no regression)
- [ ] Image share generates a clean, correctly-sized image
- [ ] Image share uses navigator.share() with file blob where supported
- [ ] Fallback: image downloads as PNG if share API not available
- [ ] Share sheet has a "Cancel" tap zone (tap outside to dismiss)

---

### 7.2 Daily Leaderboard

**US-SOC-02:** As a player, I want to see how my daily challenge score compares to others so that I feel competitive motivation.

**Implementation approach (no accounts needed):**
- Anonymous leaderboard using a lightweight API endpoint
- Player submits: score, accuracy, max combo, survival time + a hash of the daily seed to prevent fake submissions
- Player receives: their rank, top 10 scores, and score distribution histogram
- No personal data collected; entries are ephemeral (deleted after 48 hours)

**Leaderboard UI (on Daily Challenge Hub):**
- "TODAY'S LEADERBOARD" section below the challenge card
- Top 10 list: Rank | Score | Combo | Accuracy
- Player's own rank highlighted if they've played today
- Score distribution bar chart showing where the player falls (percentile)

**Acceptance criteria:**
- [ ] Leaderboard data fetched asynchronously; UI shows "Loading..." spinner
- [ ] If API is unreachable, leaderboard section shows "Offline" and is skippable
- [ ] Submissions include a simple integrity hash (not foolproof, but deters casual cheating)
- [ ] Leaderboard refreshes when the Daily Hub screen is opened
- [ ] No PII is transmitted or stored

**Note:** This feature requires a backend service. If the team decides to ship without a backend, replace the live leaderboard with a local "personal daily history" comparison (compare today's score to your last 7 daily scores).

---

### 7.3 Challenge-a-Friend

**US-SOC-03:** As a player, I want to send a friend a link that recreates my exact game so they can try to beat my score.

**Mechanics:**
- After any game, player can tap "CHALLENGE A FRIEND"
- System generates a URL with encoded parameters: RNG seed, mode, difficulty settings
- Friend opens URL, sees a "CHALLENGE FROM A FRIEND" screen showing the challenger's score
- Friend plays the same seeded game
- After the friend finishes, results screen shows side-by-side comparison: "You: 1,240 vs Friend: 980"

**URL structure:**
- `https://[domain]/?c=[base64-encoded-params]`
- Params: `{seed, mode, challengerScore, challengerCombo, challengerAccuracy}`

**Challenge screen (when opening a challenge link):**
- "CHALLENGE RECEIVED" header
- Challenger's score displayed prominently
- "CAN YOU BEAT IT?" call-to-action
- "PLAY" button starts the seeded game
- "SKIP" text link goes to normal main menu

**Results comparison (on game over after a challenge):**
- Side-by-side layout:
  - Left column: "THEM" + challenger's score, combo, accuracy
  - Right column: "YOU" + your score, combo, accuracy
  - Winner indicated with crown icon and "YOU WIN!" or "THEY WIN!" text
- "REMATCH" button (regenerates with a new seed and your score as the new target)
- "SHARE RESULT" button (sends a comparison card)

**Acceptance criteria:**
- [ ] Challenge URL is short enough to share via text message (under 200 characters)
- [ ] Challenge parameters are base64 encoded, not plaintext
- [ ] Opening a challenge URL on the same device still works (play against yourself)
- [ ] Challenge seed overrides the normal RNG
- [ ] If challenge URL is malformed, gracefully fall back to normal main menu
- [ ] Results comparison screen clearly shows who won

---

### 7.4 Replay System

**US-SOC-04:** As a player, I want to watch a short replay of my best moments so that I can relive and share highlight plays.

**Implementation (MVP):**
- Record the last 5 seconds of gameplay inputs (swipe start/end positions + timestamps)
- On game over, if the game had a notable moment (10x+ combo, near-miss save, bomb defusal), offer "WATCH REPLAY"
- Replay plays back the recorded inputs against the seeded game state
- Replay is rendered at 0.5x speed with a cinematic black letterbox bars

**Notable moment detection:**
- Combo reached 10x+ at any point
- Near-miss event followed by a catch within 2 seconds
- Bomb orb deflected with < 1 second to spare
- 3+ catches within 2 seconds

**Acceptance criteria:**
- [ ] Replay button only appears when a notable moment was detected
- [ ] Replay plays back smoothly at half speed
- [ ] Replay ends with a freeze frame on the highlight moment
- [ ] Player can tap to dismiss replay at any time
- [ ] Replay data is ephemeral (not saved between sessions -- it is for immediate post-game viewing)

**Stretch goal:** Allow exporting the replay as a short video/GIF via canvas recording APIs.

---

## 8. UX Flow Diagrams

### 8.1 First-Time Player Journey

```
[URL Opened]
     |
     v
[Splash Screen] -- auto after load -->
     |
     v
[Main Menu]
  - No streak badge
  - No high score
  - Three mode cards visible
     |
     | (player taps ARCADE)
     v
[Arena Zoom-In Transition, 400ms]
     |
     v
[Tutorial Phase 1]
  - Slow signal approaches from top
  - Ghost swipe animation shows how to draw a deflector
  - "SWIPE TO DEFLECT!" hint pulses
     |
     | (player swipes)
     v
[Tutorial Phase 2]
  - Signal bounces off deflector
  - Signal enters port (or misses + timeout)
  - "NICE!" or auto-complete after 3s
     |
     v
[Normal Gameplay Begins]
  - 1 color, slow speed
  - Difficulty ramps over 90s
  - First power-up at ~20s
  - New orb types introduced per schedule
     |
     | (core HP reaches 0)
     v
[Game Over Screen]
  - "CORE BREACH" title
  - Score with count-up animation
  - XP earned bar (first game = ~40-80 XP)
  - "Getting Started" achievement popup
  - Coaching tip based on performance
  - RETRY | SHARE | MENU buttons
     |
     +-- RETRY --> [Arena Zoom-In] --> [Gameplay]
     |
     +-- MENU --> [Main Menu]
     |              - High score now visible
     |              - "Getting Started" achievement badge
     |
     +-- SHARE --> [Share bottom sheet] --> [Copy/Share] --> [Back to Game Over]
```

### 8.2 Returning Player Journey

```
[URL Opened]
     |
     v
[Splash Screen] -- auto -->
     |
     v
[Main Menu]
  - Streak badge: "5-day streak!"
  - High score: "BEST: 2,340"
  - "NEW" badge on Daily Challenge card
  - Any newly unlocked mode highlighted
     |
     | (player taps DAILY)
     v
[Daily Challenge Hub]
  - Today's challenge card with modifier
  - Streak calendar strip
  - Past 7 days results
  - "PLAY" button
     |
     | (player taps PLAY)
     v
[Arena Zoom-In Transition]
     |
     v
[Daily Challenge Gameplay]
  - Seeded RNG, same as everyone
  - Power-ups spawn deterministically
  - Normal difficulty ramp
     |
     | (game over)
     v
[Game Over Screen]
  - Score, XP earned
  - Daily streak incremented: "+1 day streak!"
  - Daily reward popup (Day 3: cosmetic hint)
  - Achievement popups if any
  - RETRY (grayed: "1 attempt per day") | SHARE | MENU
     |
     +-- SHARE --> [Share card with daily-specific format]
     |
     +-- MENU --> [Main Menu]
                    - Daily card now shows "COMPLETED" badge
                    - Updated high score
```

### 8.3 Achievement Unlock Flow

```
[During Gameplay]
     |
     | (achievement criteria met, e.g., 10x combo)
     v
[Achievement Banner Slides In From Top]
  - Icon + "COMBO KING" + "+25 XP"
  - Non-blocking (gameplay continues)
  - Auto-dismisses after 3s
     |
     v
[Gameplay Continues Normally]
     |
     | (game over)
     v
[Game Over Screen]
     |
     v
[After score + XP display (1200ms delay)]
     |
     v
[Achievement Card #1 Slides In From Right]
  - Full achievement details
  - "COMBO KING - Reach a 10x combo"
  - XP added to XP bar animation
  - Holds for 1.5s, then slides out
     |
     v
[Achievement Card #2 Slides In] (if multiple unlocked)
  - Same pattern
  - 1.5s display
     |
     v
[Normal Game Over Buttons Become Active]
```

### 8.4 Power-Up Interaction Flow During Gameplay

```
[Signal Spawn Event]
     |
     | (15% chance after 20s, max 1 on screen)
     v
[Power-Up Orb Spawns]
  - White glowing orb with colored icon inside
  - Moves toward center at 40% signal speed
  - Sparkle particle trail
  - Despawns after 8s if uncollected
     |
     +-- Player does NOT collect --> [Orb fades out, despawns]
     |
     +-- Player swipes deflector through power-up orb:
          |
          v
     [Power-Up Collected]
       - Collection burst particles (white + power-up color)
       - "TIME SLOW!" (or power-up name) floating text
       - Audio: distinctive chime per power-up type
          |
          v
     [Power-Up Active]
       - Icon appears in top-center HUD
       - Circular timer ring around icon depletes over duration
       - Power-up effects apply to gameplay
          |
          +-- Duration expires:
          |     - Icon fades out
          |     - Effects revert (with 0.5s ease for time slow)
          |     - Subtle "power down" audio cue
          |
          +-- New power-up collected before expiry:
                - Old power-up immediately ends
                - New power-up replaces it
                - "REPLACED" brief indicator
```

### 8.5 Level Up Flow

```
[Game Over Screen]
     |
     v
[XP Bar Animation]
  - Bar fills from pre-game XP toward post-game XP
  - If XP crosses level threshold:
     |
     v
[Level Up Overlay] (interrupts normal game over flow)
  - Dark overlay fades in (200ms)
  - "LEVEL UP!" large gold text with pulse animation
  - "LEVEL 5" with particle burst around the number
  - Unlock list appears below:
    "UNLOCKED: Boss Rush Mode"
    "UNLOCKED: Fire Trail Deflector Skin"
  - Each unlock item slides in from left with a 300ms stagger
  - "TAP TO CONTINUE" at bottom
     |
     | (player taps)
     v
[Overlay Fades Out (200ms)]
     |
     v
[Game Over Screen Resumes]
  - XP bar now shows new level baseline
  - Achievement popups continue if any remain
```

---

## Appendix A: localStorage Schema

All player data is stored in localStorage. No server-side accounts.

```
deflect_high        : number        // Arcade high score
deflect_played      : "1"           // Has completed tutorial
deflect_daily       : {seed, score} // Today's daily best
deflect_xp          : number        // Total XP earned
deflect_level       : number        // Current level
deflect_achievements: number[]      // Array of unlocked achievement IDs
deflect_stats       : {             // Aggregate stats
  gamesPlayed: number,
  totalPlayTime: number,          // seconds
  totalCatches: number,
  totalMisses: number,
  bestCombo: number,
  bestSurvival: number,           // seconds
  colorCatches: {red, blue, green, yellow},
  colorMisses: {red, blue, green, yellow},
  recentGames: [{mode, score, duration, combo, accuracy, date}]  // last 10
}
deflect_streak      : {current, best, lastDate}
deflect_cosmetics   : {arena, deflector, trail}  // active cosmetic selections
deflect_unlocks     : string[]      // unlocked cosmetic IDs
deflect_settings    : {sfx, music, musicVol, sfxVol, reducedMotion, haptic, showFps}
deflect_puzzles     : {[id]: stars} // puzzle completion + star ratings
deflect_challenges  : {[weekId]: bestScore} // weekly challenge best scores
deflect_daily_reward: {day, lastClaimDate} // daily reward cycle position
deflect_milestones  : string[]      // first-ever milestones that have fired
```

---

## Appendix B: Priority Tiers

**Tier 1 -- Ship First (Core Retention Loop):**
- Redesigned game over screen with RETRY button (2.7)
- XP system + levels (5.1, 5.2)
- 10 starter achievements (5.3, subset)
- Settings screen (2.4)
- Stats screen (2.5)
- Daily streak tracking (2.6 partial)

**Tier 2 -- Second Release (Depth):**
- Power-up system (all 6 power-ups) (3.x)
- Gold, Rainbow, and Splitter orb types (4.2.1, 4.2.2, 4.2.3)
- Full achievement list (5.3)
- Cosmetic unlocks (5.4)
- Share image card (7.1)

**Tier 3 -- Third Release (Variety):**
- Ghost and Bomb orb types (4.2.4, 4.2.5)
- Giant orb (4.2.6)
- Challenge Mode (6.1)
- Boss Rush Mode (6.2)
- Challenge-a-Friend (7.3)

**Tier 4 -- Polish (Engagement):**
- Puzzle Mode (6.3)
- Time Attack Mode (6.4)
- Daily Leaderboard (7.2)
- Replay System (7.4)
- Daily rewards (5.5)

---

*Document version: 1.0*
*Prepared for: DEFLECT development team*
*Covers: Full product expansion from prototype to retainable mobile-first web game*
