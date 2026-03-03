# 046 — Daily Challenge Modifier Pool

**Priority:** T1 — Core Retention Loop
**Source:** Alex (PO) review — M3; product-vision.md Part 3
**Note:** The daily challenge without modifiers is just "play Arcade with a seed." The modifiers ARE the feature.

---

## Description

Define and implement the daily challenge modifier system. Each day's challenge applies a unique modifier that changes one gameplay rule, making every day's challenge feel different. The modifier is selected deterministically from the pool based on the daily seed.

This is distinct from the weekly Challenge Mode modifiers (ticket 029). Daily modifiers are lighter-weight tweaks; weekly modifiers are more extreme.

### Daily Modifier Pool

| Modifier | Description | Config Override |
|----------|-------------|----------------|
| Speed Demon | "Orbs move 40% faster, ports 30% wider" | `signalSpeed * 1.4`, `portWidth * 1.3` |
| Minimalist | "Only 1 deflector at a time" | `maxDeflectors = 1` |
| Color Blind | "All orbs start gray, reveal color when deflected" | Render override: orbs white until `bounceCount > 0` |
| Boss Rush | "Boss waves every 20 seconds" | Dense same-color clusters spawn every 20s |
| Fragile | "Core has 2 HP" | `coreHP = 2` |
| Generous | "8 HP but no combo multiplier" | `coreHP = 8`, combo multiplier locked at 1x |
| Backwards | "Ports rotate slowly clockwise" | Ports rotate at 0.1 rad/s during play |
| Rainbow | "Rainbow orbs only, worth 1x" | All spawns are rainbow type (requires ticket 018) |

### Technical Approach (from Morgan TL)

Implement modifiers as `GameConfig` overrides applied at game start:

```typescript
interface DailyModifier {
  id: string;
  name: string;
  description: string;
  configOverrides: Partial<GameConfig>;
  renderOverrides?: Partial<RenderConfig>;
}
```

The daily seed selects a modifier deterministically: `modifierIndex = dailySeed % modifierPool.length`.

---

## Acceptance Criteria

- [ ] At least 8 modifiers defined in the pool
- [ ] Modifier selection is deterministic based on daily seed (same for all players)
- [ ] Modifier name and description are shown on the Daily Challenge Hub before playing
- [ ] Modifier effects are applied as config overrides at game start (not scattered conditionals)
- [ ] Each modifier is visually communicated during gameplay (e.g., Color Blind shows white orbs)
- [ ] Modifier effects do not break any other game system (power-ups, orb types, etc.)
- [ ] "Rainbow" modifier only available after rainbow orb (018) is implemented; gracefully falls back
- [ ] Share card includes the modifier name

---

## Dependencies

- 006 (Daily Challenge Hub) — display modifier info
- 018 (Rainbow Orb) — required for "Rainbow" modifier (can gracefully exclude until implemented)
