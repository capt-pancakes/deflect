# 019 — Splitter Orb

**Priority:** T2 — Depth
**Refs:** feature-specs.md §4.2.3 (US-ORB-04), product-vision.md §Part 3

---

## Description

Implement the Splitter Orb — an orb with a visible crack/split line that breaks into 2 child orbs of the same color when deflected. The children diverge at +/- 30 degrees from the original bounce angle. Each child is scored independently.

| Property | Value |
|----------|-------|
| Appearance | Standard colored orb with visible crack/split line through middle |
| Speed | 0.9x standard (slightly slower) |
| Behavior on deflect | Splits into 2 standard-sized orbs, same color, diverging at +/- 30 degrees |
| Points | Each child orb awards standard catch points independently |
| Miss penalty | Each child miss counts as independent miss |
| Core hit (no deflect) | Deals 1 HP, does not split |

---

## Acceptance Criteria

- [ ] Split produces exactly 2 child orbs of the same color
- [ ] Child orbs are standard orbs (they do not split further)
- [ ] Children diverge at +/- 30 degrees from the original bounce angle
- [ ] If the splitter orb hits the core before being deflected, it deals 1 HP and does not split
- [ ] Split animation: brief flash at split point, two orbs fly apart
- [ ] Deflector that caused the split applies its normal bounce effect to both children
- [ ] Both children inherit the "deflected" flag (eligible for port magnetism)
- [ ] Each child is scored independently (catching both = 2 catches toward combo)
- [ ] Each child miss is an independent miss event
- [ ] Visible crack/split line on the orb distinguishes it from standard orbs

---

## Dependencies

- 016 (Orb Spawn Schedule) — spawn timing and weights
