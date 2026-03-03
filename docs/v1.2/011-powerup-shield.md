# 011 — Shield Power-Up

**Priority:** T2 — Depth
**Refs:** feature-specs.md §3.2.2 (US-PWR-03), product-vision.md §Part 3

---

## Description

Implement the Shield power-up. When activated, the core becomes invulnerable for 4 seconds. Signals that hit the core are destroyed but deal no damage. The shield protects HP but does not protect combo — blocked hits still count as misses.

| Property | Value |
|----------|-------|
| Icon | Shield |
| Color | Gold (#ffcc44) |
| Duration | 4 seconds |
| Effect | Core is invulnerable; signals hitting core are destroyed but deal no damage |
| Visual | Golden ring around core, pulses outward on each blocked hit |
| Audio | Metallic "ting" on each blocked hit |

---

## Acceptance Criteria

- [ ] Blocked hits still reset combo (shield protects HP, not combo)
- [ ] Blocked hits add to miss counter (they were not caught in a port)
- [ ] Shield visual is clearly distinct from the danger ring (gold vs red)
- [ ] Shield activates even if coreHP is already at 1
- [ ] Golden ring around core pulses outward on each blocked hit
- [ ] Metallic "ting" sound on each blocked hit
- [ ] Shield blocks bomb orb damage (2 HP reduced to 0) when bomb orb system is implemented
- [ ] Shield blocks giant orb damage (3 HP reduced to 0) when giant orb system is implemented

---

## Dependencies

- 009 (Power-Up Core System) — spawn, collection, HUD framework
