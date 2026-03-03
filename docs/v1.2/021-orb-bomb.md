# 021 — Bomb Orb

**Priority:** T3 — Variety
**Refs:** feature-specs.md §4.2.5 (US-ORB-06), product-vision.md §Part 3

---

## Description

Implement the Bomb Orb — a high-tension orb that deals 2 HP damage on core hit. It moves menacingly slow (0.8x speed) with a pulsing dark red/black appearance that accelerates as it approaches the core. Any port accepts a bomb orb (like rainbow). The bomb must be deflected for survival.

| Property | Value |
|----------|-------|
| Appearance | Dark red/black, pulsing, flame particle trail |
| Speed | 0.8x standard |
| Core hit damage | 2 HP |
| Deflect behavior | Bounces normally; any port neutralizes it for standard points |
| Port matching | Any port accepts (like rainbow) |
| Miss penalty | 2 HP damage + combo reset + miss counter |

---

## Acceptance Criteria

- [ ] Bomb orb pulse animation accelerates as distance to core decreases
- [ ] 2 HP damage can kill the player if at 2 HP or less
- [ ] Warning indicator: "DANGER" text flashes at screen top when bomb orb enters arena
- [ ] Bomb orbs are affected by power-ups (shield blocks 2 HP damage, time slow works, magnet pulls toward nearest port)
- [ ] Bomb orbs do not spawn in Zen mode
- [ ] Audio: ticking sound that increases in tempo as bomb approaches core
- [ ] Low rumbling sound when bomb orb spawns
- [ ] Screen shake on core hit is 2x normal intensity
- [ ] Large explosion particle effect on core hit
- [ ] Any port accepts the bomb orb (like rainbow behavior)
- [ ] Standard points (10 * combo) on successful port catch

---

## Dependencies

- 016 (Orb Spawn Schedule) — spawn timing and weights
- 011 (Shield Power-Up) — shield interaction with 2 HP damage
