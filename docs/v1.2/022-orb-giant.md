# 022 — Giant Orb

**Priority:** T4 — Polish
**Refs:** feature-specs.md §4.2.6 (US-ORB-07)
**Note:** This orb type is a new proposal — not in the product vision. Demoted from T3 to T4 per PO review. The deflector-length mechanic is novel and untested; may need playtesting to validate it adds welcome variety rather than unintuitive frustration.

---

## Description

Implement the Giant Orb — a rare, slow, high-value "boss target" orb that requires a long deflector to bounce. It is 2.5x normal radius, moves at 0.5x speed, and awards 5x points. Short deflectors pass through it harmlessly. Deals 3 HP on core hit.

| Property | Value |
|----------|-------|
| Appearance | 2.5x normal radius, same color system, thick glowing outline, inner geometric pattern |
| Speed | 0.5x standard |
| Points | 5x normal (50 * combo) |
| Deflection | Requires deflector at least 60% of arena radius length; shorter deflectors are ignored |
| Port matching | Must enter matching color; catch zone uses larger radius |
| Core damage | 3 HP |
| Spawn rate | Very rare; max 1 per run in Arcade; appears after 75s |

---

## Acceptance Criteria

- [ ] Giant orb is visually imposing (2.5x radius with strong glow and geometric inner pattern)
- [ ] Short deflectors pass through the giant orb with a "TOO SMALL" floating text
- [ ] Deflecting a giant orb successfully shows "NICE!" floating text
- [ ] Giant orb approaching the core triggers sustained warning vibration (if haptic enabled)
- [ ] 3 HP core damage can be blocked by shield power-up (reduced to 0 damage)
- [ ] Very rare spawn rate: max 1 per run, only after 75s
- [ ] 0.5x movement speed (slow, menacing approach)
- [ ] Port catch zone uses the giant orb's larger radius for collision detection
- [ ] 5x point multiplier (50 * combo) on successful catch
- [ ] Thick glowing outline distinguishes it from standard orbs at a glance

---

## Dependencies

- 016 (Orb Spawn Schedule) — spawn timing
- 011 (Shield Power-Up) — shield interaction with 3 HP damage
