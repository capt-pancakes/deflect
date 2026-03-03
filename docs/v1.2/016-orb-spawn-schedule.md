# 016 — Orb Type System & Spawn Schedule

**Priority:** T2 — Depth
**Refs:** feature-specs.md §4.1 (US-ORB-01), product-vision.md §Part 3

---

## Description

Implement the orb type spawning framework that introduces new orb types as the game progresses. The system manages spawn weights per time bracket and mode-specific schedule variations. Individual orb behaviors are handled in tickets 017-022.

### Arcade Mode Spawn Schedule

| Time | Available Types | Spawn Weights |
|------|----------------|---------------|
| 0-30s | Standard only | 100% standard |
| 30-45s | + Gold | 85% standard, 15% gold |
| 45-60s | + Rainbow | 75% standard, 15% gold, 10% rainbow |
| 60-75s | + Splitter | 65% standard, 12% gold, 10% rainbow, 13% splitter |
| 75-90s | + Ghost | 55% standard, 12% gold, 8% rainbow, 12% splitter, 13% ghost |
| 90s+ | + Bomb | 45% standard, 10% gold, 8% rainbow, 12% splitter, 12% ghost, 13% bomb |
| 75s+ | + Giant (rare) | Max 1 per run; does not affect other weights; spawns independently of normal schedule |

### Mode Variations

- **Zen mode:** Same schedule but double all time thresholds (gold at 60s, rainbow at 90s, etc.)
- **Daily mode:** Deterministic based on seed; may include any orb type at any time
- **Boss Rush:** Per-wave orb type restrictions override this schedule

---

## Acceptance Criteria

- [ ] Spawn weight system selects orb type based on weighted random distribution
- [ ] Weights shift according to the time brackets in the schedule above
- [ ] Zen mode uses doubled time thresholds
- [ ] Daily mode uses seeded RNG for orb type selection
- [ ] System is extensible — adding a new orb type requires only a schedule entry and an orb implementation
- [ ] Standard orbs remain the majority type at all time brackets
- [ ] Weight transitions are immediate at time boundaries (no gradual blending needed)

---

## Dependencies

- None (framework ticket; individual orbs 017-022 depend on this)
