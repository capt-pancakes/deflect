# 013 — Magnet Power-Up

**Priority:** T2 — Depth
**Refs:** feature-specs.md §3.2.4 (US-PWR-05), product-vision.md §Part 3

---

## Description

Implement the Magnet power-up. When activated, port magnetism strength is increased 4x (from 0.25 to 1.0) and the activation range expands from 0.8 radians to full arena for 5 seconds. Visible attraction lines are drawn between deflected signals and their matching ports.

| Property | Value |
|----------|-------|
| Icon | Horseshoe magnet |
| Color | Red (#ff4466) |
| Duration | 5 seconds |
| Effect | Port magnetism strength 4x (0.25 → 1.0), activation range = full arena |
| Visual | Visible attraction lines (thin dotted colored lines) between deflected signals and matching ports |
| Audio | Subtle humming sound while active |

---

## Acceptance Criteria

- [ ] Magnet only affects deflected signals (same as current magnetism logic)
- [ ] Attraction lines only render for signals currently being pulled
- [ ] Attraction lines are thin, dotted, and color-matched to the signal
- [ ] Signals still need to reach the port (magnet assists but does not auto-catch)
- [ ] Non-matching signals are unaffected by the magnet
- [ ] Subtle humming sound plays while magnet is active
- [ ] Magnetism values revert to defaults (0.25 strength, 0.8 radian range) when power-up expires

---

## Dependencies

- 009 (Power-Up Core System) — spawn, collection, HUD framework
