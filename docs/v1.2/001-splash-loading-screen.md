# 001 — Splash / Loading Screen

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §2.1 (US-MENU-01), product-vision.md §Part 2

---

## Description

Add a branded splash screen that displays immediately on page load while assets (audio context, fonts, localStorage) initialize. The screen auto-transitions to the Main Menu once loading completes, providing visual continuity with the title staying in place while menu elements animate in.

The splash should reinforce the DEFLECT brand identity with a pulsing glow effect on dark background and give the player a clear signal that the game is loading.

---

## Acceptance Criteria

- [ ] Splash displays within 200ms of page load
- [ ] Dark background (#0a0a1a) with "DEFLECT" title centered in white bold text
- [ ] Subtle pulsing blue glow behind the title (#4488ff shadow, oscillates over 1s)
- [ ] Thin horizontal progress bar below title fills as audio context, fonts, and localStorage are initialized
- [ ] Auto-transitions to Main Menu after load completes (target: under 1.5s on 4G)
- [ ] If load takes longer than 3s, show "Tap to start" fallback text
- [ ] Transition to Main Menu: title stays in place, progress bar fades out, menu elements fade/slide in from below over 300ms
- [ ] Bundle stays under 200KB to keep load near-instant on 3G

---

## Dependencies

- 002 (Main Menu Redesign) — transition target
- 008 (Screen Transitions) — shared transition system
