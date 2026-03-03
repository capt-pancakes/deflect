# 031 — Puzzle Mode

**Priority:** T4 — Polish
**Refs:** feature-specs.md §6.3 (US-MODE-03)
**Note:** This mode is a new proposal — not in the product vision, which describes Practice Mode and Gauntlet Mode instead. This is the single most complex ticket in the set.

---

## Description

Implement Puzzle Mode — a series of 20+ hand-crafted puzzles with fixed starting states. Players place a limited number of deflectors, then tap "GO" to start physics. Star rating system rewards optimal solutions. Unlocks at Level 8.

### Gameplay Flow

1. Puzzle loads: orbs are frozen in place, ports visible, core visible
2. Player draws deflectors (limited count shown in HUD: "Walls: 2/2")
3. Player taps "GO" to start physics
4. Orbs move and interact with deflectors and ports
5. Success: all orbs caught → star rating + "NEXT PUZZLE"
6. Failure: any orb hits core or escapes → "RETRY" (instant reset)

### Star Rating

- 1 star: all orbs caught
- 2 stars: completed under time limit
- 3 stars: completed with minimum deflectors used

### Puzzle Select UI

- Grid of numbered puzzle cards (4 columns)
- Completed puzzles show star count (1-3)
- Locked puzzles show padlock
- Completing puzzle N unlocks puzzle N+1

---

## Acceptance Criteria

- [ ] Puzzle definitions stored as JSON data (positions, velocities, colors, deflector limit)
- [ ] Deflectors placed during planning phase do not decay until "GO" is pressed
- [ ] After "GO", deflectors decay normally (3s lifetime)
- [ ] Star rating criteria displayed before the puzzle starts
- [ ] Player can clear placed deflectors before pressing "GO" (undo last, or clear all)
- [ ] Puzzle progress (completion + stars) persists in localStorage (`deflect_puzzles`)
- [ ] At least 20 puzzles available at launch
- [ ] Unlocks at Level 8
- [ ] Completing puzzle N unlocks puzzle N+1 (sequential)
- [ ] Retry is instant (no transition delay)

---

**Tech note (Morgan TL):** Fundamental architecture mismatch with the current game loop. The real-time game loop cannot support a planning phase with frozen orbs, undo, and a "GO" button. Implement as a separate `PuzzleGameScreen` class (not a mode flag on Game). Reuses CollisionSystem, ParticleSystem, Renderer but has its own lifecycle. Puzzle data authoring (20+ puzzles with balanced difficulty) is a separate content creation workstream — flag this.

## Dependencies

- 003 (Mode Select Cards) — locked/unlocked display
- 024 (Level Unlocks) — unlock at Level 8
- 042 (Screen Manager) — separate screen implementation required
