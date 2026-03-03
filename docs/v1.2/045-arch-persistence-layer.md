# 045 — Unified Persistence Layer

**Priority:** T0 — Architecture Prerequisite
**Source:** Morgan (TL) review — A4

---

## Description

localStorage usage is currently scattered across `ScoreManager` (6 keys), `audio` (1 key), `PwaPrompt` (1 key), and `TutorialManager` (1 key) with no unified read/write layer. The v1.2 schema (ticket 041) defines 14+ keys with complex nested JSON. Without a unified layer, every feature will independently implement serialization, defaults, and migration.

Create a `PlayerData` singleton class that centralizes all persistence with typed access, sensible defaults, and schema migration.

### Architecture

```typescript
class PlayerData {
  private static instance: PlayerData;
  private data: DeflectSaveData;

  static getInstance(): PlayerData;

  // Typed getters
  get highScore(): number;
  get xp(): number;
  get level(): number;
  get achievements(): number[];
  get stats(): PlayerStats;
  get streak(): StreakData;
  get settings(): GameSettings;
  get cosmetics(): CosmeticSelection;
  // ... etc

  // Typed setters (auto-save)
  addXP(amount: number): { newTotal: number; leveledUp: boolean; newLevel?: number };
  unlockAchievement(id: number): boolean; // returns true if newly unlocked
  recordGame(result: GameResult): void;
  updateStreak(): void;

  // Lifecycle
  save(): void;          // batches all writes
  reset(): void;         // clears all deflect_* keys
  export(): string;      // JSON string for data export
  import(json: string): boolean;  // returns true if valid

  // Migration
  private migrate(fromVersion: number): void;
}
```

### Migration Strategy

- Add `deflect_schema_version: number` key
- On load, if version is missing or < current, run migrations sequentially
- Each migration is a function: `migrate_v1_to_v2(data) => data`
- Keep migrations in a dedicated `migrations.ts` file
- Wrap all localStorage writes in try/catch (Safari private mode has 0 bytes quota)

---

## Acceptance Criteria

- [ ] `PlayerData` singleton created with typed getters/setters for all `deflect_*` keys
- [ ] All existing scattered localStorage reads/writes migrated to use `PlayerData`
- [ ] Missing keys return sensible defaults (never crashes or returns undefined)
- [ ] `deflect_schema_version` key tracks schema version
- [ ] Migration framework runs sequentially from old version to current
- [ ] `reset()` clears all `deflect_*` keys
- [ ] `save()` batches writes (not one write per field change)
- [ ] All localStorage writes wrapped in try/catch with graceful degradation
- [ ] Total storage stays under 100KB for typical player (verify with test)
- [ ] `export()` and `import()` support data portability
- [ ] All existing tests pass after migration

---

## Dependencies

- None (foundational — implement FIRST among all T1 tickets)
- Supersedes the data layer portions of ticket 041
