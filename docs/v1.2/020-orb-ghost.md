# 020 — Ghost Orb

**Priority:** T3 — Variety
**Refs:** feature-specs.md §4.2.4 (US-ORB-05), product-vision.md §Part 3

---

## Description

Implement the Ghost Orb — a semi-transparent orb that phases through the first deflector it touches and only bounces off the second. This forces players to plan deflector placement more carefully. Worth 2x points as reward for the extra difficulty.

| Property | Value |
|----------|-------|
| Appearance | Semi-transparent (50% opacity), wispy/smoky trail |
| Speed | Standard |
| Points | 2x normal (20 * combo) |
| Behavior | Passes through first deflector (no bounce); bounces off second deflector |
| Port matching | Must enter matching color port |
| Miss penalty | Standard |

---

## Acceptance Criteria

- [ ] Ghost orb visually "phases through" the first deflector with a ghostly ripple effect
- [ ] After phasing, ghost orb becomes fully opaque (solid), indicating it is now bounceable
- [ ] If only 1 deflector exists on screen, the ghost orb passes through it and heads toward core
- [ ] Ghost orbs interact normally with ports (must enter matching color)
- [ ] The deflector the ghost phases through is unaffected (does not lose life faster)
- [ ] Semi-transparent (50% opacity) appearance with wispy/smoky trail instead of solid trail
- [ ] 2x point multiplier on successful catch (20 * combo)
- [ ] Ghost orbs are affected by power-ups (time slow, magnet, etc.)

---

## Dependencies

- 016 (Orb Spawn Schedule) — spawn timing and weights
