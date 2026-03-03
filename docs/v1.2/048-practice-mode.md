# 048 — Practice Mode

**Priority:** T2 — Depth
**Source:** Alex (PO) review — M1; product-vision.md Part 3

---

## Description

Implement Practice Mode — a no-stakes sandbox where players choose specific difficulty settings and practice without scoring or HP loss. The product vision specifically calls this a retention tool: "Geometry Dash proved that giving players a way to practice specific sections dramatically increases retention because it reduces frustration."

### Settings (player-configurable)

- Number of colors: 1, 2, 3, or 4
- Orb speed: Slow, Medium, Fast
- Spawn rate: Low, Medium, High
- Orb types: Standard only, or include specific types (gold, rainbow, etc.)

### Gameplay Rules

- No scoring
- No HP loss (core is invulnerable)
- No power-up spawns
- No time limit
- Exit via pause/menu button
- Per-color accuracy shown in HUD

---

## Acceptance Criteria

- [ ] Practice Mode selectable from Mode Select Cards (always unlocked)
- [ ] Settings screen shown before practice session starts (color count, speed, spawn rate)
- [ ] No score tracking during practice
- [ ] Core is invulnerable (no HP damage)
- [ ] Per-color accuracy displayed in HUD
- [ ] No power-ups spawn
- [ ] Player can exit via menu button at any time
- [ ] No game over screen — exiting returns directly to menu
- [ ] Settings choices do not persist between sessions (reset to defaults each time)

---

## Dependencies

- 003 (Mode Select Cards) — mode card entry
- 042 (Screen Manager) — settings screen before gameplay
