# 017 — Gold Orb

**Priority:** T2 — Depth
**Refs:** feature-specs.md §4.2.1 (US-ORB-02), product-vision.md §Part 3

---

## Description

Implement the Gold Orb — a high-risk/high-reward orb type that moves faster than standard orbs and is worth 3x points. Gold orbs match **any port** (no color matching needed), rewarding sharp reflexes over careful aim.

**Design decision:** The product vision specifies "any port works" while the feature-specs require color matching. We go with the product vision — Gold Orb's role is "rewards sharp reflexes," and adding color matching dilutes that identity. The Ghost Orb already fills the "harder matching challenge" niche.

| Property | Value |
|----------|-------|
| Appearance | Gold (#ffcc44), sparkle particles, slightly smaller radius (6 vs 8) |
| Speed | 1.3x current signal speed |
| Points | 3x normal (30 * combo instead of 10 * combo) |
| Port matching | **Any port** — no color matching needed |
| Miss penalty | Standard (combo reset, miss counter) if hits core |

---

## Acceptance Criteria

- [ ] Gold orbs match ANY port (no color matching needed; `matchesAnyPort = true`)
- [ ] They are noticeably faster than standard orbs (1.3x speed)
- [ ] Floating text on catch shows gold-colored "+[points]" with a star symbol
- [ ] Gold orbs are affected by power-ups (magnet pulls toward nearest port, time slow, shield, etc.)
- [ ] Sparkle particle trail distinguishes them from standard orbs
- [ ] Slightly smaller radius (6 vs 8) than standard orbs
- [ ] Audio: high-pitched shimmer trail sound while gold orb is in play
- [ ] Catch animation uses the port's color (not the gold orb's color)

---

## Dependencies

- 016 (Orb Spawn Schedule) — spawn timing and weights
