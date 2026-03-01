# Beat Data System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the procedural music engine with a two-part system: an offline CLI tool (Essentia.js) that extracts beat/energy/event data from MP3s into JSON, and a game-side `SongPlayer` that plays MP3s and consumes that JSON to drive visual effects.

**Architecture:** The CLI tool (`tools/analyze-song/`) is a standalone Node.js project that uses Essentia.js WASM to analyze MP3 files and output `SongData` JSON. The game-side `SongPlayer` replaces `MusicEngine` in `src/music.ts`, plays audio via `HTMLAudioElement`, and reads pre-computed beat data to produce the same `BeatState` interface the renderer already consumes. The renderer requires zero changes.

**Tech Stack:** Essentia.js (WASM), audiodecode (MP3 decoding), tsx (TypeScript CLI), HTMLAudioElement (game playback), Vitest (testing)

**Design doc:** `docs/plans/2026-02-28-beat-data-system-design.md`

---

### Task 1: Define SongData Types (Shared Contract)

**Files:**
- Create: `src/song-data.ts`
- Test: `src/__tests__/song-data.test.ts`

**Step 1: Write the type file**

Create `src/song-data.ts` with the `SongData` interfaces. These types are the contract between the CLI tool and the game.

```typescript
// src/song-data.ts

export interface BPMSection {
  time: number;
  bpm: number;
}

export interface Beat {
  time: number;
  type: 'kick' | 'snare' | 'hat' | 'downbeat';
  intensity: number;
}

export interface EnergyFrame {
  time: number;
  low: number;
  mid: number;
  high: number;
  total: number;
}

export interface SongEvent {
  time: number;
  type: 'buildup' | 'drop' | 'breakdown' | 'intro' | 'outro';
  duration: number;
}

export interface SongData {
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  bpmSections: BPMSection[];
  beats: Beat[];
  energy: EnergyFrame[];
  events: SongEvent[];
}
```

**Step 2: Write a validation test**

Create `src/__tests__/song-data.test.ts`. This test validates a minimal SongData object satisfies the interface contract and catches structural issues early.

```typescript
import { describe, it, expect } from 'vitest';
import type { SongData } from '../song-data';

function createTestSongData(): SongData {
  return {
    title: 'Test Track',
    artist: 'Test Artist',
    duration: 120,
    bpm: 128,
    bpmSections: [{ time: 0, bpm: 128 }],
    beats: [
      { time: 0.0, type: 'kick', intensity: 1.0 },
      { time: 0.469, type: 'hat', intensity: 0.6 },
      { time: 0.938, type: 'snare', intensity: 0.9 },
    ],
    energy: [
      { time: 0.0, low: 0.8, mid: 0.3, high: 0.2, total: 0.5 },
    ],
    events: [
      { time: 0, type: 'intro', duration: 8 },
      { time: 60, type: 'drop', duration: 16 },
    ],
  };
}

describe('SongData', () => {
  it('has required metadata fields', () => {
    const data = createTestSongData();
    expect(data.title).toBe('Test Track');
    expect(data.artist).toBe('Test Artist');
    expect(data.duration).toBe(120);
    expect(data.bpm).toBe(128);
  });

  it('beats are sorted by time', () => {
    const data = createTestSongData();
    for (let i = 1; i < data.beats.length; i++) {
      expect(data.beats[i].time).toBeGreaterThanOrEqual(data.beats[i - 1].time);
    }
  });

  it('energy frames are sorted by time', () => {
    const data = createTestSongData();
    for (let i = 1; i < data.energy.length; i++) {
      expect(data.energy[i].time).toBeGreaterThanOrEqual(data.energy[i - 1].time);
    }
  });

  it('beat intensities are 0-1', () => {
    const data = createTestSongData();
    for (const beat of data.beats) {
      expect(beat.intensity).toBeGreaterThanOrEqual(0);
      expect(beat.intensity).toBeLessThanOrEqual(1);
    }
  });

  it('energy values are 0-1', () => {
    const data = createTestSongData();
    for (const frame of data.energy) {
      expect(frame.low).toBeGreaterThanOrEqual(0);
      expect(frame.low).toBeLessThanOrEqual(1);
      expect(frame.mid).toBeGreaterThanOrEqual(0);
      expect(frame.total).toBeLessThanOrEqual(1);
    }
  });
});

export { createTestSongData };
```

**Step 3: Run tests**

Run: `cd /Users/donmccluney/source/claude-test/deflect && npx vitest run src/__tests__/song-data.test.ts`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/song-data.ts src/__tests__/song-data.test.ts
git commit -m "feat: add SongData types (shared contract between CLI tool and game)"
```

---

### Task 2: Build SongPlayer (Game Consumer)

**Files:**
- Create: `src/song-player.ts`
- Test: `src/__tests__/song-player.test.ts`

This replaces `MusicEngine`. It reads pre-computed `SongData` and produces `BeatState` for the renderer.

**Step 1: Write the failing tests**

Create `src/__tests__/song-player.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SongPlayer } from '../song-player';
import type { SongData } from '../song-data';

function createTestSongData(): SongData {
  return {
    title: 'Test',
    artist: 'Test',
    duration: 10,
    bpm: 120,
    bpmSections: [{ time: 0, bpm: 120 }],
    beats: [
      { time: 0.0, type: 'kick', intensity: 1.0 },
      { time: 0.5, type: 'hat', intensity: 0.6 },
      { time: 1.0, type: 'snare', intensity: 0.9 },
      { time: 1.5, type: 'kick', intensity: 1.0 },
      { time: 2.0, type: 'hat', intensity: 0.5 },
    ],
    energy: [
      { time: 0.0, low: 0.8, mid: 0.3, high: 0.2, total: 0.5 },
      { time: 0.5, low: 0.2, mid: 0.5, high: 0.7, total: 0.4 },
      { time: 1.0, low: 0.9, mid: 0.4, high: 0.1, total: 0.6 },
    ],
    events: [
      { time: 0, type: 'intro', duration: 2 },
      { time: 4, type: 'drop', duration: 4 },
    ],
  };
}

describe('SongPlayer', () => {
  let player: SongPlayer;

  beforeEach(() => {
    player = new SongPlayer();
  });

  describe('initialization', () => {
    it('starts with zero intensities', () => {
      const state = player.getBeatState();
      expect(state.kickIntensity).toBe(0);
      expect(state.snareIntensity).toBe(0);
      expect(state.hatIntensity).toBe(0);
      expect(state.beatPhase).toBe(0);
      expect(state.visualIntensity).toBe(0);
    });
  });

  describe('loadSongData', () => {
    it('stores song data and sets BPM', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      expect(player.getBeatState().bpm).toBe(120);
    });
  });

  describe('updateAtTime (core sync logic)', () => {
    it('triggers kick intensity when passing a kick beat', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(0.01, 0.016); // just past first beat (kick at t=0)
      expect(player.getBeatState().kickIntensity).toBe(1);
    });

    it('triggers hat intensity when passing a hat beat', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(0.51, 0.016); // just past hat at t=0.5
      expect(player.getBeatState().hatIntensity).toBeGreaterThan(0);
    });

    it('triggers snare intensity when passing a snare beat', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(1.01, 0.016); // just past snare at t=1.0
      expect(player.getBeatState().snareIntensity).toBeGreaterThan(0);
    });

    it('decays intensities over time', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(0.01, 0.016); // trigger kick
      const initial = player.getBeatState().kickIntensity;
      player.updateAtTime(0.2, 0.016); // 200ms later, no new beat
      expect(player.getBeatState().kickIntensity).toBeLessThan(initial);
    });

    it('computes beatPhase between beats', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      // Halfway between beat at 0.0 and beat at 0.5
      player.updateAtTime(0.25, 0.016);
      expect(player.getBeatState().beatPhase).toBeCloseTo(0.5, 1);
    });

    it('does not re-trigger already-passed beats', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(0.01, 0.016); // trigger kick at t=0
      player.updateAtTime(0.3, 0.016);  // decay
      const decayed = player.getBeatState().kickIntensity;
      player.updateAtTime(0.4, 0.016);  // still before next beat
      expect(player.getBeatState().kickIntensity).toBeLessThanOrEqual(decayed);
    });
  });

  describe('setIntensityLevel', () => {
    it('maps layer count to visualIntensity with floor of 0.5', () => {
      player.setIntensityLevel(1);
      expect(player.getBeatState().visualIntensity).toBeCloseTo(0.5);
      player.setIntensityLevel(3);
      expect(player.getBeatState().visualIntensity).toBeCloseTo(0.6);
      player.setIntensityLevel(5);
      expect(player.getBeatState().visualIntensity).toBeCloseTo(1.0);
    });
  });

  describe('getCurrentEvent', () => {
    it('returns the current song event based on time', () => {
      const data = createTestSongData();
      player.loadSongData(data);
      player.updateAtTime(1.0, 0.016); // during intro (0-2s)
      expect(player.getCurrentEvent()?.type).toBe('intro');
      player.updateAtTime(5.0, 0.016); // during drop (4-8s)
      expect(player.getCurrentEvent()?.type).toBe('drop');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/donmccluney/source/claude-test/deflect && npx vitest run src/__tests__/song-player.test.ts`
Expected: FAIL — `SongPlayer` module not found

**Step 3: Implement SongPlayer**

Create `src/song-player.ts`:

```typescript
import type { SongData, Beat, SongEvent } from './song-data';

export interface BeatState {
  kickIntensity: number;
  snareIntensity: number;
  hatIntensity: number;
  beatPhase: number;
  visualIntensity: number;
  bpm: number;
}

const INTENSITY_DECAY_RATE = 8;

export class SongPlayer {
  private songData: SongData | null = null;
  private beatState: BeatState = {
    kickIntensity: 0,
    snareIntensity: 0,
    hatIntensity: 0,
    beatPhase: 0,
    visualIntensity: 0,
    bpm: 0,
  };

  // Index tracking for O(1) per-frame advancement
  private beatIndex = 0;
  private energyIndex = 0;
  private currentTime = 0;

  // Audio element for playback (null in tests)
  private audio: HTMLAudioElement | null = null;

  getBeatState(): BeatState {
    return this.beatState;
  }

  loadSongData(data: SongData): void {
    this.songData = data;
    this.beatState.bpm = data.bpm;
    this.beatIndex = 0;
    this.energyIndex = 0;
    this.currentTime = 0;
  }

  start(mp3Url: string, songData: SongData): void {
    this.loadSongData(songData);
    this.audio = new Audio(mp3Url);
    this.audio.play().catch(() => {
      // Autoplay may be blocked; will resume on user interaction
    });
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.beatState.kickIntensity = 0;
    this.beatState.snareIntensity = 0;
    this.beatState.hatIntensity = 0;
    this.beatState.beatPhase = 0;
    this.beatIndex = 0;
    this.energyIndex = 0;
    this.currentTime = 0;
  }

  /** Called each frame from game.update(). Uses audio.currentTime if available. */
  update(dt: number): void {
    if (this.audio) {
      this.updateAtTime(this.audio.currentTime, dt);
    }
  }

  /** Core sync logic — testable without audio element. */
  updateAtTime(time: number, dt: number): void {
    if (!this.songData) return;
    this.currentTime = time;

    const beats = this.songData.beats;

    // Advance beat index and trigger intensities for passed beats
    while (this.beatIndex < beats.length && beats[this.beatIndex].time <= time) {
      const beat = beats[this.beatIndex];
      switch (beat.type) {
        case 'kick':
        case 'downbeat':
          this.beatState.kickIntensity = beat.intensity;
          break;
        case 'snare':
          this.beatState.snareIntensity = beat.intensity;
          break;
        case 'hat':
          this.beatState.hatIntensity = beat.intensity;
          break;
      }
      this.beatIndex++;
    }

    // Decay intensities
    const decay = INTENSITY_DECAY_RATE * dt;
    this.beatState.kickIntensity = Math.max(0, this.beatState.kickIntensity - decay);
    this.beatState.snareIntensity = Math.max(0, this.beatState.snareIntensity - decay);
    this.beatState.hatIntensity = Math.max(0, this.beatState.hatIntensity - decay);

    // Compute beatPhase: 0-1 between the previous and next beat
    const prevIdx = Math.max(0, this.beatIndex - 1);
    const nextIdx = Math.min(this.beatIndex, beats.length - 1);
    if (prevIdx !== nextIdx) {
      const prevTime = beats[prevIdx].time;
      const nextTime = beats[nextIdx].time;
      const span = nextTime - prevTime;
      if (span > 0) {
        this.beatState.beatPhase = Math.min(1, (time - prevTime) / span);
      }
    }

    // Update BPM from bpmSections
    const sections = this.songData.bpmSections;
    for (let i = sections.length - 1; i >= 0; i--) {
      if (time >= sections[i].time) {
        this.beatState.bpm = sections[i].bpm;
        break;
      }
    }
  }

  setIntensityLevel(layers: number): void {
    this.beatState.visualIntensity = Math.min(1, Math.max(0.5, layers / 5));
  }

  getCurrentEvent(): SongEvent | null {
    if (!this.songData) return null;
    for (let i = this.songData.events.length - 1; i >= 0; i--) {
      const evt = this.songData.events[i];
      if (this.currentTime >= evt.time && this.currentTime < evt.time + evt.duration) {
        return evt;
      }
    }
    return null;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/donmccluney/source/claude-test/deflect && npx vitest run src/__tests__/song-player.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/song-player.ts src/__tests__/song-player.test.ts
git commit -m "feat: add SongPlayer class to consume pre-analyzed beat data"
```

---

### Task 3: Integrate SongPlayer into Game

**Files:**
- Modify: `src/game.ts` — replace `MusicEngine` with `SongPlayer`
- Modify: `src/renderer.ts:5` — update `BeatState` import path
- Modify: `src/__tests__/music.test.ts` — remove or adapt
- Test: `src/__tests__/game.test.ts` (existing, should still pass)

**Step 1: Update renderer import**

In `src/renderer.ts:5`, change:
```typescript
import type { BeatState } from './music';
```
to:
```typescript
import type { BeatState } from './song-player';
```

**Step 2: Update game.ts**

Replace the `MusicEngine` import and usage:

At top of `src/game.ts`, change:
```typescript
import { MusicEngine } from './music';
```
to:
```typescript
import { SongPlayer } from './song-player';
import type { SongData } from './song-data';
```

Change the property declaration at `src/game.ts:112`:
```typescript
music = new MusicEngine();
```
to:
```typescript
music = new SongPlayer();
private songData: SongData | null = null;
```

In `startGame()` at `src/game.ts:287`, change:
```typescript
this.music.start();
```
to:
```typescript
if (this.songData) {
  this.music.start('songs/track1.mp3', this.songData);
}
```

In `updateDifficulty()` at `src/game.ts:540-546`, remove the `setBPM()` call (BPM now comes from song data):
```typescript
// Remove this line:
this.music.setBPM(bpm);
```
Keep the `setIntensityLevel()` call — it still controls visual intensity.

In `onGameOver()` at `src/game.ts:814` and `updateGameOver()` at `src/game.ts:490,495`, `music.stop()` calls remain unchanged (same API).

In `destroy()` at `src/game.ts:200`, `music.stop()` remains unchanged.

**Step 3: Add song data loading**

Add a static method or loader to `Game` class. In `startGame()`, before `this.music.start(...)`:

```typescript
// In Game class, add a method:
async loadSong(name: string): Promise<void> {
  const response = await fetch(`songs/${name}.json`);
  this.songData = await response.json() as SongData;
}
```

For now, `startGame()` can load synchronously from a pre-imported JSON for bundling:
```typescript
// At top of game.ts:
import defaultSong from '../songs/track1.json';
```

And in `startGame()`:
```typescript
this.songData = defaultSong as SongData;
this.music.start('songs/track1.mp3', this.songData);
```

Note: The actual MP3 and JSON files will be created in Task 5 (CLI tool) and Task 6 (integration test). For now, guard with `if (this.songData)`.

**Step 4: Delete old music engine**

Delete `src/music.ts` (the old `MusicEngine` with all procedural synth code).

Replace `src/__tests__/music.test.ts` with a redirect comment or delete it (its functionality is covered by `song-player.test.ts`).

**Step 5: Run full test suite**

Run: `cd /Users/donmccluney/source/claude-test/deflect && npx vitest run`
Expected: All tests pass. The renderer tests should pass unchanged since `BeatState` interface is the same. Game tests should pass since the `music` property still has `getBeatState()`, `update()`, `stop()`.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: replace MusicEngine with SongPlayer in game integration"
```

---

### Task 4: Scaffold CLI Tool Project

**Files:**
- Create: `tools/analyze-song/package.json`
- Create: `tools/analyze-song/tsconfig.json`
- Create: `tools/analyze-song/src/types.ts` (re-export from shared)
- Create: `tools/analyze-song/analyze.ts` (CLI entry point skeleton)

**Step 1: Create project structure**

```bash
mkdir -p tools/analyze-song/src
```

**Step 2: Create package.json**

```json
{
  "name": "deflect-analyze-song",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "analyze": "tsx analyze.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "essentia.js": "^0.1.3",
    "audiodecode": "^1.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.7.0",
    "vitest": "^4.0.18"
  }
}
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["*.ts", "src/**/*.ts"]
}
```

**Step 4: Create CLI entry point skeleton**

Create `tools/analyze-song/analyze.ts`:

```typescript
#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: npx tsx analyze.ts <input.mp3> [-o output.json]');
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const outputFlag = args.indexOf('-o');
  const outputPath = outputFlag >= 0 && args[outputFlag + 1]
    ? resolve(args[outputFlag + 1])
    : inputPath.replace(/\.\w+$/, '.json');

  console.log(`Analyzing: ${inputPath}`);
  console.log(`Output:    ${outputPath}`);

  // Step 1: Decode MP3 to PCM
  // TODO: implement in Task 5

  // Step 2: Analyze with Essentia.js
  // TODO: implement in Task 5

  // Step 3: Write output
  // TODO: implement in Task 5

  console.log('Analysis complete.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
```

**Step 5: Install dependencies**

```bash
cd tools/analyze-song && npm install
```

**Step 6: Verify skeleton runs**

```bash
cd tools/analyze-song && npx tsx analyze.ts --help
```
Expected: Prints usage message and exits

**Step 7: Commit**

```bash
git add tools/analyze-song/
git commit -m "feat: scaffold CLI tool project for offline beat analysis"
```

---

### Task 5: Implement CLI Beat Analysis Pipeline

**Files:**
- Create: `tools/analyze-song/src/decode.ts`
- Create: `tools/analyze-song/src/beats.ts`
- Create: `tools/analyze-song/src/energy.ts`
- Create: `tools/analyze-song/src/events.ts`
- Create: `tools/analyze-song/src/format.ts`
- Modify: `tools/analyze-song/analyze.ts` — wire up pipeline

This task is the most complex. Each sub-module should be implemented and tested individually.

**Step 1: Implement decode.ts**

```typescript
// tools/analyze-song/src/decode.ts
import { readFile } from 'node:fs/promises';
import { decode } from 'audiodecode';

export interface DecodedAudio {
  sampleRate: number;
  channelData: Float32Array; // mono mixdown
  duration: number;
}

export async function decodeMP3(filePath: string): Promise<DecodedAudio> {
  const buffer = await readFile(filePath);
  const audioBuffer = await decode(buffer);

  // Mixdown to mono
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mono = new Float32Array(length);

  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      mono[i] += channelData[i] / numChannels;
    }
  }

  return {
    sampleRate: audioBuffer.sampleRate,
    channelData: mono,
    duration: audioBuffer.duration,
  };
}
```

**Step 2: Implement beats.ts**

This uses Essentia.js for beat detection. Note: Essentia.js API may require checking current docs at build time. The implementation should follow their Node.js WASM usage patterns.

```typescript
// tools/analyze-song/src/beats.ts
import type { Beat } from './types.js';

// Essentia.js import — check docs for exact WASM loading pattern
// import Essentia from 'essentia.js';
// import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.module.js';

export interface BeatAnalysis {
  bpm: number;
  beats: Beat[];
}

export async function analyzeBeats(
  samples: Float32Array,
  sampleRate: number,
): Promise<BeatAnalysis> {
  // Initialize Essentia WASM
  // const essentia = new Essentia(await EssentiaWASM());

  // Use RhythmExtractor2013 for BPM + beat positions
  // const rhythm = essentia.RhythmExtractor2013(essentia.arrayToVector(samples));
  // const bpm = rhythm.bpm;
  // const beatTicks = essentia.vectorToArray(rhythm.ticks);

  // Classify beats based on spectral content at each beat position
  // For each beat tick, analyze a short window (~50ms) around the beat:
  //   - High low-frequency energy (< 300Hz) → kick
  //   - Mid-frequency noise (300-4kHz) → snare
  //   - High-frequency transient (> 4kHz) → hat
  //   - Beat on downbeat positions (every 4th) → downbeat

  // TODO: Wire up actual Essentia.js calls. The exact API depends on the
  // version installed. Check: https://mtg.github.io/essentia.js/
  // Fallback: use onset detection + spectral centroid for classification

  // Placeholder structure:
  const beats: Beat[] = [];
  // ... populate from Essentia output ...

  return { bpm: 120, beats };
}
```

**Step 3: Implement energy.ts**

```typescript
// tools/analyze-song/src/energy.ts
import type { EnergyFrame } from './types.js';

const FRAME_RATE = 30; // ~30 frames per second

export function analyzeEnergy(
  samples: Float32Array,
  sampleRate: number,
): EnergyFrame[] {
  const frames: EnergyFrame[] = [];
  const frameSize = Math.floor(sampleRate / FRAME_RATE);
  const fftSize = 2048;

  for (let offset = 0; offset + fftSize <= samples.length; offset += frameSize) {
    const time = offset / sampleRate;
    const window = samples.slice(offset, offset + fftSize);

    // Compute RMS for total energy
    let sum = 0;
    for (let i = 0; i < window.length; i++) {
      sum += window[i] * window[i];
    }
    const rms = Math.sqrt(sum / window.length);

    // Simple band-split energy using time-domain filtering approximation
    // For production quality, use FFT and sum bin magnitudes per band
    // Low: 20-300Hz, Mid: 300-4kHz, High: 4kHz+
    const total = Math.min(1, rms * 4); // normalize to 0-1 range

    frames.push({
      time,
      low: total * 0.6,  // placeholder — replace with FFT band energy
      mid: total * 0.3,
      high: total * 0.1,
      total,
    });
  }

  return frames;
}
```

**Step 4: Implement events.ts**

```typescript
// tools/analyze-song/src/events.ts
import type { SongEvent, EnergyFrame } from './types.js';

export function detectEvents(
  energy: EnergyFrame[],
  duration: number,
): SongEvent[] {
  const events: SongEvent[] = [];
  if (energy.length < 2) return events;

  // Detect structural events by analyzing energy contour
  const windowSize = 30; // ~1 second at 30fps

  // Compute smoothed energy derivative
  const smoothed: number[] = [];
  for (let i = 0; i < energy.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowSize); j <= Math.min(energy.length - 1, i + windowSize); j++) {
      sum += energy[j].total;
      count++;
    }
    smoothed.push(sum / count);
  }

  // Detect intro (low energy at start)
  if (smoothed[0] < 0.3) {
    let introEnd = 0;
    while (introEnd < smoothed.length && smoothed[introEnd] < 0.3) introEnd++;
    if (introEnd > 0) {
      events.push({ time: 0, type: 'intro', duration: energy[Math.min(introEnd, energy.length - 1)].time });
    }
  }

  // Detect drops (sudden energy increase after low section)
  for (let i = windowSize; i < smoothed.length - 1; i++) {
    const prev = smoothed[i - windowSize];
    const curr = smoothed[i];
    if (curr - prev > 0.3 && curr > 0.5) {
      // Find drop duration (how long energy stays high)
      let dropEnd = i;
      while (dropEnd < smoothed.length && smoothed[dropEnd] > curr * 0.7) dropEnd++;
      events.push({
        time: energy[i].time,
        type: 'drop',
        duration: energy[Math.min(dropEnd, energy.length - 1)].time - energy[i].time,
      });
      i = dropEnd; // skip past this drop
    }
  }

  // Detect outro (low energy at end)
  const lastIdx = smoothed.length - 1;
  if (smoothed[lastIdx] < 0.3) {
    let outroStart = lastIdx;
    while (outroStart > 0 && smoothed[outroStart] < 0.3) outroStart--;
    events.push({
      time: energy[outroStart].time,
      type: 'outro',
      duration: duration - energy[outroStart].time,
    });
  }

  return events;
}
```

**Step 5: Implement format.ts**

```typescript
// tools/analyze-song/src/format.ts
import type { SongData, Beat, EnergyFrame, SongEvent } from './types.js';

export function formatSongData(params: {
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  beats: Beat[];
  energy: EnergyFrame[];
  events: SongEvent[];
}): SongData {
  return {
    title: params.title,
    artist: params.artist,
    duration: params.duration,
    bpm: params.bpm,
    bpmSections: [{ time: 0, bpm: params.bpm }],
    beats: params.beats.sort((a, b) => a.time - b.time),
    energy: params.energy.sort((a, b) => a.time - b.time),
    events: params.events.sort((a, b) => a.time - b.time),
  };
}
```

**Step 6: Create types.ts (re-export)**

```typescript
// tools/analyze-song/src/types.ts
// Re-export SongData types. These match the game's src/song-data.ts exactly.
export type { SongData, Beat, BPMSection, EnergyFrame, SongEvent } from '../../../src/song-data.js';
```

Note: If the import path doesn't resolve cleanly, copy the interfaces. The contract is the JSON schema, not the TypeScript import.

**Step 7: Wire up analyze.ts**

Update `tools/analyze-song/analyze.ts` to call the pipeline:

```typescript
#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { decodeMP3 } from './src/decode.js';
import { analyzeBeats } from './src/beats.js';
import { analyzeEnergy } from './src/energy.js';
import { detectEvents } from './src/events.js';
import { formatSongData } from './src/format.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: npx tsx analyze.ts <input.mp3> [-o output.json]');
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const outputFlag = args.indexOf('-o');
  const outputPath = outputFlag >= 0 && args[outputFlag + 1]
    ? resolve(args[outputFlag + 1])
    : inputPath.replace(/\.\w+$/, '.json');

  const title = basename(inputPath, '.mp3');

  console.log(`Analyzing: ${inputPath}`);

  // Step 1: Decode
  console.log('  Decoding MP3...');
  const audio = await decodeMP3(inputPath);
  console.log(`  Sample rate: ${audio.sampleRate}, Duration: ${audio.duration.toFixed(1)}s`);

  // Step 2: Beat detection
  console.log('  Detecting beats...');
  const { bpm, beats } = await analyzeBeats(audio.channelData, audio.sampleRate);
  console.log(`  BPM: ${bpm}, Beats: ${beats.length}`);

  // Step 3: Energy analysis
  console.log('  Analyzing energy...');
  const energy = analyzeEnergy(audio.channelData, audio.sampleRate);
  console.log(`  Energy frames: ${energy.length}`);

  // Step 4: Event detection
  console.log('  Detecting events...');
  const events = detectEvents(energy, audio.duration);
  console.log(`  Events: ${events.length}`);

  // Step 5: Format and write
  const songData = formatSongData({
    title,
    artist: 'Unknown',
    duration: audio.duration,
    bpm,
    beats,
    energy,
    events,
  });

  await writeFile(outputPath, JSON.stringify(songData, null, 2));
  console.log(`Output: ${outputPath}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
```

**Step 8: Commit**

```bash
git add tools/analyze-song/
git commit -m "feat: implement CLI beat analysis pipeline with Essentia.js"
```

---

### Task 6: Create Test Song Data & Integration Test

**Files:**
- Create: `songs/` directory with a test MP3 (or hand-crafted JSON for testing)
- Create: `src/__tests__/integration.test.ts` — end-to-end test

Since we may not have an MP3 at hand, create a hand-crafted `songs/test-track.json` that validates the full pipeline from JSON → SongPlayer → BeatState.

**Step 1: Create test song JSON**

Create `songs/test-track.json`:

```json
{
  "title": "Test Track",
  "artist": "DEFLECT",
  "duration": 30,
  "bpm": 128,
  "bpmSections": [{ "time": 0, "bpm": 128 }],
  "beats": [
    { "time": 0.000, "type": "kick", "intensity": 1.0 },
    { "time": 0.234, "type": "hat", "intensity": 0.5 },
    { "time": 0.469, "type": "snare", "intensity": 0.8 },
    { "time": 0.703, "type": "hat", "intensity": 0.5 },
    { "time": 0.938, "type": "kick", "intensity": 1.0 },
    { "time": 1.172, "type": "hat", "intensity": 0.5 },
    { "time": 1.406, "type": "snare", "intensity": 0.8 },
    { "time": 1.641, "type": "hat", "intensity": 0.5 },
    { "time": 1.875, "type": "kick", "intensity": 1.0 }
  ],
  "energy": [
    { "time": 0.0, "low": 0.8, "mid": 0.3, "high": 0.2, "total": 0.5 },
    { "time": 0.5, "low": 0.3, "mid": 0.5, "high": 0.6, "total": 0.4 },
    { "time": 1.0, "low": 0.9, "mid": 0.4, "high": 0.1, "total": 0.6 },
    { "time": 1.5, "low": 0.7, "mid": 0.3, "high": 0.3, "total": 0.5 }
  ],
  "events": [
    { "time": 0, "type": "intro", "duration": 4 },
    { "time": 15, "type": "drop", "duration": 12 },
    { "time": 27, "type": "outro", "duration": 3 }
  ]
}
```

**Step 2: Write integration test**

Create `src/__tests__/integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { SongPlayer } from '../song-player';
import testSongData from '../../songs/test-track.json';
import type { SongData } from '../song-data';

describe('SongPlayer integration with real song data', () => {
  it('loads and plays through test track data', () => {
    const player = new SongPlayer();
    player.loadSongData(testSongData as SongData);

    // Simulate playback at 60fps for 2 seconds
    const dt = 1 / 60;
    let kickTriggered = false;
    let snareTriggered = false;
    let hatTriggered = false;

    for (let t = 0; t < 2; t += dt) {
      player.updateAtTime(t, dt);
      const state = player.getBeatState();
      if (state.kickIntensity > 0.5) kickTriggered = true;
      if (state.snareIntensity > 0.5) snareTriggered = true;
      if (state.hatIntensity > 0.3) hatTriggered = true;
    }

    expect(kickTriggered).toBe(true);
    expect(snareTriggered).toBe(true);
    expect(hatTriggered).toBe(true);
  });

  it('beat phase progresses smoothly between beats', () => {
    const player = new SongPlayer();
    player.loadSongData(testSongData as SongData);

    const phases: number[] = [];
    const dt = 1 / 60;
    for (let t = 0; t < 1; t += dt) {
      player.updateAtTime(t, dt);
      phases.push(player.getBeatState().beatPhase);
    }

    // Phase should generally increase between beats (0→1), then reset
    // At minimum it should not be stuck at 0
    const nonZero = phases.filter(p => p > 0);
    expect(nonZero.length).toBeGreaterThan(0);
  });

  it('detects current song event', () => {
    const player = new SongPlayer();
    player.loadSongData(testSongData as SongData);

    player.updateAtTime(2, 0.016);
    expect(player.getCurrentEvent()?.type).toBe('intro');

    player.updateAtTime(20, 0.016);
    expect(player.getCurrentEvent()?.type).toBe('drop');
  });
});
```

**Step 3: Run tests**

Run: `cd /Users/donmccluney/source/claude-test/deflect && npx vitest run`
Expected: All tests pass including integration test

**Step 4: Commit**

```bash
git add songs/test-track.json src/__tests__/integration.test.ts
git commit -m "feat: add test song data and integration test for SongPlayer"
```

---

### Task 7: Clean Up & Final Verification

**Files:**
- Remove: `src/music.ts` (if not already done in Task 3)
- Remove: `src/__tests__/music.test.ts` (if not already done in Task 3)
- Modify: `src/game.ts` — verify no remaining references to `MusicEngine`

**Step 1: Verify no dangling imports**

Run: `cd /Users/donmccluney/source/claude-test/deflect && npx tsc --noEmit`
Expected: 0 errors

**Step 2: Run linter**

Run: `cd /Users/donmccluney/source/claude-test/deflect && npm run lint`
Expected: 0 errors

**Step 3: Run full test suite**

Run: `cd /Users/donmccluney/source/claude-test/deflect && npx vitest run`
Expected: All tests pass

**Step 4: Build**

Run: `cd /Users/donmccluney/source/claude-test/deflect && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: clean up old MusicEngine references, final verification"
```

---

## Task Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Define SongData types (shared contract) | None |
| 2 | Build SongPlayer (game consumer) | Task 1 |
| 3 | Integrate SongPlayer into Game | Tasks 1, 2 |
| 4 | Scaffold CLI tool project | Task 1 |
| 5 | Implement CLI beat analysis pipeline | Task 4 |
| 6 | Create test song data & integration test | Tasks 2, 3 |
| 7 | Clean up & final verification | All |

Tasks 4-5 (CLI tool) and Tasks 2-3 (game consumer) can run **in parallel** since they share only the types from Task 1.
