# 047 — Streak Reward Cosmetics

**Priority:** T1 — Core Retention Loop
**Source:** Alex (PO) review — M4; product-vision.md Part 4

---

## Description

Implement escalating cosmetic rewards at daily challenge streak milestones. The streak flame without rewards is just a number — the cosmetic rewards create the "I can't break my streak" feeling that drives D7+ retention.

### Streak Milestone Rewards

| Streak | Reward | Type |
|--------|--------|------|
| 3 days | "Ember" | Deflector trail — orange glow particles along deflector |
| 7 days | "Blaze" | Arena theme — warm red/orange background with fire particles |
| 14 days | "Inferno" | Orb trail — fiery trail behind all orbs |
| 30 days | "Phoenix" | Core skin — animated flame around core (most prestigious cosmetic) |

### Unlock Flow

1. Player completes daily challenge, incrementing streak
2. If streak hits a milestone threshold, trigger celebration overlay
3. Celebration shows the unlocked cosmetic with preview and "UNLOCKED!" text
4. Cosmetic is added to `deflect_unlocks` and optionally auto-equipped
5. Streak rewards are permanent — once unlocked, they persist even if the streak breaks

### Core Skins (new cosmetic category)

This ticket also introduces the **Core Skin** cosmetic category (from product vision Part 4). Core skins change the visual appearance of the center core.

| Skin | Description | Unlock |
|------|-------------|--------|
| Default | Blue ring (current) | Always unlocked |
| Heart | Pulses like a heartbeat | Level 6 |
| Eye | Tracks the nearest orb | Level 9 |
| Crystal | Faceted, prismatic reflections | Level 12 |
| Skull | For players who love danger | Level 15 |
| Phoenix | Animated flame | 30-day streak |

---

## Acceptance Criteria

- [ ] Streak milestone rewards trigger at 3, 7, 14, and 30 consecutive daily challenge completions
- [ ] Celebration overlay shows unlocked cosmetic name, preview, and "UNLOCKED!" text
- [ ] Unlocked streak cosmetics persist permanently (not lost on streak break)
- [ ] Core Skins added as a new cosmetic category alongside arena themes, deflector skins, and trails
- [ ] Core skin selection added to cosmetics menu
- [ ] Phoenix core skin is exclusively a 30-day streak reward (cannot be unlocked any other way)
- [ ] `deflect_cosmetics` schema extended to include `core` field
- [ ] Streak rewards are visible as goals on the Daily Challenge Hub streak section

---

## Dependencies

- 006 (Daily Challenge Hub) — streak tracking and display
- 026 (Cosmetics) — cosmetic system and menu
- 045 (Persistence Layer) — storage for cosmetics and unlocks
