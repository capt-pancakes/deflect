export type TutorialAction = 'spawn_step1' | 'spawn_step2' | 'spawn_step3' | 'complete' | null;

/**
 * 10-phase tutorial state machine:
 *   0 = NOT_STARTED (unused initial)
 *   1 = STEP1_PROMPT  — "SWIPE TO DEFLECT!" ghost swipe, 10% speed
 *   2 = STEP1_RESOLVE — physics at ~70%, watching ball
 *   3 = STEP2_INTRO   — "NICE! NOW TRY TWO!" text for 2s
 *   4 = STEP2_PROMPT  — "DRAW TWO LINES!" ghost swipe, 10% speed
 *   5 = STEP2_RESOLVE — physics running, watching both balls
 *   6 = STEP3_INTRO   — "NOW MATCH THE COLOR!" text for 2s
 *   7 = STEP3_PROMPT  — "BLUE BALL → BLUE PORT" ghost swipe, 10% speed
 *   8 = STEP3_RESOLVE — physics running, watching blue ball
 *   9 = DONE
 */
export class TutorialManager {
  phase = 0;
  timer = 0;
  ghostSwipeAnim = 0;
  hintText = '';
  hintTextTimer = 0;

  constructor(hasPlayedBefore: boolean) {
    this.reset(hasPlayedBefore);
  }

  reset(hasPlayedBefore: boolean): void {
    if (hasPlayedBefore) {
      this.phase = 9;
    } else {
      this.phase = 1;
    }
    this.timer = 0;
    this.ghostSwipeAnim = 0;
    this.hintText = '';
    this.hintTextTimer = 0;
    this.setHintForPhase();
  }

  isActive(): boolean {
    return this.phase < 9;
  }

  isPromptPhase(): boolean {
    return this.phase === 1 || this.phase === 4 || this.phase === 7;
  }

  isIntroPhase(): boolean {
    return this.phase === 3 || this.phase === 6;
  }

  /** Advance timer/animation. Does not drive phase transitions directly. */
  update(dt: number): void {
    this.timer += dt;
    this.ghostSwipeAnim += dt;
    this.hintTextTimer += dt;
  }

  /** Called when the player swipes during a prompt phase. */
  onSwipe(): void {
    if (this.phase === 1) {
      this.phase = 2;
      this.timer = 0;
    } else if (this.phase === 4) {
      this.phase = 5;
      this.timer = 0;
    } else if (this.phase === 7) {
      this.phase = 8;
      this.timer = 0;
    }
  }

  /**
   * Check if a resolve phase should advance.
   * Called during phases 2, 5, 8.
   * Advances when all signals are gone or timeout (5s).
   */
  checkResolution(signalsRemaining: number): TutorialAction {
    if (this.phase === 2 && (signalsRemaining === 0 || this.timer > 5)) {
      this.phase = 3;
      this.timer = 0;
      this.hintTextTimer = 0;
      this.setHintForPhase();
      return 'spawn_step2';
    }
    if (this.phase === 5 && (signalsRemaining === 0 || this.timer > 5)) {
      this.phase = 6;
      this.timer = 0;
      this.hintTextTimer = 0;
      this.setHintForPhase();
      return 'spawn_step3';
    }
    if (this.phase === 8 && (signalsRemaining === 0 || this.timer > 5)) {
      this.phase = 9;
      this.timer = 0;
      this.hintText = '';
      return 'complete';
    }
    return null;
  }

  /**
   * Check if an intro phase (3 or 6) should advance to the next prompt phase.
   * Advances after 2s. Returns spawn action for the next step's signals.
   */
  checkIntroComplete(): TutorialAction {
    if (this.phase === 3 && this.timer > 2) {
      this.phase = 4;
      this.timer = 0;
      this.ghostSwipeAnim = 0;
      this.hintTextTimer = 0;
      this.setHintForPhase();
      return 'spawn_step2';
    }
    if (this.phase === 6 && this.timer > 2) {
      this.phase = 7;
      this.timer = 0;
      this.ghostSwipeAnim = 0;
      this.hintTextTimer = 0;
      this.setHintForPhase();
      return 'spawn_step3';
    }
    return null;
  }

  private setHintForPhase(): void {
    switch (this.phase) {
      case 1: this.hintText = 'SWIPE TO DEFLECT!'; break;
      case 3: this.hintText = 'NICE! NOW TRY TWO!'; break;
      case 4: this.hintText = 'DRAW TWO LINES!'; break;
      case 6: this.hintText = 'NOW MATCH THE COLOR!'; break;
      case 7: this.hintText = 'BLUE BALL \u2192 BLUE PORT'; break;
      default: this.hintText = ''; break;
    }
  }
}
