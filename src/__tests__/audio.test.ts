import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('AudioContext', vi.fn(() => ({
  state: 'running',
  resume: vi.fn(),
  close: vi.fn(() => Promise.resolve()),
  createOscillator: vi.fn(() => ({
    type: '',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  })),
  currentTime: 0,
  destination: {},
})));

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
});

const { audio } = await import('../audio');

describe('audio mute', () => {
  beforeEach(() => {
    if (audio.isMuted()) audio.toggleMute();
  });

  it('starts unmuted', () => {
    expect(audio.isMuted()).toBe(false);
  });

  it('toggleMute toggles state', () => {
    audio.toggleMute();
    expect(audio.isMuted()).toBe(true);
    audio.toggleMute();
    expect(audio.isMuted()).toBe(false);
  });
});
