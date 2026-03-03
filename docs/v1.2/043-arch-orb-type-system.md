# 043 — Entity / Orb Type System Refactor

**Priority:** T0 — Architecture Prerequisite
**Source:** Morgan (TL) review — A2

---

## Description

The current `Signal` interface (types.ts) is a flat struct with `color: SignalColor` where `SignalColor = 'red' | 'blue' | 'green' | 'yellow'`. It has no mechanism for orb-type-specific behavior. Tickets 017-022 require orbs with different speeds, point multipliers, phase-through logic, split-on-deflect, any-port-matching, accelerating animations, and variable core damage.

Refactor the Signal type to support orb type variations through data-driven configuration rather than scattered `if/else` chains.

### Proposed Signal Extension

```typescript
type OrbType = 'standard' | 'gold' | 'rainbow' | 'splitter' | 'ghost' | 'bomb' | 'giant';

interface Signal {
  // ... existing fields
  orbType: OrbType;
  bounceCount: number;       // replaces boolean `deflected` — for multi-bounce and ghost tracking
  pointMultiplier: number;   // 1x standard, 3x gold, 5x giant
  damageOnCoreHit: number;   // 1 standard, 2 bomb, 3 giant
  matchesAnyPort: boolean;   // true for rainbow, bomb
  phaseThrough: number;      // ghost: starts at 1, decrements on deflector contact
}
```

### Orb Type Config Registry

```typescript
interface OrbTypeConfig {
  type: OrbType;
  speedMultiplier: number;
  radiusMultiplier: number;
  pointMultiplier: number;
  coreDamage: number;
  matchesAnyPort: boolean;
  initialPhaseThrough: number;
}
```

Push behavior differences into `CollisionSystem` and a new `OrbBehavior` lookup rather than `if/else` chains in `Game`.

### Files affected

- `types.ts` — Signal interface, OrbType union
- `collision.ts` — orb-type-aware collision handling
- `game.ts` — `spawnSignal()`, `handleCollisionEvent()`
- `renderer.ts` — `renderSignals()` for type-specific rendering

---

## Acceptance Criteria

- [ ] `Signal.deflected: boolean` replaced with `Signal.bounceCount: number` (0 = not deflected)
- [ ] All existing code that checks `signal.deflected` migrated to `signal.bounceCount > 0`
- [ ] `OrbType` discriminated union defined
- [ ] `OrbTypeConfig` registry created with default configs for all planned orb types
- [ ] `spawnSignal()` accepts `OrbType` parameter and reads config from registry
- [ ] Collision system uses `signal.matchesAnyPort` instead of hardcoded color checks
- [ ] Collision system uses `signal.phaseThrough` for ghost orb pass-through logic
- [ ] Collision system supports returning `spawnSignals` for splitter orb child creation
- [ ] All existing tests pass after refactor (no behavioral changes for standard orbs)
- [ ] Port magnetism check uses `bounceCount > 0` instead of `deflected === true`

---

## Dependencies

- None (foundational — must be completed before tickets 016-022)
