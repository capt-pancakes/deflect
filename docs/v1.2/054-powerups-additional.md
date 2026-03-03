# 054 — Additional Power-Ups (Steel Wall, Fourth Wall, Mirror Wall, Pulse)

**Priority:** T3 — Variety
**Source:** Alex (PO) review — M9-M12; product-vision.md Part 3

---

## Description

Implement the remaining 4 power-ups from the product vision that were not covered in the initial ticket set. These are lower-priority deflector and core power-ups that add variety to the power-up pool.

### Steel Wall

| Property | Value |
|----------|-------|
| Icon | Brick / metal bar |
| Color | Gray (#aaaaaa) |
| Duration | Next 1 deflector only |
| Effect | Next deflector lasts 8 seconds (instead of 3) and can bounce unlimited orbs |
| Visual | Deflector has metallic sheen, thicker line, does not fade as quickly |

### Fourth Wall

| Property | Value |
|----------|-------|
| Icon | "4" with wall icon |
| Color | Blue (#4488ff) |
| Duration | 8 seconds |
| Effect | Temporarily allows 4 active deflectors instead of 3 |
| Visual | "4x" indicator near deflector count, blue tint on all deflectors |

### Mirror Wall

| Property | Value |
|----------|-------|
| Icon | Reflection arrows |
| Color | Silver (#cccccc) |
| Duration | Next 1 deflector only |
| Effect | Next deflector auto-aims reflected orbs toward the nearest matching port |
| Visual | Deflector has a mirror/reflective shimmer effect |

### Pulse

| Property | Value |
|----------|-------|
| Icon | Expanding rings |
| Color | White (#ffffff) |
| Duration | Instant |
| Effect | Sends a shockwave from the core that slows all orbs to 50% speed for 2 seconds |
| Visual | Visible expanding ring from core center, orbs visually compress briefly on shockwave contact |
| Audio | Deep "whomp" bass hit |

---

## Acceptance Criteria

- [ ] All 4 power-ups spawn through the standard power-up system (ticket 009)
- [ ] Steel Wall: next deflector has 8s lifetime and unlimited bounce count
- [ ] Fourth Wall: max deflectors temporarily increases to 4 for 8 seconds
- [ ] Mirror Wall: next deflector redirects orbs toward their matching port (auto-aim)
- [ ] Pulse: instant shockwave from core, 50% speed for 2 seconds on all orbs, visible ring effect
- [ ] Each power-up has distinct icon, color, and audio cue
- [ ] Steel Wall and Mirror Wall are "next deflector" buffs that coexist with active duration power-ups
- [ ] Fourth Wall interacts correctly with existing deflector limit logic
- [ ] Pulse speed reduction uses `signalSpeedMultiplier` (from ticket 010 architecture), not global timeScale

---

## Dependencies

- 009 (Power-Up Core System) — spawn, collection, HUD framework
- 010 (Time Slow) — shared `signalSpeedMultiplier` approach for Pulse
