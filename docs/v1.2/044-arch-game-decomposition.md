# 044 — Game Class Decomposition

**Priority:** T0 — Architecture Prerequisite
**Source:** Morgan (TL) review — A3

---

## Description

The `Game` class is currently a 1,160-line god object responsible for entity management, game loop, input handling, collision dispatch, scoring, tutorial orchestration, difficulty ramping, music management, and screen-specific UI logic. Adding power-ups, new orb types, 4 new modes, achievements, XP, and cosmetics to this class will make it unmaintainable (estimated 5,000+ lines).

Extract focused modules so that `Game` becomes a thin coordinator that delegates to specialized systems.

### Extraction Plan

| New Module | Responsibility | Extracts From |
|-----------|---------------|---------------|
| `GameSession` | Active gameplay state (signals, deflectors, ports, elapsed time, score) | `Game` entity arrays + scoring logic |
| `PowerUpManager` | Power-up spawning, activation, timer, HUD state | New (ticket 009 will implement against this interface) |
| `AchievementTracker` | Check conditions, fire events, track unlocks | New (ticket 025 will implement against this interface) |
| `XPCalculator` | Compute XP at game end from stats | New (ticket 023 will implement) |
| `ProgressionManager` | Level, unlocks, milestones, cosmetics | New (tickets 024, 026, 028 will implement) |

### Event Hooks

The decomposed systems need event hooks into the game loop:

```typescript
interface GameEventListener {
  onCatch?(color: SignalColor, combo: number, score: number): void;
  onMiss?(color: SignalColor): void;
  onCoreDamage?(damage: number, remainingHP: number): void;
  onDeflect?(signal: Signal): void;
  onNearMiss?(signal: Signal): void;
  onGameOver?(stats: GameStats): void;
}
```

`Game` fires events; registered listeners (AchievementTracker, MilestoneManager, etc.) respond.

---

## Acceptance Criteria

- [ ] `GameSession` class created, owns signals, deflectors, ports, core HP, score, combo, elapsed time
- [ ] `GameEventListener` interface defined with hooks for catch, miss, damage, deflect, near-miss, game-over
- [ ] `Game` class fires events through listener interface
- [ ] `Game` class reduced by at least 40% in line count
- [ ] All existing tests pass after decomposition (no behavioral changes)
- [ ] New systems can register as event listeners without modifying `Game`
- [ ] Tutorial system still functions correctly after decomposition

---

## Dependencies

- None (foundational — should be done alongside or after 042)
