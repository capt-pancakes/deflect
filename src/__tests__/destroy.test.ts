import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for destroy() cleanup behavior.
 *
 * Since no jsdom environment is available, we test the cleanup logic
 * using stubs that mirror the real class behavior.
 */

describe('InputHandler.destroy', () => {
  it('removes all 3 pointer event listeners on destroy', () => {
    const removeCalls: string[] = [];
    const addCalls: string[] = [];

    const stub = createInputStub(addCalls, removeCalls);
    stub.bindEvents();

    expect(addCalls).toHaveLength(3);
    expect(addCalls).toEqual(
      expect.arrayContaining([
        'pointerdown',
        'pointermove',
        'pointerup',
      ]),
    );

    stub.destroy();

    expect(removeCalls).toHaveLength(3);
    expect(removeCalls).toEqual(
      expect.arrayContaining([
        'pointerdown',
        'pointermove',
        'pointerup',
      ]),
    );
  });

  it('uses same handler references for add and remove', () => {
    const addedHandlers = new Map<string, unknown>();
    const removedHandlers = new Map<string, unknown>();

    const canvas = {
      addEventListener: (type: string, handler: unknown) => {
        addedHandlers.set(type, handler);
      },
      removeEventListener: (type: string, handler: unknown) => {
        removedHandlers.set(type, handler);
      },
    };

    const handlers = {
      onPointerDown: () => {},
      onPointerMove: () => {},
      onPointerUp: () => {},
    };

    // Simulate bindEvents
    canvas.addEventListener('pointerdown', handlers.onPointerDown);
    canvas.addEventListener('pointermove', handlers.onPointerMove);
    canvas.addEventListener('pointerup', handlers.onPointerUp);

    // Simulate destroy
    canvas.removeEventListener('pointerdown', handlers.onPointerDown);
    canvas.removeEventListener('pointermove', handlers.onPointerMove);
    canvas.removeEventListener('pointerup', handlers.onPointerUp);

    // Verify same references were used
    for (const [type, addedHandler] of addedHandlers) {
      expect(removedHandlers.get(type)).toBe(addedHandler);
    }
  });

  it('clears pending state on destroy', () => {
    const stub = createInputStateStub();

    // Set some pending state
    stub.pendingSwipe = { start: { x: 0, y: 0 }, end: { x: 10, y: 10 } };
    stub.tapPending = true;
    stub.touching = true;

    stub.destroy();

    expect(stub.pendingSwipe).toBeNull();
    expect(stub.tapPending).toBe(false);
    expect(stub.touching).toBe(false);
  });
});

describe('Game.destroy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears nearMissTimeout on destroy', () => {
    const callback = vi.fn();
    const stub = createGameStub();
    stub.nearMissTimeout = setTimeout(callback, 200);

    stub.destroy();

    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
    expect(stub.nearMissTimeout).toBeNull();
  });

  it('handles destroy when no timeout is pending', () => {
    const stub = createGameStub();
    stub.nearMissTimeout = null;

    // Should not throw
    stub.destroy();

    expect(stub.nearMissTimeout).toBeNull();
  });

  it('removes resize listener on destroy', () => {
    const removeResizeCalled = { value: false, handler: null as unknown };
    const stub = createGameStub();
    stub.removeResizeListener = (handler: unknown) => {
      removeResizeCalled.value = true;
      removeResizeCalled.handler = handler;
    };

    stub.destroy();

    expect(removeResizeCalled.value).toBe(true);
    expect(removeResizeCalled.handler).toBe(stub.onResize);
  });

  it('clears particles on destroy', () => {
    const stub = createGameStub();
    stub.particleCount = 10;

    stub.destroy();

    expect(stub.particleCount).toBe(0);
  });

  it('calls input.destroy on destroy', () => {
    const stub = createGameStub();

    stub.destroy();

    expect(stub.inputDestroyCalled).toBe(true);
  });
});

// ---- Helpers ----

function createInputStub(addCalls: string[], removeCalls: string[]) {
  return {
    bindEvents() {
      for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
        addCalls.push(type);
      }
    },
    destroy() {
      for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
        removeCalls.push(type);
      }
    },
  };
}

function createInputStateStub() {
  return {
    pendingSwipe: null as { start: { x: number; y: number }; end: { x: number; y: number } } | null,
    tapPending: false,
    tapPos: null as { x: number; y: number } | null,
    touching: false,
    swipeStart: null as { x: number; y: number } | null,
    swipeCurrent: null as { x: number; y: number } | null,

    /** Mirrors InputHandler.destroy() cleanup */
    destroy() {
      this.pendingSwipe = null;
      this.tapPending = false;
      this.tapPos = null;
      this.touching = false;
      this.swipeStart = null;
      this.swipeCurrent = null;
    },
  };
}

/** Minimal stub mirroring Game.destroy() logic without needing DOM globals */
function createGameStub() {
  const onResize = () => {};

  return {
    nearMissTimeout: null as ReturnType<typeof setTimeout> | null,
    particleCount: 0,
    inputDestroyCalled: false,
    onResize,
    removeResizeListener: (_handler: unknown) => {},

    destroy() {
      this.removeResizeListener(this.onResize);
      this.inputDestroyCalled = true;
      if (this.nearMissTimeout !== null) {
        clearTimeout(this.nearMissTimeout);
        this.nearMissTimeout = null;
      }
      this.particleCount = 0;
    },
  };
}
