# V1 Ship Blockers Design

**Date:** 2026-03-01
**Source:** product-review.md V1 Minimum Feature Set
**Execution:** 3 parallel worktrees

---

## Scope

7 blockers from product review + sound mute toggle:

1. Fix PWA (icons + service worker)
2. Add Retry button to game over screen
3. Add date to Daily Challenge share card
4. Daily Challenge streak counter
5. Basic analytics beacon (no-op stub, Convex deferred to V1.1)
6. Personal best per mode on menu
7. Sound mute toggle

## Worktree Strategy

### WT1: Game Over Retry + Per-Mode Bests
**Files:** `renderer.ts`, `game.ts`, `score.ts`, `types.ts`

**Retry button:**
- Add `retryButtonY`, `menuButtonY` to `Renderer`
- `renderGameOver()`: replace "TAP TO CONTINUE" with side-by-side `[RETRY]` (blue) + `[MENU]` (grey) buttons
- Button width: `Math.min(width * 0.35, 140)`, height 42px, 20px gap
- `updateGameOver()`: hit-test retry → `startGame(this.mode)`, menu → `state = 'menu'`
- Keyboard: R = retry, Escape = menu, Enter/Space = retry

**Per-mode bests:**
- `ScoreManager.modeBests: Record<GameMode, number>`
- localStorage keys: `deflect_best_arcade`, `deflect_best_zen`, `deflect_best_daily`
- Update `loadHighScores()`, `saveHighScores()`, `finalizeScores()`
- Keep global `highScore` as max across modes
- `renderMenu()`: show "BEST: {n}" below each mode button
- Update `RenderableGameState` to expose `modeBests`

### WT2: Daily Challenge Enhancements
**Files:** `share.ts`, `score.ts` (streak methods only), `renderer.ts` (streak display only), `game.ts` (onGameOver streak call)

**Streak counter:**
- `ScoreManager.dailyStreak: number`
- localStorage: `deflect_streak` → `{ lastDate: "YYYY-MM-DD", count: number }`
- `loadDailyStreak()`: validate lastDate is yesterday or today
- `updateDailyStreak()`: yesterday → increment, today → no-op, else → reset to 1
- Called from `onGameOver()` when `mode === 'daily'`
- Display near DAILY button on menu when streak > 0

**Date on share card:**
- `generateScoreCard()`: when `mode === 'daily'`, format date as "Mon DD"
- Line 1: `DEFLECT DAILY Mar 1 🟥🟦🟩🟨`

### WT3: Infrastructure
**Files:** `public/*`, `src/analytics.ts` (new), `audio.ts`, `song-player.ts`, `main.ts`, `index.html`, `manifest.json`, `vite.config.ts`

**PWA fix:**
- Create SVG icon (neon style, #0a0a1a bg, neon blue circle, "D")
- Generate 192px + 512px PNGs
- Update manifest.json: add short_name, theme_color, background_color
- Verify vite-plugin-pwa SW generation

**Analytics stub:**
- `track(event, props)` → `console.debug('[analytics]', event, props)`
- Call sites: page_view, game_start, game_over, share_initiated
- Designed for easy Convex swap in V1.1

**Sound mute toggle:**
- `audio.muted` flag, `toggleMute()`, guard all `playTone()` calls
- `SongPlayer.setMuted()` for HTMLAudioElement
- Render speaker icon top-right on menu + during gameplay
- Hit-test mute button in `updateMenu()` and `update()`
- Persist: `deflect_muted` in localStorage

## Merge Order

1. WT3 (Infrastructure) — no conflicts with other WTs
2. WT2 (Daily) — minor score.ts additions, no overlap with WT1
3. WT1 (Game Over + Bests) — largest changes to renderer.ts and game.ts, merge last
