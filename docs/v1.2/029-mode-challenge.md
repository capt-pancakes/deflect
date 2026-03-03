# 029 — Challenge Mode (Weekly)

**Priority:** T3 — Variety
**Refs:** feature-specs.md §6.1 (US-MODE-01), product-vision.md §Part 3

---

## Description

Implement a weekly rotating Challenge Mode where each week brings a unique modifier that changes one gameplay rule. Players can attempt challenges unlimited times during the week, with their best score recorded. Unlocks at Level 3.

### Challenge Modifier Pool

| Modifier | Description | Rules Change |
|----------|-------------|-------------|
| One Wall | "Only 1 deflector allowed at a time" | maxDeflectors = 1 |
| Speed Demon | "Everything moves 1.5x faster" | signalSpeed * 1.5 |
| Glass Cannon | "1 HP, huge score multiplier" | coreHP = 1, all points x3 |
| Color Blind | "All orbs are white; ports still colored" | Orb rendering ignores color (white) but color still matters |
| Bomb Squad | "Bomb orbs only, all game long" | Only bomb orbs spawn |
| Mirror Mode | "Deflectors bounce in opposite direction" | Reflection angle inverted |
| Tiny Arena | "Arena radius is 60% of normal" | arenaRadius * 0.6 |
| Rapid Fire | "3x spawn rate, slower movement" | spawnInterval / 3, signalSpeed * 0.6 |

### Challenge Select UI

- This week's challenge: modifier name, description, icon
- Best score displayed below
- "PLAY" button to start
- Upcoming next week's challenge teaser (grayed out)

---

**Note:** This is the WEEKLY challenge mode with extreme modifiers. The DAILY challenge has its own lighter-weight modifier pool (ticket 046). The pools are distinct.

## Acceptance Criteria

- [ ] New challenge every Monday at 00:00 UTC
- [ ] Challenge rotation is deterministic (all players see same challenge on same week)
- [ ] Challenge seed derived from week number
- [ ] Players can attempt unlimited times during the week; best score saved
- [ ] Challenge results stored separately from Arcade high scores (`deflect_challenges: {[weekId]: bestScore}`)
- [ ] Modifier effects applied on top of the standard difficulty ramp
- [ ] Unlocks at Level 3
- [ ] Challenge select UI shows modifier name, description, best score, and play button
- [ ] Next week's challenge teaser visible but grayed out

---

**Tech note (Morgan TL):** "Mirror Mode" inverts the reflection angle, not the normal. Inverting the normal would bounce signals THROUGH the deflector. Define modifier effects as config overrides + behavior flags, not code branches: `invertReflection: boolean` flag checked in collision system.

## Dependencies

- 003 (Mode Select Cards) — locked/unlocked mode display
- 024 (Level Unlocks) — unlock at Level 3
- 021 (Bomb Orb) — required for "Bomb Squad" modifier (exclude modifier until implemented)
- 045 (Persistence Layer) — challenge score storage
