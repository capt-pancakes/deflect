# 039 — Color Accessibility Mode

**Priority:** T1 — Core Retention Loop
**Refs:** product-vision.md §Part 2 (V1.0 item 12)

---

## Description

Add a color accessibility mode that overlays shape indicators on orbs so that color-blind players (deuteranopia, protanopia) can distinguish orb types without relying solely on color. This is a critical accessibility feature for a color-matching game.

### Shape Indicators

Each color gets a unique shape indicator rendered inside or on top of the orb:

| Color | Shape Suggestion |
|-------|-----------------|
| Red | Triangle |
| Blue | Square |
| Green | Circle (hollow) |
| Yellow | Diamond |

### Implementation

- Shapes are rendered as small icons inside the orb, overlaid on the color
- Shapes appear on both orbs AND port indicators so the matching is clear
- Mode is toggled in Settings
- Shapes should be clearly visible at all orb sizes (including gold orb's smaller radius)

---

## Acceptance Criteria

- [ ] Toggle available in Settings screen
- [ ] When enabled, shape indicators appear inside all colored orbs
- [ ] Matching shape indicators appear on port indicators
- [ ] Shapes are clearly visible at standard orb size and smaller gold orb size
- [ ] Shapes do not obscure other visual indicators (gold tint, crack line on splitter, etc.)
- [ ] Works correctly with all orb types (standard, gold, splitter, ghost, rainbow cycling)
- [ ] Rainbow orb cycles through shapes matching its color cycle
- [ ] Setting persists in localStorage
- [ ] No performance impact from rendering shape indicators

---

## Dependencies

- 004 (Settings) — toggle location
