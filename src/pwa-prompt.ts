/** PWA install prompt - intercepts beforeinstallprompt and shows banner */

import type { GameMode } from './types';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class PwaPrompt {
  private gameOverCount = 0;
  private playedDaily = false;
  private dismissed = false;
  private isStandalone = false;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private boundHandler: (e: Event) => void;

  constructor() {
    // Check if already running as standalone PWA
    try {
      const mq = window.matchMedia('(display-mode: standalone)');
      this.isStandalone = mq.matches;
    } catch {
      // matchMedia not available
    }

    // Check if dismissed previously
    try {
      this.dismissed = localStorage.getItem('deflect_pwa_dismissed') === '1';
    } catch {
      // localStorage not available
    }

    // Listen for beforeinstallprompt
    this.boundHandler = (e: Event) => this.handleBeforeInstallPrompt(e);
    try {
      window.addEventListener('beforeinstallprompt', this.boundHandler);
    } catch {
      // window.addEventListener not available in test
    }
  }

  /** Called externally (and by the beforeinstallprompt listener) */
  handleBeforeInstallPrompt(e: Event): void {
    e.preventDefault();
    this.deferredPrompt = e as BeforeInstallPromptEvent;
  }

  /** Track game over events to decide when to show prompt */
  onGameOver(mode: GameMode): void {
    this.gameOverCount++;
    if (mode === 'daily') {
      this.playedDaily = true;
    }
  }

  /** Whether the PWA install banner should be shown */
  shouldShow(): boolean {
    if (this.dismissed) return false;
    if (this.isStandalone) return false;
    return this.gameOverCount >= 3 || this.playedDaily;
  }

  /** Dismiss the banner and persist */
  dismiss(): void {
    this.dismissed = true;
    try {
      localStorage.setItem('deflect_pwa_dismissed', '1');
    } catch {
      // localStorage not available
    }
  }

  /** Trigger the native install prompt */
  async install(): Promise<void> {
    if (!this.deferredPrompt) return;
    await this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      this.dismissed = true;
    }
    this.deferredPrompt = null;
  }

  /** Cleanup event listener */
  destroy(): void {
    try {
      window.removeEventListener('beforeinstallprompt', this.boundHandler);
    } catch {
      // window not available
    }
  }
}
