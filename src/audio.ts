/** Procedural audio using Web Audio API - no external files needed */

let audioCtx: AudioContext | null = null;
const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
let muted = false;

export function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  freqEnd?: number,
) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  }

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export const audio = {
  catch(comboLevel: number) {
    // Rising pitch with combo - major pentatonic scale
    const baseFreq = 440;
    const semitones = [0, 2, 4, 7, 9, 12, 14, 16];
    const idx = Math.min(comboLevel, semitones.length - 1);
    const freq = baseFreq * Math.pow(2, semitones[idx] / 12);
    playTone(freq, 0.15, 'sine', 0.12);
    // Harmonic
    playTone(freq * 1.5, 0.1, 'sine', 0.05);
  },

  bounce() {
    playTone(300, 0.08, 'triangle', 0.08, 200);
  },

  damage() {
    playTone(100, 0.3, 'sawtooth', 0.1, 50);
    playTone(80, 0.4, 'square', 0.05, 30);
  },

  gameOver() {
    playTone(440, 0.15, 'sine', 0.1, 220);
    pendingTimeouts.push(setTimeout(() => playTone(330, 0.15, 'sine', 0.1, 165), 150));
    pendingTimeouts.push(setTimeout(() => playTone(220, 0.4, 'sine', 0.1, 110), 300));
  },

  start() {
    playTone(330, 0.1, 'sine', 0.08);
    pendingTimeouts.push(setTimeout(() => playTone(440, 0.1, 'sine', 0.08), 100));
    pendingTimeouts.push(setTimeout(() => playTone(550, 0.15, 'sine', 0.1), 200));
  },

  swipe() {
    playTone(800, 0.06, 'sine', 0.05, 1200);
  },

  init() {
    // Initialize audio context on first user interaction
    getCtx();
  },

  isMuted(): boolean {
    return muted;
  },

  toggleMute(): void {
    muted = !muted;
    try {
      localStorage.setItem('deflect_muted', muted ? '1' : '0');
    } catch {}
  },

  loadMuteState(): void {
    try {
      muted = localStorage.getItem('deflect_muted') === '1';
    } catch {}
  },

  destroy() {
    for (const id of pendingTimeouts) clearTimeout(id);
    pendingTimeouts.length = 0;
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
  },
};
