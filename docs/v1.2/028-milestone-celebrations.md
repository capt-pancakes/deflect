# 028 — Milestone Celebrations

**Priority:** T2 — Depth
**Refs:** feature-specs.md §5.6 (US-PROG-05), product-vision.md §Part 5

---

## Description

Implement in-game milestone celebrations that recognize player improvement in real-time during gameplay. These are non-disruptive visual celebrations (floating text, brief flashes) that make progress feel tangible without pausing the action.

### Milestone Definitions

| Milestone | Trigger | Celebration |
|-----------|---------|-------------|
| First catch ever | First successful port catch (lifetime) | "NICE!" large floating text + extra particles |
| First 5x combo | Reaching 5x combo (lifetime first) | Screen border flashes gold for 1s |
| First 10x combo | Reaching 10x combo (lifetime first) | "COMBO MASTER!" banner slides in |
| Score milestone (100, 500, 1000, 5000) | Crossing threshold during gameplay | Brief screen flash + milestone text |
| Survival milestone (30s, 60s, 90s, 120s) | Clock crossing threshold | Timer text pulses and changes color briefly |
| New high score | Score exceeds personal best mid-game | "NEW RECORD!" floats up from score display |
| Perfect accuracy at 10+ catches | 10th consecutive catch with no misses | "PERFECT!" rainbow text |

### Combo Escalation (from product vision)

- 5x combo: screen-wide particle burst (small)
- 10x combo: larger particle burst
- 15x combo: escalating burst + combo counter text grows physically larger

---

## Acceptance Criteria

- [ ] Milestone celebrations are non-disruptive (floating text / brief visual, no pausing)
- [ ] "First ever" milestones only fire once per player lifetime (tracked in localStorage `deflect_milestones`)
- [ ] In-game milestones (score, survival, combo) fire every game when crossed
- [ ] Reduced Motion: milestones show as simple text without screen effects
- [ ] New high score mid-game: golden flash + "NEW BEST!" floating text + haptic pulse
- [ ] Combo counter text grows physically larger with higher combos (caps at reasonable size)
- [ ] Port catch celebration: port flashes brighter and emits directional particle burst inward
- [ ] All celebrations are brief (< 2s visible) and do not obscure gameplay elements

---

## Dependencies

- 004 (Settings) — Reduced Motion preference
- 041 (localStorage Schema) — milestone tracking storage
