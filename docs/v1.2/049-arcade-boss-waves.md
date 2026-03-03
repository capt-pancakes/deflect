# 049 — Boss Waves in Arcade Mode

**Priority:** T2 — Depth
**Source:** Alex (PO) review — M6; product-vision.md Part 3

---

## Description

Add boss wave events to Arcade mode at 60s, 120s, and 180s survival milestones. Boss waves are dense clusters of same-color orbs from one direction, creating a high-intensity moment that tests strategic deflector placement. This is distinct from Boss Rush Mode (ticket 030), which is a standalone mode.

### Boss Wave Definition

- **Trigger:** Survival time crosses 60s, 120s, or 180s
- **Duration:** 5 seconds of intense spawning, then normal spawning resumes
- **Pattern:** 8-12 orbs of the same randomly-selected color spawn in rapid succession from one direction
- **Warning:** Screen darkens at edges, warning indicator flashes the direction of incoming wave, dramatic drum roll
- **Escalation:** Each successive boss wave is faster and denser

| Wave | Time | Orb Count | Speed | Spawn Interval |
|------|------|-----------|-------|---------------|
| 1 | 60s | 8 | 1.2x | 0.4s |
| 2 | 120s | 10 | 1.5x | 0.3s |
| 3 | 180s | 12 | 1.8x | 0.25s |

---

## Acceptance Criteria

- [ ] Boss waves trigger at 60s, 120s, and 180s in Arcade mode only
- [ ] Each wave spawns a cluster of same-color orbs from a single direction
- [ ] 2-second warning before wave starts (screen edge darkens, directional indicator)
- [ ] Dramatic drum roll audio during warning
- [ ] Boss wave orbs use the standard scoring and damage rules
- [ ] Normal spawning pauses during the boss wave, then resumes after
- [ ] Each successive wave is faster and denser per the table above
- [ ] "BOSS WAVE" text appears during the wave
- [ ] Boss waves do not appear in Zen, Daily, or other modes

---

## Dependencies

- 037 (Audio) — drum roll sound effect
