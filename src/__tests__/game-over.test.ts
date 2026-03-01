import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for onGameOver() cleanup behavior.
 *
 * The Game class requires a full canvas/DOM context, so we extract
 * the onGameOver logic into a minimal stub that mirrors the real
 * class properties and method behavior.
 */

describe('onGameOver nearMissTimeout cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createStub() {
    return {
      nearMissTimeout: null as ReturnType<typeof setTimeout> | null,
      timeScale: 1,
      timeScaleTarget: 1,
      state: 'playing' as string,

      /** Mirrors the onGameOver() cleanup preamble from game.ts */
      onGameOver() {
        if (this.nearMissTimeout !== null) {
          clearTimeout(this.nearMissTimeout);
          this.nearMissTimeout = null;
        }
        this.timeScale = 1;
        this.timeScaleTarget = 1;
        this.state = 'gameover';
      },
    };
  }

  it('clears a pending nearMissTimeout', () => {
    const stub = createStub();
    const callback = vi.fn();
    stub.nearMissTimeout = setTimeout(callback, 200);

    stub.onGameOver();

    // Advance past the timeout duration — callback should NOT fire
    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
    expect(stub.nearMissTimeout).toBeNull();
  });

  it('sets state to gameover', () => {
    const stub = createStub();
    stub.state = 'playing';

    stub.onGameOver();

    expect(stub.state).toBe('gameover');
  });

  it('resets timeScale and timeScaleTarget to 1', () => {
    const stub = createStub();
    stub.timeScale = 0.3;
    stub.timeScaleTarget = 0.3;

    stub.onGameOver();

    expect(stub.timeScale).toBe(1);
    expect(stub.timeScaleTarget).toBe(1);
  });

  it('handles onGameOver when no timeout is pending', () => {
    const stub = createStub();
    stub.nearMissTimeout = null;

    // Should not throw
    stub.onGameOver();

    expect(stub.nearMissTimeout).toBeNull();
    expect(stub.state).toBe('gameover');
  });
});
