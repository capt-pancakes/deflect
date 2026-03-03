# Technical Review: DEFLECT v1.2 Work Items

**Reviewer:** Morgan (Technical Lead)
**Date:** 2026-03-02
**Scope:** All 41 tickets in `/docs/v1.2/`, cross-referenced against source code in `/src/` and source documents in `/docs/`

---

## Executive Summary

The v1.2 ticket set is ambitious but largely well-structured. The current codebase is a clean ~1,800-line TypeScript canvas game with good separation of concerns (Game, Renderer, CollisionSystem, ParticleSystem, InputHandler, etc.). The architecture is sound for what it does today but will need significant foundational work before the v1.2 features can land without creating a maintenance disaster.

**Key findings:**

1. **The codebase has no screen/state management system.** The current `GameState` type is `'menu' | 'playing' | 'gameover'` -- three values. Tickets 001-008 require at least 8 distinct screens with animated transitions. This is the single biggest architectural gap and must be addressed first.

2. **The `Game` class is a 1,160-line god object.** It owns entities, state, input handling, collision dispatch, scoring, tutorial logic, difficulty, music, and screen-specific update/tap logic. Adding 7 power-ups, 6 orb types, 4 new modes, achievements, XP, and cosmetics to this class will make it unmaintainable. A refactor into smaller systems is prerequisite work.

3. **The `Signal` type has no extensibility for new orb types.** It is a flat interface with `color: SignalColor` where `SignalColor = 'red' | 'blue' | 'green' | 'yellow'`. Gold, rainbow, ghost, bomb, giant, and splitter orbs all need different behaviors, rendering, collision rules, and point values. This requires either a discriminated union or a component/strategy pattern.

4. **localStorage usage is ad-hoc.** Currently scattered across `ScoreManager.loadHighScores()`, `audio.loadMuteState()`, `PwaPrompt`, etc. with no unified read/write layer. Ticket 041 (localStorage Schema) correctly identifies this but is listed as a peer of other T1 tickets. It should be implemented first.

5. **Bundle size risk is real.** The product vision calls for staying under 200KB. The current game is lean (~15KB JS minified + one MP3 song). Adding 4 music tracks (037), 20+ puzzle definitions (031), cosmetic theme assets, and new sound effects could blow past the budget quickly. Asset loading strategy needs planning.

6. **The rendering architecture is monolithic.** `Renderer.render()` is a single method that dispatches to private methods for menu, game, and game-over. New screens (Settings, Stats, Daily Hub, Puzzle Select, etc.) will each need rendering logic. The renderer needs to become screen-aware or be decomposed.

**Overall verdict:** The tickets are well-written from a product perspective. About 30 of 41 are implementable as-written. The remaining 11 need technical refinements, complexity acknowledgment, or prerequisite work. The recommended approach is to land 3-4 foundational refactoring tickets before starting any feature work.

---

## Architecture Recommendations (Pre-Feature Work)

These are not tickets in the current set but are prerequisites that should be created and completed first.

### A1. Screen Manager / State Machine

**Why:** The current architecture uses a string `state` field and large `if/else` blocks in `update()`, `render()`, and `updateMenu()` / `updateGameOver()`. Tickets 001-008 require 8+ distinct screens with enter/exit transitions, layered overlays (game over on top of game, achievement popup on top of game over), and non-trivial navigation history.

**Recommendation:** Create a `ScreenManager` class that owns a stack of active screens. Each screen implements `enter()`, `exit()`, `update(dt)`, `render(ctx)`, and `handleInput(input)`. The transition system (008) becomes a property of screen transitions, not a standalone system.

**Impact on existing code:**
- `Game.state` becomes the active screen ID
- `Game.updateMenu()`, `Game.updateGameOver()` move to `MenuScreen`, `GameOverScreen`
- `Renderer.renderMenu()`, `Renderer.renderGameOver()` move to their respective screen classes
- The `RenderableGameState` interface (renderer.ts line 82-153) becomes unnecessary -- each screen renders itself

**Files affected:** `game.ts`, `renderer.ts`, `main.ts`

### A2. Entity Component / Orb Type System Refactor

**Why:** The `Signal` interface (types.ts line 6-18) is a flat struct with no mechanism for orb-type-specific behavior. Tickets 017-022 need orbs with: different speeds, different point multipliers, phase-through-deflector logic, split-on-deflect, any-port-matching, accelerating pulse animations, and variable core damage.

**Recommendation:** Add an `orbType` discriminated union field to `Signal`:
```typescript
type OrbType = 'standard' | 'gold' | 'rainbow' | 'splitter' | 'ghost' | 'bomb' | 'giant';

interface Signal {
  // ... existing fields
  orbType: OrbType;
  bounceCount: number;       // for multi-bounce power-up and ghost tracking
  pointMultiplier: number;   // 1x standard, 3x gold, 5x giant, etc.
  damageOnCoreHit: number;   // 1 standard, 2 bomb, 3 giant
  matchesAnyPort: boolean;   // true for rainbow, bomb
  phaseThrough: number;      // ghost: 1 = phases through first deflector
}
```

Push behavior differences into the `CollisionSystem` and a new `OrbBehavior` lookup rather than `if/else` chains in `Game`.

**Files affected:** `types.ts`, `collision.ts`, `game.ts` (spawnSignal, handleCollisionEvent), `renderer.ts` (renderSignals)

### A3. Game Class Decomposition

**Why:** `Game` is currently responsible for: entity management, game loop, input handling, collision dispatch, scoring, tutorial orchestration, difficulty ramping, music management, screen-specific UI logic, and more. Adding power-ups, new orb types, XP, achievements, cosmetics, and 4 new game modes to this class will make it 5,000+ lines.

**Recommendation:** Extract into focused modules:
- `GameSession` -- active gameplay state (signals, deflectors, ports, elapsed time)
- `PowerUpManager` -- power-up spawning, activation, timer, HUD state
- `AchievementTracker` -- checks conditions, fires events
- `XPCalculator` -- computes XP at game end
- `ProgressionManager` -- owns level, unlocks, milestones

The `Game` class becomes a thin coordinator that delegates to these systems.

### A4. Unified Persistence Layer

**Why:** Ticket 041 defines the schema, but the current code has localStorage reads/writes scattered across `ScoreManager` (6 keys), `audio` (1 key), `PwaPrompt` (1 key), `TutorialManager` (read via `Game.completeTutorial`, 1 key). The new schema has 14+ keys with complex nested JSON. Without a unified layer, every feature will independently implement serialization, defaults, and migration.

**Recommendation:** Create a `PlayerData` singleton class that:
- Loads all `deflect_*` keys on startup
- Provides typed getters/setters for each data field
- Handles defaults for missing keys
- Provides `save()` that batches writes
- Provides `reset()` for the Settings reset feature
- Includes a schema version for migration

Implement this as the first step of ticket 041, before any other T1 tickets that read/write player data.

---

## Per-Ticket Technical Notes

Only tickets that need changes or have notable technical concerns are listed. Tickets not mentioned here look good as written.

### 001 — Splash / Loading Screen

**Concern:** AC says "displays within 200ms of page load." The current `main.ts` already shows a loading div and hides it on first `requestAnimationFrame`. The splash is currently implemented in HTML (`index.html`), not canvas. The ticket implies a canvas-rendered splash, but for 200ms display speed, the splash should remain an HTML element that the canvas fades over -- canvas initialization itself takes time.

**Recommendation:** Clarify that the splash is an HTML overlay (not canvas-rendered), and the transition TO the canvas-rendered menu is what ticket 008 handles. This is a 1-2 day ticket, not a 1-week ticket.

**Missing detail:** What constitutes "load complete"? The current game has near-zero async loading (no font loading, localStorage is sync, AudioContext creation is instant). The progress bar has nothing meaningful to track unless we add asset preloading (e.g., song MP3 files). The progress bar may be cosmetic-only.

### 002 — Main Menu Redesign

**Concern (complexity):** This ticket conflates several things: layout redesign, animation system (float, glow pulse, press animations, stagger), progressive disclosure (first-time vs returning), streak badge rendering, "NEW" badge system, and removal of the tap-anywhere-to-start behavior.

**Recommendation:** Break this into sub-tasks:
1. Layout and navigation (move buttons, add stats/settings nav)
2. Animation polish (float, glow, stagger, press)
3. Progressive disclosure states (ties to 040 FTUE)

**Technical note:** The current `Game.updateMenu()` handles tap detection with manual rectangle hit-testing (game.ts lines 599-664). The menu redesign needs to move toward a lightweight UI component system (buttons with hit regions, states, and render callbacks) rather than growing the `if` chain.

**Tech debt risk:** If menu buttons are still hard-coded rectangles in `updateMenu()` after this ticket, every new button or screen element will require more manual hit-test math. Consider extracting a `Button` class with `{ x, y, w, h, label, onTap, render }`.

### 003 — Mode Select Cards

**Concern:** AC says "vertically scrollable." The current game renders everything in a single canvas with no scroll support. Canvas does not have native scroll. Implementing scrollable content in canvas requires: touch-based scroll tracking, velocity/momentum physics, scroll bounds clamping, and partial rendering of off-screen cards.

**Recommendation:** Either:
- (a) Implement a simple canvas scroll container (moderate complexity, ~200 lines), or
- (b) Keep the mode list non-scrollable and paginate with left/right swipe or a "More modes" expander. Since only the first 3 modes are always visible and the others unlock progressively at levels 3, 5, 8, 10, most players won't see more than 3-4 modes for weeks.

Option (b) is simpler and avoids the canvas scroll problem. If the team goes with (a), this ticket's estimate should include the scroll container implementation as a significant sub-task.

### 004 — Settings Screen

**Concern (volume sliders):** Canvas does not have native slider/range input controls. Implementing a slider with: track rendering, thumb rendering, drag handling, value snapping, and touch precision in canvas is a non-trivial UI component (~150 lines per slider).

**Recommendation:** Either:
- (a) Use HTML overlays for the settings screen (simpler, native controls, scrollable, accessible), or
- (b) Build canvas slider components (more work but maintains the single-canvas architecture).

Option (a) is strongly recommended. Settings is a form-heavy screen that benefits from native HTML inputs, accessibility features (screen readers), and scroll. It can be styled to match the game aesthetic with CSS.

**Missing detail:** The AC says "Music Volume slider" and "SFX Volume slider" but the current audio system has no volume control -- `audio.ts` uses a fixed `volume` parameter in `playTone()` (default 0.15), and `SongPlayer` uses an `HTMLAudioElement` with no volume property set. Both systems need volume support added.

### 005 — Stats / Profile Screen

**Concern (per-color catch stats):** The current `ScoreManager` tracks `colorMisses` but does NOT track `colorCatches`. There is no per-color catch counter. The stats screen requires "catch rate per color (catches / total signals of that color)" but "total signals of that color" is also not tracked.

**Missing detail:** The `deflect_stats` schema needs `colorCatches` added. The `onCatch()` handler in `game.ts` needs to increment a color-specific catch counter. The spawn system needs to track total signals spawned per color for the denominator.

**Recommendation:** Add `colorCatches: Partial<Record<SignalColor, number>>` and `colorSpawns: Partial<Record<SignalColor, number>>` to the stats tracking. This is a prerequisite for this ticket.

### 006 — Daily Challenge Hub

**Concern (challenge modifier):** The AC says "Challenge modifier description is visible before playing" but the current daily challenge has no modifier system. The daily mode in `game.ts` line 318-323 just uses a seeded RNG with standard arcade rules. The product vision describes modifiers like "SPEED DEMON", "MINIMALIST", etc., but there is no modifier engine.

**Recommendation:** Either:
- (a) Ship the Daily Hub without modifiers initially (just show the date and seed pattern), or
- (b) Create a modifier system (a config override applied to `GameConfig` based on a seed-derived modifier selection).

If (b), it needs its own ticket. The modifier engine is a significant system: defining 8+ modifiers, seed-based selection, config override application, modifier-aware rendering, and testing. This is easily a 3-5 day task on its own.

**Missing dependency:** Should depend on a "Daily Modifier System" ticket if modifiers are in scope.

### 007 — Game Over Screen Redesign

**Concern (death sequence):** AC says "500ms slow-mo where the core cracks and shatters before overlay." The current core rendering (renderer.ts lines 730-815) draws a simple circle with HP pips. A "crack and shatter" effect requires: crack line rendering, fragment generation, physics-driven fragment animation, and screen shake. This is a polish task that could take 1-2 days by itself.

**Recommendation:** Split the death sequence into a separate polish sub-task. The game over screen layout, XP bar, coaching tips, and achievement popups are the core value and should ship independently of the death animation.

**Concern (staggered element animation):** The stagger timing spec (title at 0ms, score at 200ms, XP at 400ms, stats at 600ms, buttons at 800ms, achievements at 1200ms) requires a timeline/sequencing system. This is the same system needed for screen transitions (008). Implement it once in the transition system.

### 008 — Screen Transitions

**Concern (architecture):** This ticket defines transitions but not HOW they are implemented. The current architecture has no concept of screen objects with enter/exit lifecycle hooks. Without the Screen Manager (see A1 above), transitions become ad-hoc `if (transitioning) { ... }` blocks scattered through the game loop.

**Recommendation:** This ticket should be reformulated as "Screen Manager + Transition System." It is the architectural foundation for all menu tickets. Implement it first among T1 tickets.

**Missing detail:** The AC says "transitions are interruptible (rapid tapping doesn't queue multiple transitions)" -- this implies a state machine that blocks input during transitions. Specify whether input is blocked during ALL transitions or just some.

### 009 — Power-Up Core System

**Concern (collection mechanic):** AC says "Collection triggered by deflector intersection with power-up orb." The current `CollisionSystem.checkCollisions()` only checks signal-deflector collisions. Power-up orbs need to be added to the collision loop, but they behave differently (no bounce, consumed on contact, different visual feedback).

**Recommendation:** Add power-ups as a separate entity array (`powerUps: PowerUp[]`) in `GameSession`, not mixed into `signals[]`. The collision system gets a new check: `checkPowerUpCollisions(powerUps, deflectors)` that returns `PowerUpCollected` events. This keeps the signal collision path clean.

**Missing detail:** The AC says power-ups "move toward center at 40% of current signal speed" but doesn't specify what happens if a power-up reaches the core. Does it despawn? Pass through? Specify behavior.

**Performance note:** Power-up sparkle trails add to particle count. With the existing MAX_PARTICLES = 500 cap (particles.ts line 4), heavy particle effects during active gameplay + power-up trails could hit the cap, causing trail particles to stop spawning. Consider raising the cap or prioritizing particle types.

### 010 — Time Slow Power-Up

**Concern (interaction with existing slow-mo):** The game already has two slow-mo systems: near-miss slow-mo (`timeScaleTarget = 0.3`, game.ts line 1039) and tutorial slow-mo (`timeScaleTarget = 0.1-0.7`). This power-up adds a third. Need to define precedence: if Time Slow is active and a near-miss triggers, which wins? The lower value (more dramatic) should take precedence, with Time Slow resuming after the near-miss snap-back.

**Missing detail:** AC says "signals slow to 40%" but current slow-mo is implemented via `timeScale` which affects the entire `scaledDt` (game.ts line 420-421). Time Slow needs to slow signals WITHOUT slowing deflector decay, particle systems, or animation timers. This means Time Slow cannot use the existing `timeScale` mechanism -- it needs a separate `signalSpeedMultiplier` that only applies in `updateSignals()`.

**Recommendation:** Add a `signalSpeedMultiplier` field to `GameSession` (default 1.0). Time Slow sets it to 0.4. `updateSignals()` multiplies velocity by this factor. This cleanly separates signal speed from global time scale.

### 012 — Multi-Bounce Power-Up

**Concern (bounce tracking):** AC says "The signal's bounce tracking uses a count (not just boolean)." Currently `Signal.deflected` is a `boolean` (types.ts line 16). Changing it to a number (`bounceCount: number`) affects:
- Port magnetism check (game.ts line 853): `if (s.deflected &&` -> `if (s.bounceCount > 0 &&`
- Port collision check (collision.ts line 223): `if (signal.deflected &&` -> `if (signal.bounceCount > 0 &&`
- All places that set `signal.deflected = true` -> `signal.bounceCount++`

**Recommendation:** This is a straightforward refactor but touches collision.ts, game.ts, and types.ts. Include it in the A2 Entity refactor or in ticket 009 as prerequisite work.

### 013 — Magnet Power-Up

**Technical note:** The existing port magnetism logic is in `game.ts` lines 852-873. The Magnet power-up just needs to override `PORT_MAGNETISM` (currently 0.25, boost to 1.0) and the angular check threshold (currently 0.8, boost to full range). This is one of the simpler power-ups to implement if the power-up framework (009) is in place.

### 016 — Orb Type System & Spawn Schedule

**Concern (extensibility claim):** AC says "adding a new orb type requires only a schedule entry and an orb implementation." This is an aspirational statement, not an implementation detail. To make it true, the spawn system needs: a registry of orb types, a weighted random selector that reads from a schedule config, and a factory function that creates signals with the correct properties per type.

**Recommendation:** Define a `OrbTypeConfig` interface:
```typescript
interface OrbTypeConfig {
  type: OrbType;
  speedMultiplier: number;
  radiusMultiplier: number;
  pointMultiplier: number;
  coreDamage: number;
  matchesAnyPort: boolean;
  // ... etc
}
```

The spawn schedule becomes a `Map<number, { type: OrbType, weight: number }[]>` keyed by time bracket. The `spawnSignal()` function reads from this config.

### 019 — Splitter Orb

**Concern (child orb creation during collision):** The splitter orb splits when it hits a deflector. Currently `checkDeflectorCollision()` mutates the signal in-place and returns a boolean. For splitter, it needs to create 2 NEW signals during the collision check. This means the collision system needs a way to return "new entities to add" alongside collision events.

**Recommendation:** Change `CollisionEvent` to include an optional `spawnSignals?: Signal[]` field, or add a `SplitEvent` type to the union:
```typescript
interface SplitEvent {
  type: 'split';
  original: Signal;
  children: Signal[];
}
```

The game loop processes split events by pushing children into `signals[]`. This avoids mutating the signal array during iteration.

### 020 — Ghost Orb

**Concern:** The ghost orb "passes through first deflector" -- this means the deflector collision check must be aware of the orb's phase-through counter. Currently `checkDeflectorCollision()` does not differentiate by orb type. The ghost orb needs: skip the first deflector collision (increment a counter), and on the second collision, behave normally.

**Recommendation:** Add a `phaseThrough: number` field to `Signal`. In `checkDeflectorCollision()`, if `phaseThrough > 0`, decrement it, play the ripple effect, and return `false` (no collision). This is clean and minimal.

### 022 — Giant Orb

**Concern (deflector length check):** AC says "requires deflector at least 60% of arena radius length; shorter deflectors are ignored." The collision system currently does not know the arena radius -- it receives it as a parameter for port checks but not for deflector checks. The deflector length check needs access to `arenaRadius`.

**Missing detail:** AC says "short deflectors pass through" -- does this mean the deflector-signal distance check passes but the bounce is suppressed? Or does the collision not register at all? The "TOO SMALL" floating text implies the collision is detected but the bounce is rejected. This needs a new collision event type or a flag on the existing `DeflectorHit`.

### 023 — XP System

**Concern (XP source calculation):** Several XP sources depend on systems that don't exist yet:
- "Daily challenge completed: 30 XP bonus" -- requires the one-attempt-per-day enforcement from ticket 006
- "Daily streak day: 10 XP * streak_length" -- requires streak tracking from 041
- "Achievement unlocked: 10-50 XP" -- requires achievements from 025

**Recommendation:** Implement XP with the base sources first (game completion, catches, combos, high score, survival time). Add daily/streak/achievement XP as those systems come online. The XP calculator should be designed to accept an optional list of bonus sources.

### 025 — Achievements

**Concern (in-game banner during gameplay):** AC says "In-game banner is non-blocking (gameplay continues underneath)." This requires rendering a UI overlay on top of the game canvas during active play without interfering with input or game logic. The current renderer has no overlay/layer system.

**Recommendation:** Add a simple notification queue to the renderer: `notifications: { text, icon, duration, elapsed }[]`. During `renderGame()`, after all game elements, render any active notifications as floating banners at the top of the screen. This is lighter-weight than a full overlay system.

**Concern (achievement checks mid-game):** Some achievements fire mid-game ("reach 5x combo"). This means achievement checking needs to happen during `onCatch()`, `onCoreDamage()`, etc. -- not just at game over. The achievement system needs event hooks into the game loop.

**Recommendation:** Use an event bus or direct method calls: `achievementTracker.onCatch(combo, score)`, `achievementTracker.onGameOver(stats)`. The tracker returns any newly unlocked achievements for banner display.

### 026 — Cosmetics

**Concern (rendering architecture):** Each arena theme changes "background, arena ring color, particle color palette, and core appearance." Each deflector skin changes deflector rendering. Each trail changes particle rendering. Currently these are all hard-coded values in `renderer.ts` (background: line 194, `#0a0a1a`; arena ring: lines 319-344; deflectors: lines 817-857; signals: lines 859-921).

**Recommendation:** Extract theme constants into a `Theme` interface:
```typescript
interface Theme {
  background: string;
  arenaRingColor: string;
  particlePalette: string[];
  coreGlowColor: string;
  // ...
}
```

The renderer receives the active theme and reads colors from it instead of hard-coded hex values. Deflector skins and trail effects similarly become pluggable render strategies.

**Tech debt risk:** If cosmetics are implemented by adding `if (theme === 'nebula') { ... } else if (theme === 'ocean') { ... }` branches in the renderer, every new theme doubles the branching. Use data-driven themes.

### 029 — Challenge Mode

**Concern ("Mirror Mode" modifier):** The modifier "Reflection angle inverted" fundamentally changes the physics. Currently `collision.ts` `reflect()` is called in `checkDeflectorCollision()`. Inverting the reflection means negating the normal, which would bounce signals THROUGH the deflector rather than away. This modifier needs careful implementation -- it should invert the exit angle, not the normal.

**Recommendation:** Define modifier effects as config overrides + behavior flags, not code branches. Mirror Mode sets a `invertReflection: boolean` flag. The collision system checks this flag and adjusts the reflected velocity accordingly.

### 030 — Boss Rush Mode

**Concern (heavy dependencies):** This mode requires splitter orbs (019) and ghost orbs (020) for waves 3 and 4. It also requires the power-up selection UI between waves. This means Boss Rush cannot ship until: the orb type system (016), splitter orbs (019), ghost orbs (020), and the power-up system (009) are all complete.

**Recommendation:** Consider shipping a simplified Boss Rush initially (waves using standard orbs with varying speed/spawn configs) and adding the special-orb waves later. This reduces the critical path.

### 031 — Puzzle Mode

**Concern (fundamental architecture mismatch):** The current game loop is real-time with continuous input. Puzzle mode requires: (1) a planning phase where deflectors don't decay, (2) a "GO" button that starts physics, (3) undo/clear functionality, and (4) a completely different win/lose condition (all orbs caught vs. any orb escapes).

This is essentially a different game mode that shares the physics engine but has a totally different game loop structure. It will need its own update loop, its own input handling (tap-to-place, undo button), and its own rendering (frozen orbs, wall count HUD, GO button).

**Recommendation:** Implement this as a separate `PuzzleGameScreen` class (not a mode flag on the existing `Game` class). It reuses `CollisionSystem`, `ParticleSystem`, and `Renderer` components but has its own lifecycle.

**Effort estimate:** This is the single most complex ticket. Puzzle data authoring alone (20+ puzzles with balanced difficulty) is a significant design task. Add 1-2 weeks for the unique game loop. Consider moving to T4 or later.

### 032 — Time Attack Mode

**Technical note:** This is one of the simpler mode additions. It is essentially Arcade with: (1) fixed difficulty at the 45s level, (2) all 4 colors from start, (3) a target score instead of survival, and (4) timer as primary metric. Can be implemented as a set of `GameConfig` overrides plus a custom win condition check in the update loop. Straightforward.

### 033 — Enhanced Share System

**Technical note:** The existing `share.ts` and `share-image.ts` already implement most of what is described. The ticket adds: a bottom sheet UI (new), daily challenge number (new -- depends on a daily counter system), modifier name (depends on modifier system), and streak count (depends on streak tracking). The image card already exists in `share-image.ts`.

**Recommendation:** This ticket is mostly incremental. The bottom sheet UI is the only new component. Estimate accordingly.

### 036 — Replay System

**Concern (deterministic replay):** AC says "Replays the recorded inputs against the seeded game state." This requires the game to be fully deterministic given a seed and an input sequence. The current game is NOT deterministic:
- `Math.random()` is used for particle effects (game.ts line 881, particles.ts line 13)
- `performance.now()` is used for deflector cooldown (game.ts line 784)
- `setTimeout` is used for near-miss recovery (game.ts line 1041)

**Recommendation:** For replay to work, either:
- (a) Record the full game state (positions, velocities of all entities) at each frame -- expensive in memory, ~50KB per 5 seconds at 60fps
- (b) Record only inputs and make the game deterministic -- requires replacing all `Math.random()` with seeded RNG in hot paths (particles, spawning, etc.)
- (c) Record inputs and accept visual drift in particles (particles don't affect gameplay) -- pragmatic middle ground

Option (c) is recommended. Record swipe inputs with timestamps, replay them against the seeded game state, and accept that particle effects may differ. Gameplay will be identical.

**Stretch goal concern:** "Exporting replay as video/GIF via canvas recording APIs" -- `MediaRecorder` with `canvas.captureStream()` works in Chrome/Firefox but NOT Safari. This is a browser compatibility issue for a PWA. Consider it out of scope for initial implementation.

### 037 — Mode-Specific Music

**Concern (bundle size):** Each music track (MP3) is likely 2-5MB. Four tracks = 8-20MB. The product vision says "keep bundle under 200KB." Music tracks must be loaded on-demand, not bundled.

**Recommendation:** Music tracks should be lazy-loaded when a mode is selected. The current `SongPlayer.start()` takes a URL and loads the `Audio` element -- this already supports lazy loading. But the JSON beat data files (like `Neon-Overdrive.json`) are currently statically imported (game.ts line 39: `import neonOverdrive from '../songs/Neon-Overdrive.json'`). These should also be lazy-loaded.

**Missing detail:** The ticket says "Daily Challenge music adapts to the daily modifier" but does not specify how. Does it mean: (a) a different track per modifier type, (b) the same track with BPM adjustment, or (c) audio parameter changes (low-pass filter, pitch shift)? Option (c) is achievable with Web Audio API; options (a) and (b) require new audio assets.

### 039 — Color Accessibility Mode

**Technical note:** This is well-specified and clean. Implementation is straightforward: in `renderSignals()`, after drawing the orb circle, draw a small shape (triangle, square, hollow circle, diamond) in white at the center. Same shapes on port indicators in `renderPorts()`. Use a `colorShapes: Record<SignalColor, (ctx, x, y, size) => void>` lookup.

**One concern:** AC says "works correctly with rainbow orb cycling." The rainbow orb cycles colors every 0.5s, which means the shape must also cycle. This is a nice detail that is correctly called out.

### 040 — First-Time User Experience

**Concern (overlap with existing tutorial):** The current tutorial system (tutorial.ts) is a 10-phase state machine. This ticket wants to simplify it to 2 phases for FTUE but also add progressive menu disclosure. The ticket needs to be clear about whether it replaces or augments the existing tutorial.

**Recommendation:** The existing tutorial is good and thorough (3 steps: deflect, multi-deflect, color matching). Don't reduce it to 2 phases -- that loses the color-matching lesson. Instead, keep the existing tutorial as-is and add the progressive menu disclosure as a separate concern tracked by `gamesPlayed` count in localStorage.

**AC conflict:** The ticket says "Tutorial Phase 2: demonstrates bounce and port catch" but the existing tutorial has 3 phases with 8 internal states. Clarify that "Phase 1" and "Phase 2" in this ticket refer to the high-level FTUE stages (simplified menu, expanded menu) rather than tutorial phases.

### 041 — localStorage Schema

**Concern (migration strategy):** AC says "if schema version changes, old data is migrated or safely ignored." This is critical but underspecified. What is the migration mechanism?

**Recommendation:** Add a `deflect_schema_version: number` key. On load, if the version is missing or less than current, run migration functions sequentially (`migrate_v1_to_v2()`, etc.). Each migration function transforms old key shapes to new ones. Keep migration functions in a dedicated `migrations.ts` file.

**Concern (data size):** AC says "total localStorage usage stays under 100KB." With `recentGames` at 10 entries, `achievements` as an ID array, `puzzles` as a map, and `challenges` as a map -- this should be well under 10KB total for a typical player. The 100KB limit is generous. The real concern is the 5MB localStorage limit in some browsers (Safari private mode has 0 bytes).

**Recommendation:** Add a try/catch around all localStorage writes (already done in the existing code) and degrade gracefully if writes fail.

---

## Recommended Build Order

### Phase 0: Foundational Refactoring (1-2 weeks)

1. **A4: Unified Persistence Layer** (041 prerequisite)
   - Create `PlayerData` class with typed getters/setters
   - Migrate existing scattered localStorage reads/writes
   - Add schema version and migration framework

2. **A1: Screen Manager** (008 prerequisite)
   - Create `Screen` interface with lifecycle hooks
   - Create `ScreenManager` with stack, transitions, input routing
   - Migrate existing menu and game-over logic into `MenuScreen` and `GameOverScreen`
   - Wire into `main.ts` game loop

3. **A3: Game Class Decomposition** (parallel with A1)
   - Extract `GameSession` for active gameplay state
   - Extract event-driven hooks for future systems (achievements, milestones)

### Phase 1: T1 Core Retention (3-4 weeks)

Build order within T1:

1. **041** — localStorage Schema (data foundation, blocks everything)
2. **008** — Screen Transitions (architecture foundation)
3. **004** — Settings Screen (standalone, tests the screen system)
4. **002** — Main Menu Redesign (depends on screen system)
5. **001** — Splash / Loading Screen (simple, wires into menu transition)
6. **003** — Mode Select Cards (depends on menu, level system)
7. **023** — XP System (data layer, depends on 041)
8. **024** — Level Unlocks (depends on 023)
9. **025** — Achievements (depends on 023, game event hooks)
10. **039** — Color Accessibility Mode (standalone renderer change)
11. **007** — Game Over Screen Redesign (depends on 023, 025)
12. **005** — Stats / Profile Screen (depends on 041, 023)
13. **006** — Daily Challenge Hub (depends on 041, streak tracking)
14. **040** — FTUE (depends on 002, 003, progressive disclosure)
15. **028** — Milestone Celebrations (depends on event hooks from A3)

### Phase 2: T2 Depth (3-4 weeks)

Build order within T2:

1. **A2: Entity/Orb Type Refactor** (prerequisite for orbs and power-ups)
2. **016** — Orb Spawn Schedule (framework, blocks all orb types)
3. **009** — Power-Up Core System (framework, blocks all power-ups)
4. **017** — Gold Orb (simplest new orb type, proves the orb system)
5. **018** — Rainbow Orb (tests the any-port-matching logic)
6. **010** — Time Slow Power-Up (simplest power-up)
7. **011** — Shield Power-Up
8. **015** — Extra Life Power-Up (instant effect, simpler than duration-based)
9. **013** — Magnet Power-Up (modifies existing magnetism values)
10. **012** — Multi-Bounce Power-Up (requires bounce count refactor)
11. **014** — Splitter Power-Up (score doubler, straightforward)
12. **019** — Splitter Orb (requires spawn-on-collision mechanism)
13. **026** — Cosmetics (theme system, depends on renderer refactor)
14. **033** — Enhanced Share System (incremental on existing)
15. **037** — Mode-Specific Music (audio assets needed, lazy loading)
16. **038** — Haptic Feedback (extends existing system, straightforward)

### Phase 3: T3 Variety (2-3 weeks)

1. **020** — Ghost Orb
2. **021** — Bomb Orb
3. **022** — Giant Orb
4. **029** — Challenge Mode (weekly modifiers)
5. **030** — Boss Rush Mode (depends on 019, 020)
6. **035** — Challenge-a-Friend (URL encoding + comparison screen)

### Phase 4: T4 Polish (2-3 weeks)

1. **032** — Time Attack Mode (simplest new mode)
2. **027** — Daily Rewards System
3. **034** — Daily Leaderboard (requires backend)
4. **031** — Puzzle Mode (most complex, consider deferring)
5. **036** — Replay System (most technically risky)

---

## Performance and Bundle Size Concerns

### Bundle Size Budget

The product vision mandates <200KB total bundle. Current estimate:

| Asset | Size (est.) |
|-------|-------------|
| JS bundle (minified + gzipped) | ~25KB |
| HTML + CSS | ~3KB |
| Song JSON data (Neon-Overdrive) | ~8KB |
| Service worker + manifest | ~2KB |
| **Subtotal (shipped in bundle)** | **~38KB** |
| Song MP3 (lazy-loaded) | ~3-5MB each |
| Puzzle data JSON (lazy-loaded) | ~5KB |

The bundle itself will stay well under 200KB even with all v1.2 features. However, the music tracks (037) must be lazy-loaded or the total download will blow past any reasonable budget. Currently `Neon-Overdrive.mp3` is referenced by URL in `SongPlayer.start()` (loaded by the browser's Audio element) -- this pattern should be maintained for all new tracks.

### Frame Rate Concerns

| Feature | Risk | Mitigation |
|---------|------|------------|
| Power-up sparkle trails | Medium | Shares MAX_PARTICLES=500 cap with existing particles. Could starve gameplay particles. Raise cap to 750 or add priority tiers. |
| Splitter orb child spawning | Low | Adds 2 signals per split. Signals array rarely exceeds 10. No concern. |
| Ghost orb phase-through effect | Low | One-time visual effect, not sustained. |
| Bomb orb ticking audio | Low | Single oscillator, same as existing sounds. |
| Giant orb glow rendering | Low | One extra `shadowBlur` draw call per giant orb. Rare spawn. |
| Cosmetic themes with extra particles | Medium | Themes like "Cyberpunk rain" could add 50+ ambient particles per second. Respect the particle cap. |
| Replay playback | Medium | Re-simulating game state at 0.5x speed is fine. Recording input buffer at 60fps for 5 seconds = ~300 entries = negligible memory. |
| Canvas scroll for mode cards | Medium | Scrollable canvas requires frequent redraws of off-screen content. Use dirty-rect optimization or avoid canvas scroll entirely (see 003 notes). |
| Achievement check per frame | Low | Achievement checks are simple comparisons. No hot-path concern if implemented as event-driven (not polled every frame). |
| Settings sliders in canvas | Low | Only active on settings screen, not during gameplay. |
| Per-color stats tracking | Negligible | One integer increment per spawn/catch. |

### Memory Concerns

| Feature | Risk | Mitigation |
|---------|------|------------|
| Replay input buffer (036) | Low | 5 seconds at 60fps = 300 frames. Each frame stores ~2 touch points = ~4.8KB. Negligible. |
| Recent games history (005, 041) | Negligible | 10 games at ~200 bytes each = 2KB in localStorage. |
| Puzzle definitions (031) | Low | 20 puzzles at ~500 bytes each = 10KB. Load lazily. |
| Multiple song data JSON | Low | Each is ~8KB. Only one loaded at a time (current behavior). |

---

## Testing Strategy Notes

### What Is Testable

The existing test suite (20 test files in `src/__tests__/`) uses Vitest with mock canvas and window objects. This pattern should be extended for new features:

- **XP calculation (023):** Pure function taking game stats as input. Highly testable. Write unit tests for every XP source and edge case (capped streak bonus, level-up boundary).
- **Achievement checks (025):** Pure functions checking conditions against stats. Write unit tests for each of the 25 achievements.
- **Level curve (023):** Pure function from XP to level. Table-driven tests.
- **Orb spawn weights (016):** Given a time bracket, assert correct weight distribution. Seed the RNG for determinism.
- **Collision system with new orb types (017-022):** The existing `collision.test.ts` pattern can be extended. Test ghost phase-through, splitter child generation, giant orb deflector-length rejection, bomb any-port-matching.
- **Challenge modifier application (029):** Given a modifier config, assert the correct `GameConfig` overrides.
- **localStorage persistence (041):** Mock localStorage, test save/load round-trips, test migration from old schema, test missing key defaults.
- **Share card generation (033):** Pure function, returns string. Assert format.

### What Is Hard to Test

- **Screen transitions (008):** Transitions are visual and timing-based. Snapshot testing of canvas state could work but is brittle. Recommend testing the state machine (screen A -> transition -> screen B) without verifying pixel output.
- **Cosmetic rendering (026):** Visual correctness of themes is subjective. No automated test can verify "Nebula theme looks good." Rely on manual QA and screenshot comparison.
- **Haptic feedback (038):** `navigator.vibrate()` cannot be observed in a test. Mock it and verify it was called with the correct pattern.
- **Audio effects (037):** Web Audio nodes cannot be introspected easily. Mock the AudioContext and verify oscillator/filter creation.
- **Replay system (036):** Testing deterministic replay requires running a full game simulation with recorded inputs and comparing entity states. This is an integration test that is fragile to any physics change. Consider it low-priority for automated testing.
- **Canvas scroll (003):** Touch-based scroll physics in canvas are hard to unit test. Test the scroll state math (offset, velocity, bounds) separately from rendering.

### Testing Strategy for New Modes

Each new mode (029-032) should have:
1. **Config test:** Assert that the mode's config overrides are applied correctly (speed, spawn rate, HP, etc.)
2. **Win/lose condition test:** Assert that the mode ends correctly (Time Attack: score >= 500, Boss Rush: wave 5 complete, Puzzle: all orbs caught)
3. **Scoring test:** Assert that mode-specific scoring rules work (Boss Rush: cumulative across waves, Time Attack: time as primary metric)

### Recommended Test Additions Before Feature Work

1. **Add integration test for full game loop:** Run 120 seconds of simulated gameplay (seeded), verify no crashes, verify score > 0, verify game over triggers correctly. This catches regressions from refactoring.
2. **Add collision test for each existing collision type:** The current collision tests may not cover all event types (portCatch, wrongPort, escape, nearMiss). Add coverage before the orb type refactor changes the collision system.
3. **Add localStorage round-trip test:** Write all current keys, read them back, verify values. This catches serialization bugs in the persistence layer.

---

## Tech Debt Risks

| Ticket | Naive Implementation Risk | Mitigation |
|--------|--------------------------|------------|
| 002 (Menu) | Hard-coded button rectangles and manual hit-testing grows unsustainable as buttons multiply | Extract a lightweight `UIButton` component with auto-layout |
| 007 (Game Over) | Staggered animation timing implemented with raw setTimeout/counters | Build a mini timeline/tween system reusable across all screens |
| 009 (Power-Ups) | Power-up effects implemented as `if (activePowerUp === 'timeSlow')` branches scattered through game.ts | Use a strategy pattern: `PowerUpEffect` interface with `activate()`, `deactivate()`, `modifySignalSpeed()`, etc. |
| 016 (Orb Spawn) | Orb type behavior implemented as `switch (signal.orbType)` in every handler | Use a data-driven `OrbTypeConfig` registry with behavior hooks |
| 026 (Cosmetics) | Theme colors hard-coded in new `if/else` branches in renderer | Data-driven `Theme` objects passed to renderer |
| 029 (Challenge) | Modifier effects implemented as scattered conditionals in game loop | Modifier as a config overlay applied once at game start |
| 030 (Boss Rush) | Wave definitions hard-coded in the mode's update function | Data-driven wave configs: `{ orbTypes, speed, spawnRate, duration }[]` |
| 031 (Puzzle) | Puzzle mode logic crammed into the existing `Game` class | Separate `PuzzleGameScreen` with its own lifecycle |

---

## Summary of Required Ticket Changes

| Ticket | Action |
|--------|--------|
| 003 | Clarify scroll approach or switch to pagination. Acknowledge canvas scroll complexity. |
| 004 | Specify whether canvas or HTML for form controls. Add note that volume support must be added to audio.ts and SongPlayer. |
| 005 | Add prerequisite: per-color catch/spawn tracking in ScoreManager. |
| 006 | Remove or defer modifier system to a separate ticket. Clarify what is shown without modifiers. |
| 007 | Split death animation into a sub-task. Note dependency on timeline/sequencing system from 008. |
| 008 | Reformulate as "Screen Manager + Transition System." This is the architectural keystone. |
| 009 | Clarify power-up behavior on core contact. Note particle budget concern. |
| 010 | Specify interaction precedence with near-miss slow-mo. Note that signal speed must be separated from global timeScale. |
| 019 | Add note about collision system needing to support entity spawning during collision checks. |
| 022 | Clarify giant orb + short deflector collision behavior (detected but rejected vs. not detected). |
| 030 | Consider shipping simplified version first (standard orbs only) to reduce critical path. |
| 031 | Acknowledge this is the most complex ticket. Consider deferring or splitting into architecture + content. |
| 036 | Clarify determinism requirements. Recommend input-recording approach with visual drift accepted for particles. |
| 037 | Specify lazy loading for music assets. Clarify Daily Challenge music adaptation approach. |
| 040 | Clarify relationship with existing 10-phase tutorial system. Don't reduce tutorial complexity. |
| 041 | Specify migration mechanism concretely. This ticket should be implemented FIRST among all T1 tickets. |
