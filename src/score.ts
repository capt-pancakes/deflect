import type { GameMode, SignalColor } from './types';
import { dailySeed } from './math';
import { lerp } from './math';

export class ScoreManager {
  score = 0;
  combo = 0;
  maxCombo = 0;
  catches = 0;
  misses = 0;
  displayScore = 0;
  colorMisses: Partial<Record<SignalColor, number>> = {};

  highScore = 0;
  dailyBest = 0;
  hasPlayedBefore = false;

  dailyStreak = 0;
  private _streakLastDate = '';

  /** Increment combo, add points, return points earned. */
  addCatch(): number {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.catches++;
    const points = 10 * this.combo;
    this.score += points;
    return points;
  }

  /** Reset combo, increment misses, track color miss. */
  addMiss(color?: SignalColor): void {
    this.combo = 0;
    this.misses++;
    if (color) {
      this.colorMisses[color] = (this.colorMisses[color] || 0) + 1;
    }
  }

  resetCombo(): void {
    this.combo = 0;
  }

  updateDisplayScore(dt: number): void {
    this.displayScore = lerp(this.displayScore, this.score, dt * 10);
  }

  getWorstColor(): SignalColor | null {
    let worst: SignalColor | null = null;
    let worstCount = 0;
    for (const key of Object.keys(this.colorMisses) as SignalColor[]) {
      const count = this.colorMisses[key] ?? 0;
      if (count > worstCount) {
        worst = key;
        worstCount = count;
      }
    }
    return worst;
  }

  /** Check and update high scores after game over. Returns true if any record was beaten. */
  finalizeScores(mode: GameMode): boolean {
    let changed = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      changed = true;
    }
    if (mode === 'daily' && this.score > this.dailyBest) {
      this.dailyBest = this.score;
      changed = true;
    }
    return changed;
  }

  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.catches = 0;
    this.misses = 0;
    this.displayScore = 0;
    this.colorMisses = {};
  }

  loadHighScores(): void {
    try {
      const rawHigh = parseInt(localStorage.getItem('deflect_high') || '0', 10);
      this.highScore = Number.isFinite(rawHigh) ? rawHigh : 0;
      this.hasPlayedBefore = localStorage.getItem('deflect_played') === '1';
      const dailyData = localStorage.getItem('deflect_daily');
      if (dailyData) {
        const d = JSON.parse(dailyData);
        if (
          d &&
          typeof d === 'object' &&
          typeof d.seed === 'number' &&
          typeof d.score === 'number' &&
          d.seed === dailySeed() &&
          Number.isFinite(d.score)
        ) {
          this.dailyBest = d.score;
        }
      }
    } catch {}
  }

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

  saveHighScores(mode: GameMode, dailySeedValue: number): void {
    try {
      localStorage.setItem('deflect_high', String(this.highScore));
      if (mode === 'daily') {
        localStorage.setItem(
          'deflect_daily',
          JSON.stringify({
            seed: dailySeedValue,
            score: this.dailyBest,
          }),
        );
      }
    } catch {}
  }
}
