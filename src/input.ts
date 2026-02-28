import type { Vec2, Deflector } from './types';
import { dist, length, sub } from './math';

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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  private getPos(e: TouchEvent | MouseEvent): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * this.scaleX,
        y: (e.touches[0].clientY - rect.top) * this.scaleY,
      };
    }
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return {
        x: (e.changedTouches[0].clientX - rect.left) * this.scaleX,
        y: (e.changedTouches[0].clientY - rect.top) * this.scaleY,
      };
    }
    const me = e as MouseEvent;
    return {
      x: (me.clientX - rect.left) * this.scaleX,
      y: (me.clientY - rect.top) * this.scaleY,
    };
  }

  updateScale(canvasW: number, canvasH: number) {
    const rect = this.canvas.getBoundingClientRect();
    this.scaleX = rect.width > 0 ? canvasW / rect.width : 1;
    this.scaleY = rect.height > 0 ? canvasH / rect.height : 1;
  }

  private bindEvents() {
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touching = true;
      this.swipeStart = this.getPos(e);
      this.swipeCurrent = this.swipeStart;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.touching) {
        this.swipeCurrent = this.getPos(e);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
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
    }, { passive: false });

    // Mouse events for desktop testing
    this.canvas.addEventListener('mousedown', (e) => {
      this.touching = true;
      this.swipeStart = this.getPos(e);
      this.swipeCurrent = this.swipeStart;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.touching) {
        this.swipeCurrent = this.getPos(e);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
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
    });
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

  getActiveSwipe(): { start: Vec2; end: Vec2 } | null {
    if (this.touching && this.swipeStart && this.swipeCurrent) {
      return { start: this.swipeStart, end: this.swipeCurrent };
    }
    return null;
  }
}
