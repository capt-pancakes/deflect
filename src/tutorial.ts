export type TutorialAction = 'spawn_signal' | 'spawn_color_signal' | 'wrong_port' | 'complete' | null;

export class TutorialManager {
  phase = 0; // 0=not started, 1=waiting for swipe, 2=signal deflected, 3=color matching, 4=done
  timer = 0;
  ghostSwipeAnim = 0;

  constructor(hasPlayedBefore: boolean) {
    this.reset(hasPlayedBefore);
  }

  reset(hasPlayedBefore: boolean): void {
    if (hasPlayedBefore) {
      this.phase = 4; // Skip tutorial
    } else {
      this.phase = 1;
    }
    this.timer = 0;
    this.ghostSwipeAnim = 0;
  }

  isActive(): boolean {
    return this.phase < 4;
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

  /** Called when a signal is deflected during phase 2. */
  onDeflect(): void {
    // Currently a no-op; phase transition is handled by checkCompletion.
  }

  /** Check if tutorial phase 2 should transition to phase 3. Returns 'spawn_color_signal' action. */
  checkCompletion(signalsRemaining: number): TutorialAction {
    if (this.phase === 2 && (signalsRemaining === 0 || this.timer > 3)) {
      this.phase = 3;
      this.timer = 0;
      return 'spawn_color_signal';
    }
    return null;
  }

  /** Check if tutorial phase 3 (color matching) should complete. */
  checkColorCompletion(correctCatch: boolean): TutorialAction {
    if (this.phase !== 3) return null;

    // Auto-complete after 8 seconds
    if (this.timer > 8) {
      this.phase = 4;
      return 'complete';
    }

    if (correctCatch) {
      this.phase = 4;
      return 'complete';
    }

    return 'wrong_port';
  }
}
