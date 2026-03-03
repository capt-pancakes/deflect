# 051 — Gold Rush Power-Up

**Priority:** T2 — Depth
**Source:** Alex (PO) review — M8; product-vision.md Part 3

---

## Description

Implement the Gold Rush power-up. When activated, all catches are worth 3x points for 5 seconds and all orbs gain a gold tint. This was listed as a V1.0 "Should Have" in the product vision.

| Property | Value |
|----------|-------|
| Icon | Gold coin / star burst |
| Color | Gold (#ffcc44) |
| Duration | 5 seconds |
| Effect | All catches worth 3x points; all orbs gain gold visual tint |
| Visual | Gold screen tint, all orbs shimmer gold, floating "+3x" text on catches |
| Audio | Cash register / coin sound on each catch during effect |

---

## Acceptance Criteria

- [ ] All catches during the 5-second duration award 3x points (applied to base `10 * combo`)
- [ ] Combo still increments by 1 per catch (not tripled)
- [ ] All orbs on screen gain a gold shimmer overlay during effect
- [ ] Floating text on catches shows gold-colored points with "x3" indicator
- [ ] Gold Rush stacks with gold orb multiplier (gold orb during Gold Rush = 9x)
- [ ] Duration timer visible in HUD as shrinking ring
- [ ] Distinct from the Score Doubler power-up (014): Gold Rush is 3x for 5s; Score Doubler is 2x for 6s
- [ ] Cash register / coin audio on each catch during effect

---

## Dependencies

- 009 (Power-Up Core System) — spawn, collection, HUD framework
