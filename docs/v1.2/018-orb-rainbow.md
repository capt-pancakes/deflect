# 018 — Rainbow Orb

**Priority:** T2 — Depth
**Refs:** feature-specs.md §4.2.2 (US-ORB-03), product-vision.md §Part 3

---

## Description

Implement the Rainbow Orb — a relief orb that matches any port. It cycles through all 4 colors visually (shifting every 0.5s) and has a white sparkle trail. Any port counts as a match, making it a "safety valve" during chaotic waves. Worth standard points.

| Property | Value |
|----------|-------|
| Appearance | Cycles through all 4 colors (shift every 0.5s), white sparkle trail |
| Speed | Standard |
| Points | Standard (10 * combo) |
| Port matching | Any port counts as a match |
| Miss penalty | Standard if hits core; no wrong-port penalty |

---

## Acceptance Criteria

- [ ] Color cycling is purely visual; the orb has no "wrong" port
- [ ] Hitting any port triggers the catch effect with that port's color
- [ ] Rainbow orbs hitting the core deal 1 HP damage but do NOT reset combo (the "safety valve" — per product vision)
- [ ] Rainbow orbs are clearly visually distinct from standard single-color orbs
- [ ] Color cycle shifts smoothly every 0.5s through all active colors
- [ ] White sparkle trail differentiates from standard colored trails
- [ ] Catch animation uses the port's color (not the rainbow orb's current visual color)

---

## Dependencies

- 016 (Orb Spawn Schedule) — spawn timing and weights
