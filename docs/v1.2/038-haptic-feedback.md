# 038 — Haptic Feedback System

**Priority:** T2 — Depth
**Refs:** product-vision.md §Part 7, feature-specs.md §2.4

---

## Description

Implement haptic feedback (vibration) on mobile devices that support it. Haptic feedback adds a tactile dimension to the game that makes actions feel more satisfying and responsive. Controlled by a toggle in Settings.

### Haptic Events

| Event | Intensity | Pattern |
|-------|-----------|---------|
| Deflector draw (swipe) | Light pulse | Single short vibration |
| Successful catch | Medium pulse | Single medium vibration |
| Core damage | Heavy pulse | Single strong vibration |
| Combo milestone (5x, 10x, 15x) | Pattern pulse | Rhythmic burst pattern |
| Giant orb approaching core | Sustained warning | Continuous low vibration |
| Bomb orb core hit | Heavy double pulse | Two strong vibrations |
| New high score (mid-game) | Celebration | Triple quick pulse |

---

## Acceptance Criteria

- [ ] Haptic feedback uses the Vibration API (`navigator.vibrate()`)
- [ ] Haptic toggle in Settings controls all vibration (default: ON)
- [ ] Haptic only fires on devices that support it (feature detection)
- [ ] No errors or warnings on devices without vibration support
- [ ] Each event has a distinct vibration pattern (distinguishable by feel)
- [ ] Light, medium, and heavy intensities are perceptibly different
- [ ] Haptic does not fire when the setting is OFF
- [ ] Haptic events do not cause frame drops or performance issues

---

## Dependencies

- 004 (Settings) — haptic toggle
