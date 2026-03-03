# 042 — Screen Manager & State Machine

**Priority:** T0 — Architecture Prerequisite
**Source:** Morgan (TL) review — A1

---

## Description

The current architecture uses a flat `GameState = 'menu' | 'playing' | 'gameover'` string with large `if/else` blocks in `update()`, `render()`, and tap handlers. The v1.2 feature set requires 8+ distinct screens with animated transitions, layered overlays (game over on top of game, achievement banners on top of game over), and navigation history.

Create a `ScreenManager` class that owns a stack of active screens. Each screen implements a standard lifecycle interface. The transition system (ticket 008) becomes a property of screen transitions rather than a standalone system.

### Architecture

```typescript
interface Screen {
  enter(from?: Screen): void;
  exit(to?: Screen): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  handleInput(input: InputEvent): boolean; // return true if consumed
}

class ScreenManager {
  private stack: Screen[];
  push(screen: Screen, transition?: Transition): void;
  pop(transition?: Transition): void;
  replace(screen: Screen, transition?: Transition): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```

### Migration from current code

- `Game.state` becomes the active screen ID
- `Game.updateMenu()` / `Game.updateGameOver()` move to `MenuScreen`, `GameOverScreen`
- `Renderer.renderMenu()` / `Renderer.renderGameOver()` move to respective screen classes
- The `RenderableGameState` interface (renderer.ts:82-153) becomes unnecessary — each screen renders itself

### Files affected

- `game.ts` — extract menu and game-over logic
- `renderer.ts` — extract screen-specific rendering
- `main.ts` — wire ScreenManager into game loop

---

## Acceptance Criteria

- [ ] `Screen` interface defined with `enter()`, `exit()`, `update(dt)`, `render(ctx)`, `handleInput()`
- [ ] `ScreenManager` supports push, pop, and replace with optional transition animations
- [ ] Screen stack allows overlays (e.g., achievement banner on top of gameplay)
- [ ] Input routing: topmost screen gets input first; returns `true` to consume, `false` to pass down
- [ ] Existing menu and game-over screens migrated to Screen implementations with no behavioral regressions
- [ ] Transition support: screens can define enter/exit animations with configurable duration and easing
- [ ] Input is blocked during transitions (rapid tapping doesn't queue multiple transitions)
- [ ] All existing keyboard shortcuts (1/A, 2/Z, 3/D) still work after migration

---

## Dependencies

- None (foundational — must be completed before tickets 001-008)
