export type TutorialAction = 'spawn_signal' | 'complete' | null;

export class TutorialManager {
  phase = 0; // 0=not started, 1=waiting for swipe, 2=signal deflected, 3=done
  timer = 0;
  ghostSwipeAnim = 0;

  constructor(hasPlayedBefore: boolean) {
    this.reset(hasPlayedBefore);
  }

  reset(hasPlayedBefore: boolean): void {
    if (hasPlayedBefore) {
      this.phase = 3; // Skip tutorial
    } else {
      this.phase = 1;
    }
    this.timer = 0;
    this.ghostSwipeAnim = 0;
  }

  isActive(): boolean {
    return this.phase < 3;
  }

  /** Advance timer/animation. Does not drive phase transitions directly. */
  update(dt: number): void {
    this.timer += dt;
    this.ghostSwipeAnim += dt;
  }

  /** Called when the player makes their first swipe during phase 1. */
  onSwipe(): void {
    if (this.phase === 1) {
      this.phase = 2;
      this.timer = 0;
    }
  }

  /** Check if tutorial phase 2 should complete (signal caught or timeout). Returns 'complete' action. */
  checkCompletion(signalsRemaining: number): TutorialAction {
    if (this.phase === 2 && (signalsRemaining === 0 || this.timer > 3)) {
      this.phase = 3;
      return 'complete';
    }
    return null;
  }
}
