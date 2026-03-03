# 008 — Screen Transition Definitions

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §2.8, product-vision.md §Part 2
**Note:** This ticket defines the transition animations. The architecture that enables them is in ticket 042 (Screen Manager).

---

## Description

Implement a unified screen transition system that handles all navigation animations between screens. Transitions should feel polished and intentional, with consistent easing and timing. The system must respect the Reduced Motion preference by falling back to instant cuts with simple opacity crossfades.

### Transition Table

| From | To | Animation | Duration |
|------|----|-----------|----------|
| Splash | Main Menu | Title stays, elements fade/slide up | 300ms |
| Main Menu | Playing | Arena zooms in, menu fades out | 400ms |
| Main Menu | Settings | Settings slides in from right | 250ms |
| Settings | Main Menu | Settings slides out to right | 250ms |
| Main Menu | Stats | Stats slides in from left | 250ms |
| Stats | Main Menu | Stats slides out to left | 250ms |
| Main Menu | Daily Hub | Daily Hub slides up from bottom | 300ms |
| Daily Hub | Main Menu | Slides down | 300ms |
| Playing | Game Over | Dark overlay fades in, staggered elements | 400ms |
| Game Over | Playing (Retry) | Quick flash-to-white wipe | 200ms |
| Game Over | Main Menu | Fade to dark, menu fades in | 350ms |

---

## Acceptance Criteria

- [ ] All transitions use consistent easing curves (ease-out for entries, ease-in for exits)
- [ ] Transition durations match the table above (+/- 50ms acceptable)
- [ ] Reduced Motion: all transitions become instant cuts (0ms) with a simple opacity crossfade (150ms)
- [ ] No sliding, zooming, or scaling animations when Reduced Motion is active
- [ ] Transitions are interruptible (rapid tapping doesn't queue multiple transitions)
- [ ] Arena zoom-in transition on mode select feels like "entering" the game
- [ ] Retry transition (game over to playing) is sub-200ms — instant feel
- [ ] No visual glitches during transitions (no flash of wrong state)

---

## Dependencies

- **042 (Screen Manager)** — architectural foundation (must be completed first)
- 004 (Settings) — Reduced Motion preference
- All screen tickets (001-007) — transition sources/targets
