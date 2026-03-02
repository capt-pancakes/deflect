# V1 Ship Blockers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all 7 V1 ship blockers from the product review to make DEFLECT ship-ready.

**Architecture:** Three parallel worktrees targeting independent file clusters. WT1 handles game over UX + per-mode bests (renderer, game, score). WT2 handles daily challenge enhancements (share, score streak, renderer streak display). WT3 handles infrastructure (PWA icons, analytics stub, sound mute). Merge order: WT3 → WT2 → WT1.

**Tech Stack:** TypeScript, Vite, Canvas2D, Web Audio API, localStorage, vitest

---

## Worktree 1: Game Over Retry + Per-Mode Bests

### Task 1: Per-Mode Bests — ScoreManager

**Files:**
- Modify: `src/score.ts:5-118`
- Test: `src/__tests__/score.test.ts`

**Step 1: Write failing tests for per-mode bests**

Add to `src/__tests__/score.test.ts` after the existing `saveHighScores` describe block (after line 279):

```typescript
describe('per-mode bests', () => {
  it('starts with zeroed modeBests', () => {
    expect(sm.modeBests).toEqual({ arcade: 0, zen: 0, daily: 0 });
  });

  it('finalizeScores updates modeBests for arcade', () => {
    sm.score = 500;
    sm.finalizeScores('arcade');
    expect(sm.modeBests.arcade).toBe(500);
  });

  it('finalizeScores updates modeBests for zen', () => {
    sm.score = 300;
    sm.finalizeScores('zen');
    expect(sm.modeBests.zen).toBe(300);
  });

  it('finalizeScores does not downgrade modeBests', () => {
    sm.modeBests.arcade = 1000;
    sm.score = 500;
    sm.finalizeScores('arcade');
    expect(sm.modeBests.arcade).toBe(1000);
  });

  it('loadHighScores loads per-mode bests from localStorage', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => {
        if (key === 'deflect_best_arcade') return '1200';
        if (key === 'deflect_best_zen') return '800';
        if (key === 'deflect_best_daily') return '600';
        return null;
      }),
      setItem: vi.fn(),
    });

    sm.loadHighScores();
    expect(sm.modeBests).toEqual({ arcade: 1200, zen: 800, daily: 600 });

    vi.unstubAllGlobals();
  });

  it('saveHighScores persists per-mode bests', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem });

    sm.modeBests = { arcade: 1200, zen: 800, daily: 600 };
    sm.saveHighScores('arcade', 0);
    expect(setItem).toHaveBeenCalledWith('deflect_best_arcade', '1200');
    expect(setItem).toHaveBeenCalledWith('deflect_best_zen', '800');
    expect(setItem).toHaveBeenCalledWith('deflect_best_daily', '600');

    vi.unstubAllGlobals();
  });

  it('reset preserves modeBests', () => {
    sm.modeBests.arcade = 1000;
    sm.reset();
    expect(sm.modeBests.arcade).toBe(1000);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd deflect && npx vitest run src/__tests__/score.test.ts`
Expected: FAIL — `sm.modeBests` is undefined

**Step 3: Implement per-mode bests in ScoreManager**

In `src/score.ts`, add the `modeBests` property after line 16 (`hasPlayedBefore`):

```typescript
modeBests: Record<'arcade' | 'zen' | 'daily', number> = { arcade: 0, zen: 0, daily: 0 };
```

Update `finalizeScores` (line 59-70) to also update `modeBests`:

```typescript
finalizeScores(mode: GameMode): boolean {
  let changed = false;
  if (this.score > this.highScore) {
    this.highScore = this.score;
    changed = true;
  }
  if (this.score > this.modeBests[mode]) {
    this.modeBests[mode] = this.score;
    changed = true;
  }
  if (mode === 'daily' && this.score > this.dailyBest) {
    this.dailyBest = this.score;
    changed = true;
  }
  return changed;
}
```

Update `loadHighScores` (line 82-102) — add after the daily data loading (before the closing `catch`):

```typescript
const modes: Array<'arcade' | 'zen' | 'daily'> = ['arcade', 'zen', 'daily'];
for (const m of modes) {
  const raw = parseInt(localStorage.getItem(`deflect_best_${m}`) || '0', 10);
  this.modeBests[m] = Number.isFinite(raw) ? raw : 0;
}
```

Update `saveHighScores` (line 104-117) — add after the daily save block (before the closing `catch`):

```typescript
const modes: Array<'arcade' | 'zen' | 'daily'> = ['arcade', 'zen', 'daily'];
for (const m of modes) {
  localStorage.setItem(`deflect_best_${m}`, String(this.modeBests[m]));
}
```

**Step 4: Run tests to verify they pass**

Run: `cd deflect && npx vitest run src/__tests__/score.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/score.ts src/__tests__/score.test.ts
git commit -m "feat: add per-mode high score tracking to ScoreManager"
```

---

### Task 2: Per-Mode Bests — Menu Display

**Files:**
- Modify: `src/renderer.ts:82-140` (RenderableGameState interface)
- Modify: `src/renderer.ts:186-272` (renderMenu)

**Step 1: Update RenderableGameState interface**

In `src/renderer.ts`, add `modeBests` to the `scoring` block inside `RenderableGameState` (after line 106, `colorMisses`):

```typescript
modeBests: Record<'arcade' | 'zen' | 'daily', number>;
```

**Step 2: Update renderMenu to show per-mode bests**

In `src/renderer.ts`, inside `renderMenu()`, after rendering the sub-label for each button (after line 263), add per-mode best display. Replace lines 259-264 with:

```typescript
      if (btn.mode === 'arcade')
        ctx.fillText('Survive as long as you can', game.centerX, btn.y + 16);
      if (btn.mode === 'zen') ctx.fillText('No damage, pure flow', game.centerX, btn.y + 16);
      if (btn.mode === 'daily')
        ctx.fillText('Same pattern for everyone', game.centerX, btn.y + 16);

      // Per-mode best score
      const best = game.scoring.modeBests[btn.mode];
      if (best > 0) {
        ctx.fillStyle = `${btn.color}66`;
        ctx.font = fontString(Math.min(game.width * 0.025, 10));
        ctx.fillText(`BEST: ${best}`, game.centerX, btn.y + 28);
      }
```

Replace the global high score display (lines 267-271) — remove it since per-mode bests now serve this purpose:

```typescript
    // Global best (legacy fallback)
    if (game.scoring.highScore > 0 && game.scoring.modeBests.arcade === 0 && game.scoring.modeBests.zen === 0) {
      ctx.fillStyle = '#ffcc44';
      ctx.font = fontString(Math.min(game.width * 0.035, 14));
      ctx.fillText(`BEST: ${game.scoring.highScore}`, game.centerX, game.centerY + 200);
    }
```

**Step 3: Adjust menu button spacing to accommodate best scores**

In `src/game.ts`, update `getMenuButtons()` (line 434-441) to increase spacing:

```typescript
getMenuButtons(): { label: string; mode: GameMode; y: number; color: string }[] {
  const baseY = this.centerY + 60;
  return [
    { label: 'ARCADE', mode: 'arcade', y: baseY, color: '#4488ff' },
    { label: 'ZEN', mode: 'zen', y: baseY + 58, color: '#44ff88' },
    { label: 'DAILY', mode: 'daily', y: baseY + 116, color: '#ffcc44' },
  ];
}
```

**Step 4: Run full test suite**

Run: `cd deflect && npx vitest run`
Expected: ALL PASS (game.test.ts already mocks scoring, so the new field doesn't break it)

**Step 5: Commit**

```bash
git add src/renderer.ts src/game.ts
git commit -m "feat: display per-mode high scores on menu buttons"
```

---

### Task 3: Retry Button on Game Over

**Files:**
- Modify: `src/renderer.ts:144-148` (add retryButtonY, menuButtonY)
- Modify: `src/renderer.ts:820-923` (renderGameOver)
- Modify: `src/game.ts:157-162` (keyboard handler for gameover)
- Modify: `src/game.ts:486-514` (updateGameOver)

**Step 1: Add button position properties to Renderer**

In `src/renderer.ts`, after `shareButtonY = 0` (line 148), add:

```typescript
/** Y-position of the retry button, computed during renderGameOver. */
retryButtonY = 0;
/** Y-position of the menu button, computed during renderGameOver. */
menuButtonY = 0;
```

**Step 2: Replace "TAP TO CONTINUE" with two buttons in renderGameOver**

In `src/renderer.ts`, replace lines 918-922 (the "TAP TO CONTINUE" section) with:

```typescript
    // Retry and Menu buttons
    const bottomY = game.height - 60;
    const btnW = Math.min(game.width * 0.35, 140);
    const btnH = 38;
    const gap = 12;
    const totalW = btnW * 2 + gap;
    const leftX = game.centerX - totalW / 2;
    const rightX = leftX + btnW + gap;

    // RETRY button (blue, left)
    this.retryButtonY = bottomY;
    ctx.fillStyle = '#4488ff22';
    ctx.strokeStyle = '#4488ff66';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, leftX, bottomY - btnH / 2, btnW, btnH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4488ff';
    ctx.font = font(0.038, true);
    ctx.fillText('RETRY', leftX + btnW / 2, bottomY);

    // MENU button (grey, right)
    this.menuButtonY = bottomY;
    ctx.fillStyle = '#ffffff11';
    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, rightX, bottomY - btnH / 2, btnW, btnH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#888';
    ctx.font = font(0.035);
    ctx.fillText('MENU', rightX + btnW / 2, bottomY);
```

**Step 3: Update updateGameOver to handle retry and menu buttons**

In `src/game.ts`, replace the tap handling in `updateGameOver` (lines 492-510) with:

```typescript
    const tapPos = this.input.consumeTapWithPos();
    if (tapPos) {
      // Check share button hit
      const shareBtnW = Math.min(this.width * 0.4, 160);
      const shareBtnH = 38;
      const shareBtnX = this.centerX - shareBtnW / 2;
      const shareBtnY = this.renderer.shareButtonY - shareBtnH / 2;
      if (
        tapPos.x >= shareBtnX &&
        tapPos.x <= shareBtnX + shareBtnW &&
        tapPos.y >= shareBtnY &&
        tapPos.y <= shareBtnY + shareBtnH
      ) {
        this.handleShare();
        return;
      }

      // Check retry button hit (left button)
      const btnW = Math.min(this.width * 0.35, 140);
      const btnH = 38;
      const gap = 12;
      const totalW = btnW * 2 + gap;
      const leftX = this.centerX - totalW / 2;
      const retryY = this.renderer.retryButtonY;
      if (
        tapPos.x >= leftX &&
        tapPos.x <= leftX + btnW &&
        tapPos.y >= retryY - btnH / 2 &&
        tapPos.y <= retryY + btnH / 2
      ) {
        this.music.stop();
        this.startGame(this.mode);
        return;
      }

      // Check menu button hit (right button)
      const rightX = leftX + btnW + gap;
      if (
        tapPos.x >= rightX &&
        tapPos.x <= rightX + btnW &&
        tapPos.y >= retryY - btnH / 2 &&
        tapPos.y <= retryY + btnH / 2
      ) {
        this.music.stop();
        this.state = 'menu';
        return;
      }
    }
    if (this.input.consumeSwipe()) {
      this.music.stop();
      this.state = 'menu';
    }
```

**Step 4: Update keyboard handler for gameover**

In `src/game.ts`, replace lines 157-162 (gameover keyboard handling):

```typescript
    } else if (this.state === 'gameover') {
      if (e.key === 'r' || e.key === 'R' || e.key === 'Enter' || e.key === ' ') {
        this.music.stop();
        this.startGame(this.mode);
      } else if (e.key === 'Escape') {
        this.music.stop();
        this.state = 'menu';
      }
    }
```

**Step 5: Run full test suite**

Run: `cd deflect && npx vitest run`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/renderer.ts src/game.ts
git commit -m "feat: add RETRY and MENU buttons to game over screen"
```

---

## Worktree 2: Daily Challenge Enhancements

### Task 4: Daily Streak Counter — ScoreManager

**Files:**
- Modify: `src/score.ts`
- Test: `src/__tests__/score.test.ts`

**Step 1: Write failing tests for daily streak**

Add to `src/__tests__/score.test.ts`:

```typescript
describe('daily streak', () => {
  it('starts with zero streak', () => {
    expect(sm.dailyStreak).toBe(0);
  });

  it('updateDailyStreak sets streak to 1 on first daily play', () => {
    sm.updateDailyStreak();
    expect(sm.dailyStreak).toBe(1);
  });

  it('updateDailyStreak increments when last play was yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    sm['_streakLastDate'] = yesterday.toISOString().split('T')[0];
    sm.dailyStreak = 3;
    sm.updateDailyStreak();
    expect(sm.dailyStreak).toBe(4);
  });

  it('updateDailyStreak does not increment when already played today', () => {
    const today = new Date().toISOString().split('T')[0];
    sm['_streakLastDate'] = today;
    sm.dailyStreak = 3;
    sm.updateDailyStreak();
    expect(sm.dailyStreak).toBe(3);
  });

  it('updateDailyStreak resets when last play was 2+ days ago', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    sm['_streakLastDate'] = twoDaysAgo.toISOString().split('T')[0];
    sm.dailyStreak = 5;
    sm.updateDailyStreak();
    expect(sm.dailyStreak).toBe(1);
  });

  it('saveDailyStreak persists to localStorage', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem });

    sm.dailyStreak = 3;
    sm.updateDailyStreak();
    sm.saveDailyStreak();
    const saved = JSON.parse(setItem.mock.calls.find((c: string[]) => c[0] === 'deflect_streak')![1]);
    expect(saved.count).toBe(3);
    expect(saved.lastDate).toBe(new Date().toISOString().split('T')[0]);

    vi.unstubAllGlobals();
  });

  it('loadDailyStreak restores streak from localStorage', () => {
    const today = new Date().toISOString().split('T')[0];
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => {
        if (key === 'deflect_streak') return JSON.stringify({ lastDate: today, count: 7 });
        return null;
      }),
      setItem: vi.fn(),
    });

    sm.loadDailyStreak();
    expect(sm.dailyStreak).toBe(7);

    vi.unstubAllGlobals();
  });

  it('loadDailyStreak resets if last play was 2+ days ago', () => {
    const old = new Date();
    old.setDate(old.getDate() - 3);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => {
        if (key === 'deflect_streak') return JSON.stringify({ lastDate: old.toISOString().split('T')[0], count: 7 });
        return null;
      }),
      setItem: vi.fn(),
    });

    sm.loadDailyStreak();
    expect(sm.dailyStreak).toBe(0);

    vi.unstubAllGlobals();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd deflect && npx vitest run src/__tests__/score.test.ts`
Expected: FAIL — `sm.dailyStreak` is undefined

**Step 3: Implement daily streak in ScoreManager**

In `src/score.ts`, add properties after `hasPlayedBefore` (line 16):

```typescript
dailyStreak = 0;
private _streakLastDate = '';
```

Add methods before `loadHighScores` (before line 82):

```typescript
updateDailyStreak(): void {
  const today = new Date().toISOString().split('T')[0];
  if (this._streakLastDate === today) return; // Already played today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (this._streakLastDate === yesterdayStr) {
    this.dailyStreak++;
  } else {
    this.dailyStreak = 1;
  }
  this._streakLastDate = today;
}

loadDailyStreak(): void {
  try {
    const raw = localStorage.getItem('deflect_streak');
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d && typeof d.lastDate === 'string' && typeof d.count === 'number') {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (d.lastDate === today || d.lastDate === yesterdayStr) {
        this.dailyStreak = d.count;
        this._streakLastDate = d.lastDate;
      }
    }
  } catch {}
}

saveDailyStreak(): void {
  try {
    localStorage.setItem('deflect_streak', JSON.stringify({
      lastDate: this._streakLastDate,
      count: this.dailyStreak,
    }));
  } catch {}
}
```

**Step 4: Run tests**

Run: `cd deflect && npx vitest run src/__tests__/score.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/score.ts src/__tests__/score.test.ts
git commit -m "feat: add daily challenge streak counter to ScoreManager"
```

---

### Task 5: Wire Streak Into Game + Display

**Files:**
- Modify: `src/game.ts:187` (loadDailyStreak in constructor)
- Modify: `src/game.ts:813-832` (onGameOver — call updateDailyStreak)
- Modify: `src/renderer.ts:82-140` (RenderableGameState — add dailyStreak)
- Modify: `src/renderer.ts:186-272` (renderMenu — show streak)

**Step 1: Load streak in Game constructor**

In `src/game.ts`, after `this.scoring.loadHighScores()` (line 187), add:

```typescript
this.scoring.loadDailyStreak();
```

**Step 2: Update/save streak on game over**

In `src/game.ts`, inside `onGameOver()`, after `this.scoring.saveHighScores(...)` (after line 831), add:

```typescript
if (this.mode === 'daily') {
  this.scoring.updateDailyStreak();
  this.scoring.saveDailyStreak();
}
```

**Step 3: Add dailyStreak to RenderableGameState**

In `src/renderer.ts`, add to the `scoring` block inside `RenderableGameState` (after `dailyBest: number`):

```typescript
dailyStreak: number;
```

**Step 4: Display streak on menu near DAILY button**

In `src/renderer.ts` `renderMenu()`, after the per-mode best display for each button (the code added in Task 2), add a streak badge specifically for the daily button. After the `if (best > 0)` block for per-mode bests, add:

```typescript
      // Daily streak badge
      if (btn.mode === 'daily' && game.scoring.dailyStreak > 0) {
        const streakText = `${game.scoring.dailyStreak} day streak`;
        ctx.fillStyle = '#ffcc44';
        ctx.font = fontString(Math.min(game.width * 0.025, 10), true);
        ctx.fillText(streakText, game.centerX, btn.y + (best > 0 ? 38 : 28));
      }
```

**Step 5: Run full test suite**

Run: `cd deflect && npx vitest run`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/game.ts src/renderer.ts
git commit -m "feat: wire daily streak into game lifecycle and menu display"
```

---

### Task 6: Date on Daily Challenge Share Card

**Files:**
- Modify: `src/share.ts:19,61-62`
- Test: `src/__tests__/share.test.ts`

**Step 1: Write failing tests**

Add to `src/__tests__/share.test.ts` inside the `describe('mode labels')` block:

```typescript
it('includes date for daily mode', () => {
  const card = generateScoreCard({ ...baseStats, mode: 'daily' });
  // Should contain month abbreviation and day number
  const today = new Date();
  const month = today.toLocaleDateString('en-US', { month: 'short' });
  const day = today.getDate();
  expect(card).toContain(`DAILY ${month} ${day}`);
});

it('does not include date for arcade mode', () => {
  const card = generateScoreCard({ ...baseStats, mode: 'arcade' });
  const today = new Date();
  const month = today.toLocaleDateString('en-US', { month: 'short' });
  expect(card).not.toContain(month);
});
```

**Step 2: Run tests to verify they fail**

Run: `cd deflect && npx vitest run src/__tests__/share.test.ts`
Expected: FAIL — daily card doesn't contain date

**Step 3: Add date to daily share card**

In `src/share.ts`, after `modeLabel` computation (line 19), add:

```typescript
const dateStr = stats.mode === 'daily'
  ? ` ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  : '';
```

Then update the first line of the `lines` array (line 62) from:

```typescript
`DEFLECT ${modeLabel} ${pattern}`,
```

to:

```typescript
`DEFLECT ${modeLabel}${dateStr} ${pattern}`,
```

**Step 4: Run tests**

Run: `cd deflect && npx vitest run src/__tests__/share.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/share.ts src/__tests__/share.test.ts
git commit -m "feat: add date to daily challenge share card"
```

---

## Worktree 3: Infrastructure

### Task 7: PWA Icons

**Files:**
- Create: `public/icon.svg`
- Create: `scripts/generate-icons.ts`

**Step 1: Create the SVG icon**

Create `public/icon.svg` — a neon-styled "D" on dark background:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#0a0a1a"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="#4488ff" stroke-width="8" opacity="0.3"/>
  <circle cx="256" cy="256" r="160" fill="none" stroke="#4488ff" stroke-width="4" opacity="0.15"/>
  <text x="256" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="260" fill="#ffffff">D</text>
  <circle cx="256" cy="256" r="200" fill="none" stroke="#4488ff" stroke-width="3" opacity="0.6">
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite"/>
  </circle>
</svg>
```

**Step 2: Create a Node.js script to generate PNG icons from SVG**

Create `scripts/generate-icons.ts`:

```typescript
/**
 * Generate PNG icons from SVG for PWA manifest.
 * Run: npx tsx scripts/generate-icons.ts
 *
 * Requires: sharp (npm install -D sharp)
 * Or alternatively, use an online SVG→PNG converter and place files manually.
 *
 * For a zero-dependency approach, we create simple canvas-based PNGs.
 */
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Simple approach: copy the SVG and note that for production,
// use `sharp` or an online tool to generate proper PNGs.
// For now, ensure the SVG is the primary icon.

const publicDir = join(import.meta.dirname, '..', 'public');
const svg = readFileSync(join(publicDir, 'icon.svg'), 'utf-8');

console.log('SVG icon exists at public/icon.svg');
console.log('To generate PNG icons, install sharp and run:');
console.log('  npm install -D sharp');
console.log('  Then add sharp-based conversion to this script.');
console.log('');
console.log('For now, update manifest.json to use SVG icons (supported by modern browsers).');
```

**Step 3: Update manifest.json to support SVG + PNG fallback**

Update `public/manifest.json`:

```json
{
  "name": "DEFLECT",
  "short_name": "Deflect",
  "description": "Swipe to deflect. Match the colors. Protect the core.",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "portrait",
  "background_color": "#0a0a1a",
  "theme_color": "#0a0a1a",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Step 4: Update index.html icon reference**

In `index.html` line 11-12, the references are already correct (`/icon.svg` and `/icon-192.png`). The SVG now exists. PNGs can be generated later; the SVG icon entry with `sizes: "any"` will be the primary icon for modern browsers.

**Step 5: Install sharp as devDependency and generate PNGs**

```bash
cd deflect && npm install -D sharp
```

Then update `scripts/generate-icons.ts` to actually generate PNGs:

```typescript
import sharp from 'sharp';
import { join } from 'path';

const publicDir = join(import.meta.dirname, '..', 'public');
const svgPath = join(publicDir, 'icon.svg');

async function generate() {
  await sharp(svgPath).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'));
  await sharp(svgPath).resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'));
  console.log('Generated icon-192.png and icon-512.png');
}

generate().catch(console.error);
```

Run: `npx tsx scripts/generate-icons.ts`

**Step 6: Commit**

```bash
git add public/icon.svg public/icon-192.png public/icon-512.png public/manifest.json scripts/generate-icons.ts package.json package-lock.json
git commit -m "fix: add PWA icons and update manifest"
```

---

### Task 8: Analytics Stub

**Files:**
- Create: `src/analytics.ts`
- Modify: `src/main.ts`
- Modify: `src/game.ts`

**Step 1: Create analytics module**

Create `src/analytics.ts`:

```typescript
/** Analytics stub — logs events to console in development.
 *  Replace the body of `track()` with a real beacon (e.g. Convex) in V1.1. */

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export function track(event: string, props?: Record<string, unknown>): void {
  if (isDev) {
    console.debug('[analytics]', event, props);
  }
  // V1.1: Replace with navigator.sendBeacon() or Convex mutation
  // try {
  //   navigator.sendBeacon('/api/events', JSON.stringify({ event, props, ts: Date.now() }));
  // } catch {}
}
```

**Step 2: Add page_view tracking in main.ts**

In `src/main.ts`, add at the top (after line 1):

```typescript
import { track } from './analytics';
```

Add after the Game constructor (after line 7):

```typescript
track('page_view');
```

**Step 3: Add game_start and game_over tracking in game.ts**

In `src/game.ts`, add import at the top (after line 40):

```typescript
import { track } from './analytics';
```

In `startGame()` (after line 291, after `this.music.start(...)`):

```typescript
track('game_start', { mode });
```

In `onGameOver()` (after line 828, after `this.music.stop()`):

```typescript
track('game_over', { mode: this.mode, score: this.scoring.score, elapsed: Math.floor(this.elapsed), maxCombo: this.scoring.maxCombo });
```

In `handleShare()` (at the start of the method, after line 517):

```typescript
track('share_initiated', { mode: this.mode, score: this.scoring.score });
```

**Step 4: Run test suite**

Run: `cd deflect && npx vitest run`
Expected: ALL PASS (analytics is fire-and-forget, no side effects to test)

**Step 5: Commit**

```bash
git add src/analytics.ts src/main.ts src/game.ts
git commit -m "feat: add analytics stub with console logging for development"
```

---

### Task 9: Sound Mute Toggle

**Files:**
- Modify: `src/audio.ts`
- Modify: `src/song-player.ts`
- Modify: `src/game.ts`
- Modify: `src/renderer.ts`
- Test: `src/__tests__/audio.test.ts` (new)

**Step 1: Write failing test for audio mute**

Create `src/__tests__/audio.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the mute flag logic, not actual audio playback
vi.stubGlobal('AudioContext', vi.fn(() => ({
  state: 'running',
  resume: vi.fn(),
  close: vi.fn(() => Promise.resolve()),
  createOscillator: vi.fn(() => ({
    type: '',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  })),
  currentTime: 0,
  destination: {},
})));

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
});

const { audio } = await import('../audio');

describe('audio mute', () => {
  beforeEach(() => {
    if (audio.isMuted()) audio.toggleMute();
  });

  it('starts unmuted', () => {
    expect(audio.isMuted()).toBe(false);
  });

  it('toggleMute toggles state', () => {
    audio.toggleMute();
    expect(audio.isMuted()).toBe(true);
    audio.toggleMute();
    expect(audio.isMuted()).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd deflect && npx vitest run src/__tests__/audio.test.ts`
Expected: FAIL — `audio.isMuted` is not a function

**Step 3: Add mute to audio module**

In `src/audio.ts`, add after `const pendingTimeouts` (after line 4):

```typescript
let muted = false;
```

Add mute guard to `playTone` — at the start of the function (line 21), add:

```typescript
  if (muted) return;
```

Add methods to the `audio` export object (after `destroy`, before the closing `}`):

```typescript

  isMuted(): boolean {
    return muted;
  },

  toggleMute(): void {
    muted = !muted;
    try {
      localStorage.setItem('deflect_muted', muted ? '1' : '0');
    } catch {}
  },

  loadMuteState(): void {
    try {
      muted = localStorage.getItem('deflect_muted') === '1';
    } catch {}
  },
```

**Step 4: Add mute to SongPlayer**

In `src/song-player.ts`, add a method to `SongPlayer` class (after `getCurrentEnergy`, before the closing `}`):

```typescript
setMuted(muted: boolean): void {
  if (this.audio) {
    this.audio.muted = muted;
  }
}
```

**Step 5: Wire mute toggle into Game**

In `src/game.ts`, add `muteButtonBounds` for hit testing. Add property after `DEFLECTOR_COOLDOWN` (after line 112):

```typescript
// Mute button bounds (top-right corner)
private muteButtonX = 0;
private muteButtonY = 0;
private muteButtonSize = 32;
```

In the constructor, after `this.scoring.loadHighScores()` (line 187), add:

```typescript
audio.loadMuteState();
```

Add a mute toggle method:

```typescript
private toggleMute(): void {
  audio.toggleMute();
  this.music.setMuted(audio.isMuted());
}
```

In `updateMenu()`, before the existing tap handling (before line 453), add mute button check:

```typescript
    // Update mute button position
    this.muteButtonX = this.width - 40;
    this.muteButtonY = 24;
```

Then inside the `if (tapPos)` block in `updateMenu`, before button hit checks (before line 457), add:

```typescript
      // Check mute button
      if (
        Math.abs(tapPos.x - this.muteButtonX) < this.muteButtonSize / 2 &&
        Math.abs(tapPos.y - this.muteButtonY) < this.muteButtonSize / 2
      ) {
        this.toggleMute();
        return;
      }
```

**Step 6: Render mute button**

In `src/renderer.ts`, add `isMuted` to `RenderableGameState` (after `reducedMotion` on line 137):

```typescript
isMuted: boolean;
```

Add a private method to Renderer for the mute icon:

```typescript
private renderMuteButton(ctx: CanvasRenderingContext2D, x: number, y: number, muted: boolean): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = muted ? '#ff4466' : '#555';
  ctx.font = fontString(16);
  ctx.fillText(muted ? 'MUTE' : 'SND', x, y);
  ctx.restore();
}
```

In `renderMenu()`, after the mode buttons (after the global best section), add:

```typescript
    // Mute button (top right)
    this.renderMuteButton(ctx, game.width - 40, 24, game.isMuted);
```

In `renderHUD()`, at the end (before the closing `}`), add the mute icon during gameplay too:

```typescript
    // Mute indicator during gameplay
    if (game.isMuted) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ff4466';
      ctx.font = fontString(Math.min(game.width * 0.03, 12));
      ctx.fillText('MUTED', game.width - 15, 38);
    }
```

Expose `isMuted` from `Game` — in `src/game.ts`, add a getter (or simply make it accessible through the game object). Since `RenderableGameState` is an interface and `Game` implements it implicitly through duck typing, add:

```typescript
get isMuted(): boolean {
  return audio.isMuted();
}
```

**Step 7: Run full test suite**

Run: `cd deflect && npx vitest run`
Expected: ALL PASS

**Step 8: Commit**

```bash
git add src/audio.ts src/song-player.ts src/game.ts src/renderer.ts src/__tests__/audio.test.ts
git commit -m "feat: add sound mute toggle with persistence"
```

---

## Final: Merge & Verify

### Task 10: Merge Worktrees

**Step 1:** Merge WT3 (Infrastructure) into main first — no conflicts expected
**Step 2:** Merge WT2 (Daily) into main — minor `score.ts` additions, resolve any conflicts in the properties section
**Step 3:** Merge WT1 (Game Over + Bests) into main — largest change, resolve any `renderer.ts` / `game.ts` conflicts

**Step 4: Run full test suite on merged main**

```bash
cd deflect && npx vitest run
```

**Step 5: Build and verify**

```bash
cd deflect && npm run build
```

**Step 6: Manual smoke test**

```bash
cd deflect && npm run preview
```

Verify:
- [ ] Menu shows per-mode best scores
- [ ] Daily streak counter displays
- [ ] Game over shows RETRY + MENU buttons
- [ ] RETRY restarts same mode
- [ ] MENU goes back
- [ ] R key retries, Escape goes to menu
- [ ] Daily share card includes date
- [ ] Mute button works, persists across refresh
- [ ] PWA installs correctly
- [ ] Console shows analytics events in dev

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete V1 ship blockers - retry, per-mode bests, streak, share date, PWA, analytics, mute"
```
