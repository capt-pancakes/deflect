# 009 — Power-Up Core System

**Priority:** T2 — Depth
**Refs:** feature-specs.md §3.1 (US-PWR-01), product-vision.md §Part 3

---

## Description

Implement the power-up infrastructure: spawning, collection, activation, HUD display, and duration management. Power-ups spawn as glowing pickup orbs that float toward the center. Players collect them by swiping a deflector through them. Only one power-up can be active at a time.

This ticket covers the framework. Individual power-up behaviors are in tickets 010-015.

### Spawn Mechanics

- Power-ups spawn as white orbs with a colored icon inside indicating type
- They pulse with a gentle glow and have a distinct sparkle particle trail
- Move toward center at 40% of current signal speed
- Despawn if not collected within 8 seconds

### Spawn Conditions

- First power-up never spawns before 20 seconds of play
- After 20s: 15% chance to spawn with each signal spawn event
- Maximum 1 power-up visible on screen at a time
- No power-ups in Zen mode
- Daily Challenge mode: power-up spawns are deterministic (seeded)

### Activation

- Activate instantly on collection (no inventory, no tap-to-use)
- Active power-up shown as icon in top-center HUD with circular timer ring
- Collecting a new power-up replaces the current one (old ends immediately)

---

## Acceptance Criteria

- [ ] Power-up orbs are visually distinct from signal orbs (white base, colored icon, sparkle trail)
- [ ] Collection triggered by deflector intersection with power-up orb
- [ ] Collection produces burst particles (white + power-up color) and floating text with power-up name
- [ ] Distinctive audio chime per power-up type on collection
- [ ] HUD icon with circular depleting timer ring displayed for active power-ups
- [ ] Collecting a new power-up replaces current with "REPLACED" brief indicator
- [ ] Timer ring accurately reflects remaining duration
- [ ] Power-ups never spawn before 20s of play
- [ ] Maximum 1 power-up on screen at a time enforced
- [ ] No power-ups spawn in Zen mode
- [ ] Seeded RNG for power-up spawns in Daily Challenge mode
- [ ] Uncollected power-ups fade out and despawn after 8 seconds
- [ ] Power-up-assisted catches are tagged in stats as "power-up catches" but count normally for combo
- [ ] Power-ups that reach the core despawn (they do not damage the core or pass through)

**Tech note (Morgan TL):** Implement power-ups as a separate entity array (`powerUps: PowerUp[]`), not mixed into `signals[]`. Add a `checkPowerUpCollisions(powerUps, deflectors)` method to the collision system that returns `PowerUpCollected` events. This keeps the signal collision path clean.

**Performance note (Morgan TL):** Power-up sparkle trails share the `MAX_PARTICLES = 500` cap (particles.ts:4). Heavy particle effects during active gameplay + power-up trails could hit the cap. Consider raising to 750 or adding particle priority tiers.

**Power-up design rules (from product vision):**
1. Power-ups enhance the core mechanic (swiping to deflect), they never replace it
2. No power-up should last longer than 8 seconds
3. Power-ups should be visually distinct (unique glow color, icon) for split-second decisions
4. Power-ups should feel amazing to use — big particle effects, satisfying sound, brief screen flash

---

## Dependencies

- 044 (Game Decomposition) — PowerUpManager extracted as a focused module
- Individual power-ups 010-015, 050-051, 054 depend on this
