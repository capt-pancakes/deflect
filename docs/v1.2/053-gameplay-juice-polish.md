# 053 — Gameplay Juice Polish

**Priority:** T2 — Depth
**Source:** Alex (PO) review — M15; product-vision.md Part 5

---

## Description

Implement the visual juice and "game feel" enhancements from the product vision that don't belong to any single feature ticket. These are small, high-impact polish items that make the game feel amazing to play.

### Juice Items

| Item | Description |
|------|-------------|
| Deflector draw zip | Deflector materializes with a quick "zip" animation from start to end, not appearing instantly |
| Near-miss chromatic aberration | In addition to slow-mo, add an RGB split effect for 200ms on near-miss |
| Port catch burst | When orb enters correct port, port flashes brighter and emits directional particle burst inward |
| Combo text scaling | Combo counter text grows physically larger with higher combos (caps at reasonable size) |
| Combo milestone bursts | At 5x, 10x, 15x combo: escalating screen-wide particle bursts |
| Core crack death | On final HP loss, 500ms slow-mo with core crack/shatter effect before game over overlay |
| New high score mid-game | Brief golden flash + "NEW BEST!" floating text + haptic pulse when beating high score during play |

---

## Acceptance Criteria

- [ ] Deflector appears with zip animation from swipe start to end (~100ms)
- [ ] Near-miss triggers chromatic aberration (RGB channel offset) for 200ms in addition to slow-mo
- [ ] Port flashes brighter on correct catch with inward directional particle burst
- [ ] Combo counter text scales up with combo value (capped at ~2x normal size)
- [ ] Screen-wide particle bursts at 5x, 10x, 15x combos (increasing intensity)
- [ ] Core crack/shatter animation on death (500ms slow-mo sequence)
- [ ] "NEW BEST!" floating text + golden flash when score exceeds high score mid-game
- [ ] All effects respect Reduced Motion setting (downgrade to simple text, no screen effects)
- [ ] No frame drops from any individual juice effect (keep each under 1ms render cost)

---

## Dependencies

- 004 (Settings) — Reduced Motion preference
- 038 (Haptic) — haptic pulse on new high score
