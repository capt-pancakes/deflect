# 004 — Settings Screen

**Priority:** T1 — Core Retention Loop
**Refs:** feature-specs.md §2.4 (US-MENU-04), product-vision.md §Part 2

---

## Description

Add a dedicated Settings screen accessible from the Main Menu gear icon. Players need control over sound, music, visual effects, and data management. Settings persist to localStorage and take effect immediately.

### Settings List

| Setting | Control Type | Default | Details |
|---------|-------------|---------|---------|
| Sound Effects | Toggle | ON | Mutes all SFX (swipe, bounce, catch, damage, game over) |
| Music | Toggle | ON | Mutes procedural music engine |
| Music Volume | Slider (0-100%) | 80% | Only visible when Music is ON |
| SFX Volume | Slider (0-100%) | 100% | Only visible when Sound Effects is ON |
| Reduced Motion | Toggle | Matches OS | Disables screen shake, reduces particle count, disables slow-mo |
| Haptic Feedback | Toggle | ON | Vibration on swipe, catch, and damage (if device supports it) |
| Show FPS | Toggle | OFF | Developer option: shows frame rate counter top-right |
| Color Accessibility | Toggle | OFF | Shape indicators on orbs for color-blind players (see ticket 039) |
| Reset Progress | Button (red) | — | Confirmation dialog required |
| Export Save Data | Button | — | Downloads save data as JSON file |
| Import Save Data | Button | — | Loads save data from JSON file |
| About | Link | — | Overlay with version, credits, source link |

---

## Acceptance Criteria

- [ ] All settings persist to localStorage under `deflect_settings`
- [ ] Reduced Motion toggle overrides OS-level `prefers-reduced-motion` when explicitly set
- [ ] Music volume change takes effect immediately (no restart needed)
- [ ] SFX volume change takes effect immediately
- [ ] Conditional visibility: volume sliders hidden when their parent toggle is OFF
- [ ] Reset Progress requires a two-step confirmation (button turns red, tap again to confirm)
- [ ] Reset Progress erases all localStorage keys with `deflect_` prefix
- [ ] Back arrow in top-left returns to Main Menu
- [ ] Transition: slide in from right, slide out to right on back
- [ ] All controls have touch targets >= 44x44px
- [ ] Color Accessibility toggle controls shape indicators (see ticket 039)
- [ ] Export produces a downloadable JSON file of all `deflect_*` data
- [ ] Import validates JSON and loads data (with confirmation prompt)

**Tech note (Morgan TL):** Canvas has no native slider/range input controls. Strongly recommend implementing Settings as an HTML overlay (not canvas-rendered) for native form controls, accessibility, and scroll support. Style with CSS to match game aesthetic.

**Tech note (Morgan TL):** The current audio system has no volume control — `audio.ts` uses fixed `volume` in `playTone()` and `SongPlayer` has no volume property. Volume support must be added to both systems as part of this ticket.

---

## Dependencies

- 002 (Main Menu) — navigation source
- 041 (localStorage Schema) — storage format
