# 014 — Score Doubler Power-Up

**Priority:** T2 — Depth
**Refs:** feature-specs.md §3.2.5 (US-PWR-06)
**Renamed:** Was "Splitter Power-Up" — renamed to avoid confusion with Splitter Orb (ticket 019). See also Gold Rush (ticket 051) which is a similar but distinct 3x/5s power-up from the product vision.

---

## Description

Implement the Score Doubler power-up. When activated, each successful port catch during the 6-second duration awards 2x points. The doubling applies to the base calculation (10 * combo), then doubled. Combo increments normally.

| Property | Value |
|----------|-------|
| Icon | Forking arrow |
| Color | Green (#44ff88) |
| Duration | 6 seconds |
| Effect | Each successful port catch awards 2x points |
| Visual | Green aura around ports; caught signals produce double particle bursts |
| Audio | Double "ding" on catch instead of single |

---

## Acceptance Criteria

- [ ] Points doubling applies to the base `(10 * combo)` calculation, then doubled
- [ ] Combo still increments by 1 per catch (not doubled)
- [ ] Visual feedback clearly communicates the bonus (larger floating text, different color)
- [ ] Green aura visible around all ports during effect
- [ ] Caught signals produce double particle bursts
- [ ] Double "ding" audio on each catch during effect
- [ ] Works correctly with all orb types (gold, rainbow, etc. when implemented)
- [ ] Score doubling stacks with gold orb multiplier if both active (gold = 3x base, doubled = 6x)

---

## Dependencies

- 009 (Power-Up Core System) — spawn, collection, HUD framework
