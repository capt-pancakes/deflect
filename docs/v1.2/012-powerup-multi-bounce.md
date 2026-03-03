# 012 — Multi-Bounce Power-Up

**Priority:** T2 — Depth
**Refs:** feature-specs.md §3.2.3 (US-PWR-04)
**Note:** This power-up is a new proposal — not directly in the product vision. The closest source concept is "Steel Wall" (next deflector lasts 8s, unlimited bounces). Multi-Bounce was chosen as a more interesting mechanic.

---

## Description

Implement the Multi-Bounce power-up. When activated, signals can bounce off deflectors up to 3 times instead of the default 1 for 6 seconds. Each additional bounce awards +5 bonus points. Landing a 3-bounce port catch triggers a "TRICK SHOT" floating text.

| Property | Value |
|----------|-------|
| Icon | Double-arrow |
| Color | Purple (#aa44ff) |
| Duration | 6 seconds |
| Effect | Signals can bounce off deflectors up to 3 times instead of 1 |
| Visual | Deflectors glow purple; "x2" / "x3" text appears on extra bounces |
| Audio | Bounce pitch increases with each successive bounce |

---

## Acceptance Criteria

- [ ] Each additional bounce off a deflector adds +5 bonus points (on top of eventual catch points)
- [ ] Orbs that bounce 3 times and then enter the correct port earn a "TRICK SHOT" floating text
- [ ] The signal's bounce tracking uses a count (not just boolean) during this power-up
- [ ] Multi-bounce does NOT affect orb-to-orb interactions
- [ ] Deflectors glow purple while power-up is active
- [ ] "x2" / "x3" text appears on each extra bounce
- [ ] Bounce audio pitch increases with successive bounces
- [ ] After power-up expires, new signals revert to single-bounce; in-flight signals that were already multi-bouncing finish their current trajectory

---

## Dependencies

- 009 (Power-Up Core System) — spawn, collection, HUD framework
