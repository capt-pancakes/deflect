# 015 — Extra Life Power-Up

**Priority:** T2 — Depth
**Refs:** feature-specs.md §3.2.6 (US-PWR-07), product-vision.md §Part 3

---

## Description

Implement the Extra Life power-up. This is an instant-effect power-up (no duration) that restores 1 HP on collection, up to the max of 5. If already at max HP, it grants 50 bonus points instead.

| Property | Value |
|----------|-------|
| Icon | Heart / plus |
| Color | Pink (#ff88aa) |
| Duration | Instant (no timer) |
| Effect | Restores 1 HP (up to max 5) |
| Visual | HP pip refills with pulse animation; heart floats up from core |
| Audio | Warm chime |

### Spawn Conditions (in addition to core system rules)

- Only spawns when coreHP <= 3
- More likely to spawn at lower HP (weighted)
- Does not appear in Zen mode (HP is infinite in Zen)

---

## Acceptance Criteria

- [ ] Restores exactly 1 HP on collection
- [ ] HP cannot exceed max of 5
- [ ] If at max HP (5), collecting shows "MAX HP" text and grants 50 bonus points instead
- [ ] HP pip refills with visible pulse animation
- [ ] Heart icon floats up from core on collection
- [ ] Warm chime audio on collection
- [ ] Does not appear in Zen mode
- [ ] Only spawns when coreHP <= 3
- [ ] Spawn weighting: more likely at lower HP values
- [ ] No HUD timer ring (instant effect, not duration-based)

---

## Dependencies

- 009 (Power-Up Core System) — spawn, collection framework
