import type { Vec2 } from './types';
import { dist } from './math';

export interface SwipeResult {
  start: Vec2;
  end: Vec2;
}

const MIN_SWIPE_LENGTH = 30;

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private touching = false;
  private swipeStart: Vec2 | null = null;
  private swipeCurrent: Vec2 | null = null;
  private pendingSwipe: SwipeResult | null = null;
  private tapPending = false;
  private tapPos: Vec2 | null = null;
  private scaleX = 1;
  private scaleY = 1;

  // Unified PointerEvent handlers
  private onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    this.touching = true;
    this.swipeStart = this.getPos(e);
    this.swipeCurrent = this.swipeStart;
  };

  private onPointerMove = (e: PointerEvent) => {
    e.preventDefault();
    if (this.touching) {
      this.swipeCurrent = this.getPos(e);
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    e.preventDefault();
    if (this.touching && this.swipeStart) {
      const end = this.getPos(e);
      const swipeLen = dist(this.swipeStart, end);
      if (swipeLen >= MIN_SWIPE_LENGTH) {
        this.pendingSwipe = { start: this.swipeStart, end };
      } else {
        this.tapPending = true;
        this.tapPos = end;
      }
    }
    this.touching = false;
    this.swipeStart = null;
    this.swipeCurrent = null;
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.style.touchAction = 'none';
    this.bindEvents();
  }

  private getPos(e: PointerEvent): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * this.scaleX,
      y: (e.clientY - rect.top) * this.scaleY,
    };
  }

  updateScale(canvasW: number, canvasH: number) {
    const rect = this.canvas.getBoundingClientRect();
    this.scaleX = rect.width > 0 ? canvasW / rect.width : 1;
    this.scaleY = rect.height > 0 ? canvasH / rect.height : 1;
  }

  private bindEvents() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.canvas.addEventListener('pointerup', this.onPointerUp, { passive: false });
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.clearPending();
  }

  consumeSwipe(): SwipeResult | null {
    const s = this.pendingSwipe;
    this.pendingSwipe = null;
    return s;
  }

  consumeTap(): boolean {
    const t = this.tapPending;
    this.tapPending = false;
    return t;
  }

  consumeTapWithPos(): Vec2 | null {
    if (this.tapPending) {
      this.tapPending = false;
      const pos = this.tapPos;
      this.tapPos = null;
      return pos;
    }
    return null;
  }

  clearPending(): void {
    this.pendingSwipe = null;
    this.tapPending = false;
    this.tapPos = null;
    this.touching = false;
    this.swipeStart = null;
    this.swipeCurrent = null;
  }

  getActiveSwipe(): { start: Vec2; end: Vec2 } | null {
    if (this.touching && this.swipeStart && this.swipeCurrent) {
      return { start: this.swipeStart, end: this.swipeCurrent };
    }
    return null;
  }
}
