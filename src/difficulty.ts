import type { GameConfig, GameMode } from './types';

export class DifficultyManager {
  activeColors = 1;
  signalSpeed: number;
  spawnInterval = 2.0;
  prevColorCount = 0;

  constructor(config: GameConfig) {
    this.signalSpeed = config.signalSpeed;
  }

  reset(config: GameConfig): void {
    this.activeColors = 1;
    this.signalSpeed = config.signalSpeed;
    this.spawnInterval = 2.0;
    this.prevColorCount = 0;
  }

  /** Update difficulty based on elapsed time and mode. Returns true if activeColors changed. */
  update(elapsed: number, mode: GameMode): boolean {
    const t = elapsed;
    const zen = mode === 'zen';

    if (zen) {
      if (t < 30) {
        this.activeColors = 1;
        this.signalSpeed = 70;
        this.spawnInterval = 3.0;
      } else if (t < 70) {
        this.activeColors = 2;
        this.signalSpeed = 85;
        this.spawnInterval = 2.5;
      } else if (t < 120) {
        this.activeColors = 3;
        this.signalSpeed = 100;
        this.spawnInterval = 2.0;
      } else {
        this.activeColors = 3;
        this.signalSpeed = Math.min(120, 100 + (t - 120) * 0.3);
        this.spawnInterval = Math.max(1.5, 2.0 - (t - 120) * 0.003);
      }
    } else if (t < 15) {
      this.activeColors = 1;
      this.signalSpeed = 90;
      this.spawnInterval = 2.5;
    } else if (t < 35) {
      this.activeColors = 2;
      this.signalSpeed = 110;
      this.spawnInterval = 2.0;
    } else if (t < 60) {
      this.activeColors = 3;
      this.signalSpeed = 130;
      this.spawnInterval = 1.5;
    } else if (t < 90) {
      this.activeColors = 4;
      this.signalSpeed = 155;
      this.spawnInterval = 1.2;
    } else {
      this.activeColors = 4;
      this.signalSpeed = 155 + (t - 90) * 1.2;
      this.spawnInterval = Math.max(0.5, 1.2 - (t - 90) * 0.006);
    }

    const changed = this.prevColorCount !== this.activeColors;
    if (changed) {
      this.prevColorCount = this.activeColors;
    }
    return changed;
  }
}
