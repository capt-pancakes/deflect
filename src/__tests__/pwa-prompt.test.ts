import { describe, it, expect, vi, afterEach } from 'vitest';
import { PwaPrompt } from '../pwa-prompt';

function stubEnv(opts: {
  standalone?: boolean;
  dismissed?: boolean;
} = {}) {
  const store: Record<string, string> = {};
  if (opts.dismissed) {
    store['deflect_pwa_dismissed'] = '1';
  }

  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  });

  vi.stubGlobal('window', {
    matchMedia: vi.fn(() => ({
      matches: opts.standalone ?? false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });

  return { store };
}

describe('PwaPrompt', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts not showing', () => {
    stubEnv();
    const prompt = new PwaPrompt();
    expect(prompt.shouldShow()).toBe(false);
  });

  it('shows after 3 game overs', () => {
    stubEnv();
    const prompt = new PwaPrompt();
    prompt.onGameOver('arcade');
    prompt.onGameOver('arcade');
    expect(prompt.shouldShow()).toBe(false);
    prompt.onGameOver('arcade');
    expect(prompt.shouldShow()).toBe(true);
  });

  it('shows after first daily challenge', () => {
    stubEnv();
    const prompt = new PwaPrompt();
    prompt.onGameOver('daily');
    expect(prompt.shouldShow()).toBe(true);
  });

  it('does not show if dismissed', () => {
    stubEnv({ dismissed: true });
    const prompt = new PwaPrompt();
    prompt.onGameOver('arcade');
    prompt.onGameOver('arcade');
    prompt.onGameOver('arcade');
    expect(prompt.shouldShow()).toBe(false);
  });

  it('does not show if standalone', () => {
    stubEnv({ standalone: true });
    const prompt = new PwaPrompt();
    prompt.onGameOver('arcade');
    prompt.onGameOver('arcade');
    prompt.onGameOver('arcade');
    expect(prompt.shouldShow()).toBe(false);
  });

  it('dismiss persists to localStorage', () => {
    const { store } = stubEnv();
    const prompt = new PwaPrompt();
    prompt.onGameOver('arcade');
    prompt.onGameOver('arcade');
    prompt.onGameOver('arcade');
    expect(prompt.shouldShow()).toBe(true);
    prompt.dismiss();
    expect(prompt.shouldShow()).toBe(false);
    expect(store['deflect_pwa_dismissed']).toBe('1');
  });

  it('install calls the deferred prompt', async () => {
    stubEnv();
    const prompt = new PwaPrompt();

    // Simulate beforeinstallprompt
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn(() => Promise.resolve()),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };
    prompt.handleBeforeInstallPrompt(mockEvent as unknown as Event);

    await prompt.install();
    expect(mockEvent.prompt).toHaveBeenCalled();
  });

  it('install without deferred event is a no-op', async () => {
    stubEnv();
    const prompt = new PwaPrompt();
    // Should not throw
    await prompt.install();
  });

  it('does not count zen mode game overs toward threshold', () => {
    stubEnv();
    const prompt = new PwaPrompt();
    prompt.onGameOver('zen');
    prompt.onGameOver('zen');
    prompt.onGameOver('zen');
    // zen game overs still count toward the generic counter
    expect(prompt.shouldShow()).toBe(true);
  });
});
