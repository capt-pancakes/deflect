# 050 — Wide Wall Power-Up

**Priority:** T2 — Depth
**Source:** Alex (PO) review — M7; product-vision.md Part 3

---

## Description

Implement the Wide Wall power-up. When activated, the next deflector drawn is 50% longer than normal, giving players a wider defensive surface. This was listed as a V1.0 "Should Have" in the product vision.

| Property | Value |
|----------|-------|
| Icon | Expand arrows (horizontal) |
| Color | White (#ffffff) |
| Duration | Next 1 deflector only (instant use) |
| Effect | Next deflector drawn is 50% longer |
| Visual | Deflector glows brighter and has a wider end-cap effect |
| Audio | Satisfying "stretch" sound on activation |

---

## Acceptance Criteria

- [ ] Next deflector after collection is 50% longer than the standard max length
- [ ] Only affects the next 1 deflector drawn (not all subsequent deflectors)
- [ ] Wide deflector still has normal 3s decay lifetime
- [ ] Wide deflector interacts normally with all orb types
- [ ] Visual distinction: wider deflector has brighter glow or wider end-caps
- [ ] If player already has an active duration power-up, Wide Wall does NOT replace it (it is a "next deflector" buff, not a timed effect)
- [ ] HUD indicator shows "next wall is wide" until the deflector is drawn

---

## Dependencies

- 009 (Power-Up Core System) — spawn, collection framework
