# 030 — Boss Rush Mode

**Priority:** T3 — Variety
**Refs:** feature-specs.md §6.2 (US-MODE-02), product-vision.md §Part 3

---

## Description

Implement Boss Rush Mode — a wave-based survival mode with 5 escalating waves followed by an endless mode. Between waves, HP is restored and the player selects 1 of 3 random power-ups. Unlocks at Level 5.

### Wave Definitions

| Wave | Name | Description |
|------|------|-------------|
| 1 | "The Swarm" | 2 colors, fast spawn rate (0.8s), slow speed. Overwhelm with quantity. |
| 2 | "Speedsters" | 2 colors, normal spawn, 2x speed. Tests reaction time. |
| 3 | "The Split" | 3 colors, splitter orbs only. Every deflection creates 2 orbs. |
| 4 | "Ghost Protocol" | 3 colors, ghost orbs only. Must plan deflector placement. |
| 5 | "The Gauntlet" | 4 colors, all orb types, fast speed, fast spawn. Ultimate test. |
| 6+ | "Endless" | 4 colors, speed/spawn increase every 15s. No HP restores. |

### Between-Wave UI

- Dark overlay with "WAVE X COMPLETE" text
- Stats for the wave (catches, misses, combo)
- "NEXT WAVE" countdown timer (5 seconds)
- Power-up selection: player chooses 1 of 3 random power-ups (simple 3-card tap UI)

---

## Acceptance Criteria

- [ ] Waves transition smoothly with a 5-second pause
- [ ] HP restored to max between waves 1-5 (not in endless phase)
- [ ] Each wave's orb type restriction is enforced (Wave 3 = splitter only, Wave 4 = ghost only)
- [ ] "WAVE X" title card with wave name displays at start of each wave
- [ ] Score is cumulative across all waves
- [ ] Power-up selection between waves: 3-card UI (tap to select), random from available pool
- [ ] Game over shows total waves completed + total score
- [ ] Unlocks at Level 5
- [ ] Screen darkens at edges with warning indicator when boss wave begins
- [ ] Dramatic drum roll in music on wave start

---

**Tech note (Morgan TL):** Heavy dependencies on splitter (019) and ghost (020) orbs for waves 3-4. Consider shipping a simplified Boss Rush initially with waves using standard orbs at varying speed/spawn configs, then adding special-orb waves later. This reduces the critical path.

## Dependencies

- 003 (Mode Select Cards) — locked/unlocked display
- 024 (Level Unlocks) — unlock at Level 5
- 009 (Power-Up Core System) — power-up selection between waves
- 019 (Splitter Orb) — Wave 3 (can ship simplified wave until available)
- 020 (Ghost Orb) — Wave 4 (can ship simplified wave until available)
