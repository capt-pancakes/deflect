# 033 — Enhanced Share System

**Priority:** T2 — Depth
**Refs:** feature-specs.md §7.1 (US-SOC-01), product-vision.md §Part 6

---

## Description

Redesign the share system to support both the existing text-based emoji card and a new canvas-rendered image card. The share flow presents both options in a bottom sheet. The existing text share must not regress.

### Enhanced Text Card Format (from product vision)

```
DEFLECT DAILY #47
SPEED DEMON modifier

1,240 pts | 78s | 12x combo
Red: ████ Green: ██ Blue: ███ Yellow: █
[accuracy bar] 87%

Streak: 14 days
```

Additions over current format: daily challenge number, modifier name, streak count.

### Image Card (new)

- Canvas-rendered image (400x600px)
- Dark background matching game theme
- "DEFLECT" title at top
- Mode and date
- Score in large bold text
- Stats (survived, combo, accuracy) in clean layout
- Color performance blocks (colored squares)
- "Challenge me!" call-to-action text

### Share Flow

1. Player taps "SHARE" on game over
2. Bottom sheet: "Copy Text" and "Share Image"
3. "Copy Text" = existing clipboard behavior
4. "Share Image" = generates canvas image, uses Web Share API if available, falls back to PNG download

---

## Acceptance Criteria

- [ ] Text share still works exactly as today (no regression)
- [ ] Text share includes daily challenge number, modifier name, and streak count (when applicable)
- [ ] Image share generates a clean, correctly-sized image (400x600px)
- [ ] Image share uses `navigator.share()` with file blob where supported
- [ ] Fallback: image downloads as PNG if share API not available
- [ ] Share bottom sheet has a "Cancel" tap zone (tap outside to dismiss)
- [ ] Share bottom sheet slides up with 250ms animation
- [ ] Image card matches the DEFLECT neon dark aesthetic

---

## Dependencies

- 007 (Game Over Screen) — share button location
