# 026 — Unlockable Cosmetics

**Priority:** T2 — Depth
**Refs:** feature-specs.md §5.4 (US-PROG-03), product-vision.md §Part 4

---

## Description

Implement a cosmetic system with arena themes, deflector skins, and orb trail effects. Cosmetics are purely visual and do not affect gameplay. They are unlocked through the level system and selected from a menu accessible via the Stats/Profile screen.

### Arena Themes

| Theme | Background | Description |
|-------|-----------|-------------|
| Default | Dark navy (#0a0a1a) | Current look — blue accents |
| Nebula | Deep purple (#120a20) | Pink/purple star particles, cosmic feel |
| Ocean | Dark teal (#0a1a20) | Flowing wave particle patterns, calming |
| Sunset | Warm dark (#1a0f0a) | Orange/red ambient particles, intense |
| Void | Pure black (#000000) | Stark white ring, no ambient particles, minimal |
| Retro | Dark gray (#1a1a1a) | Pixelated elements, limited color palette, nostalgic |

### Deflector Skins

| Skin | Description |
|------|-------------|
| Default | White line with white glow (current) |
| Neon Green | Green (#44ff88) line with green glow |
| Fire Trail | Orange-red gradient with flame particles along the line |
| Ice Crystal | Light blue (#88ccff) with crystalline end caps and frost particles |
| Lightning | Jagged line (slight random offsets) with electric spark particles |
| Gold Plated | Gold (#ffcc44) with sparkle particles |

### Orb Trail Effects

| Trail | Description |
|-------|-------------|
| Default | Standard colored dots (current) |
| Sparkle | Twinkling star-shaped particles |
| Rainbow | Trail shifts through rainbow colors regardless of orb color |

### Core Skins (new category — see also ticket 047 for streak-exclusive skins)

| Skin | Description | Unlock |
|------|-------------|--------|
| Default | Blue ring (current) | Always unlocked |
| Heart | Pulses like a heartbeat | Level 6 |
| Eye | Tracks the nearest orb | Level 9 |
| Crystal | Faceted, prismatic reflections | Level 12 |
| Skull | For danger lovers | Level 15 |
| Phoenix | Animated flame | 30-day streak exclusive (ticket 047) |

---

## Acceptance Criteria

- [ ] Active cosmetics stored in localStorage (`deflect_cosmetics: {arena, deflector, trail, core}`)
- [ ] Cosmetics are purely visual; they do not affect gameplay
- [ ] Selecting a cosmetic shows a preview before confirming
- [ ] Cosmetics menu accessible from Stats/Profile screen
- [ ] Locked cosmetics show unlock requirement ("Reach Level X") or streak requirement
- [ ] Core Skins category implemented with selection and preview
- [ ] Theme constants extracted into a `Theme` interface (data-driven, not `if/else` branches)
- [ ] Each theme changes background, arena ring color, particle color palette, and core appearance
- [ ] Each deflector skin changes the visual appearance of drawn deflectors
- [ ] Each trail effect changes the particle trail behind all orbs
- [ ] Unlocked cosmetics tracked in localStorage (`deflect_unlocks`)

---

**Tech note (Morgan TL):** Extract theme constants into a data-driven `Theme` interface. The renderer reads colors from the active theme rather than hard-coded hex values. Deflector skins and trail effects become pluggable render strategies. Avoid `if (theme === 'nebula') { ... }` branches — every new theme doubles branching.

**Note (Alex PO):** The product vision lists additional cosmetics not in this ticket (Sakura, Deep Sea, Cyberpunk themes; Brush, Glass deflectors; Comet, Smoke, Geometric, None trails). This ticket covers a reasonable V1 subset. Additional cosmetics can be added as future tickets.

## Dependencies

- 024 (Level Unlocks) — which levels unlock which cosmetics
- 047 (Streak Rewards) — streak-exclusive cosmetics (Ember, Blaze, Inferno, Phoenix)
- 005 (Stats Screen) — cosmetics menu access point
