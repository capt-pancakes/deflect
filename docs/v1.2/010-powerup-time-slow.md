# 010 — Time Slow Power-Up

**Priority:** T2 — Depth
**Refs:** feature-specs.md §3.2.1 (US-PWR-02), product-vision.md §Part 3

---

## Description

Implement the Time Slow power-up. When activated, all signal movement speed is reduced to 40% of current speed for 5 seconds. The player's swipe input and deflector draw speed are unaffected, giving the player a tactical window to handle overwhelming waves.

| Property | Value |
|----------|-------|
| Icon | Hourglass |
| Color | Cyan (#44ddff) |
| Duration | 5 seconds |
| Effect | All signal movement speed reduced to 40%; deflectors draw at normal speed |
| Visual | Blue-tinted screen overlay, signal trails become longer and more visible |
| Audio | Low-pass filter on all sounds, pitch drops |

---

## Acceptance Criteria

- [ ] Player's swipe input is unaffected (only signals slow down)
- [ ] Deflector lifetime still ticks at normal rate (3s real-time)
- [ ] Duration timer visible in HUD as shrinking ring around power-up icon
- [ ] Speed returns to normal with a 0.5s ease-out (not instant snap)
- [ ] Blue-tinted screen overlay visible during effect
- [ ] Signal trails are longer/more visible during slow-down
- [ ] Low-pass audio filter applied during effect
- [ ] Distinct from the existing near-miss slow-mo (this is player-controlled, longer duration)

**Tech note (Morgan TL):** The game has two existing slow-mo systems: near-miss (`timeScaleTarget = 0.3`, game.ts:1039) and tutorial (`timeScaleTarget = 0.1-0.7`). Time Slow CANNOT use the existing `timeScale` mechanism because it must slow signals WITHOUT slowing deflector decay, particles, or animation timers. Implement as a separate `signalSpeedMultiplier` field on GameSession (default 1.0, Time Slow sets to 0.4). Apply in `updateSignals()` only.

**Slow-mo precedence:** If Time Slow is active and a near-miss triggers, the lower value (more dramatic) takes precedence. Time Slow resumes after the near-miss snap-back.

---

## Dependencies

- 009 (Power-Up Core System) — spawn, collection, HUD framework
