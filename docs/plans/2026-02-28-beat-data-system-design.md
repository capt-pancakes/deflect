# Beat Data System — Design

## Overview

Replace the procedural synthwave music engine with a two-part system: an offline CLI tool that analyzes MP3 files and outputs structured beat/energy/event data as JSON, and a game-side consumer that plays the MP3 and reads the pre-computed data to drive visuals. The current `MusicEngine` (procedural synth + lookahead scheduler) is removed entirely.

## Motivation

The procedural engine had persistent sync issues between audio events and visual effects. Separating beat analysis (hard DSP problem) from beat consumption (straightforward timeline playback) makes each independently testable and eliminates real-time timing drift.

## Architecture

Two independent pieces:

1. **CLI Tool** (`tools/analyze-song/`) — dev-only, never shipped. Analyzes an MP3 and outputs a `SongData` JSON file.
2. **Game Consumer** (`src/music.ts`) — ships with the game. Plays the MP3 via `HTMLAudioElement` and reads the JSON to drive `BeatState` for the renderer.

The renderer (`renderer.ts`) requires **no changes** — it continues reading the same `BeatState` interface.

## Standard Format: SongData JSON

This is the contract between the tool and the game.

```typescript
interface SongData {
  // Metadata
  title: string;
  artist: string;
  duration: number;           // total duration in seconds

  // Global tempo
  bpm: number;                // primary BPM
  bpmSections: BPMSection[];  // tempo changes mid-song

  // Beat grid
  beats: Beat[];              // every detected beat with timestamp + type

  // Energy timeline (sampled at ~30-60Hz)
  energy: EnergyFrame[];      // per-frame energy in frequency bands

  // Structural events
  events: SongEvent[];        // drops, buildups, breakdowns
}

interface BPMSection {
  time: number;               // start time in seconds
  bpm: number;
}

interface Beat {
  time: number;               // seconds
  type: 'kick' | 'snare' | 'hat' | 'downbeat';
  intensity: number;          // 0-1
}

interface EnergyFrame {
  time: number;               // seconds
  low: number;                // 0-1, bass energy (20-300Hz)
  mid: number;                // 0-1, mids (300-4kHz)
  high: number;               // 0-1, highs (4kHz+)
  total: number;              // 0-1, overall RMS
}

interface SongEvent {
  time: number;               // seconds
  type: 'buildup' | 'drop' | 'breakdown' | 'intro' | 'outro';
  duration: number;           // section duration in seconds
}
```

Songs are bundled as pairs: `songs/track1.mp3` + `songs/track1.json`.

## CLI Tool: `tools/analyze-song/`

### Usage

```bash
cd tools/analyze-song
npx tsx analyze.ts ../../songs/track1.mp3 -o ../../songs/track1.json
```

### Dependencies

- `essentia.js` — Spotify MTG lab's audio analysis library (C++ compiled to WASM). Provides beat tracking, onset detection, BPM estimation, spectral analysis.
- `audiodecode` — Decodes MP3 to raw PCM in Node.js.
- `tsx` — TypeScript execution for Node.js.

### Analysis pipeline

1. **Decode**: Load MP3 via `audiodecode` into a raw PCM float array.
2. **Beat detection**: Feed PCM to Essentia's `RhythmExtractor2013` for BPM + beat positions. Use `OnsetDetection` for individual hit timestamps.
3. **Beat classification**: Classify detected onsets as kick/snare/hat based on spectral characteristics (low-frequency energy = kick, mid-band noise = snare, high-frequency transient = hat).
4. **Energy extraction**: Compute per-frame energy in three bands (low/mid/high) using `EnergyBandRatio` + `RMS`, sampled at ~30-60Hz.
5. **Structural event detection**: Analyze energy derivative over longer windows. Rising energy over 4-8 beats = buildup. Sudden energy spike after buildup = drop. Sustained low energy = breakdown. Low energy at song edges = intro/outro.
6. **Assembly**: Combine all results into `SongData` JSON and write to disk.

### Project structure

```
tools/analyze-song/
  package.json
  tsconfig.json
  analyze.ts              # CLI entry point, argument parsing
  src/
    decode.ts             # MP3 to PCM AudioBuffer
    beats.ts              # Beat detection + onset classification
    energy.ts             # Energy band extraction per frame
    events.ts             # Structural event detection
    format.ts             # Assemble into SongData JSON
    types.ts              # Shared SongData interfaces
```

## Game Consumer: `SongPlayer`

Replaces `MusicEngine` in `src/music.ts`.

```typescript
export class SongPlayer {
  private audio: HTMLAudioElement;
  private songData: SongData | null = null;
  private beatState: BeatState;

  // Sorted array indexes for O(1) per-frame advancement
  private beatIndex = 0;
  private energyIndex = 0;
  private eventIndex = 0;

  constructor();

  // Load song data and start playback
  start(mp3Url: string, songData: SongData): void;

  // Fade out and stop
  stop(): void;

  // Called each frame: advance indexes based on audio.currentTime,
  // update beatState intensities and energy values
  update(dt: number): void;

  // Renderer reads this — same interface as before
  getBeatState(): BeatState;

  // Difficulty system reads this
  setIntensityLevel(layers: number): void;
}
```

### Sync mechanism

Each frame:

1. Read `audio.currentTime` (the source of truth — no drift, no scheduler).
2. Advance `beatIndex` forward through `songData.beats[]` while `beats[beatIndex].time <= currentTime`. For each passed beat, set the corresponding intensity to 1 (kick/snare/hat).
3. Advance `energyIndex` to the nearest `EnergyFrame`. Read `low`/`mid`/`high` values to modulate visual intensity.
4. Advance `eventIndex` to detect current structural section. Game can use this to modulate difficulty or trigger visual mode changes.
5. Decay intensities as before (`intensity -= decayRate * dt`).
6. Compute `beatPhase` from the two nearest beats: `(currentTime - prevBeat.time) / (nextBeat.time - prevBeat.time)`.

### Why HTMLAudioElement over AudioContext

- Simpler API for just playing a file (no need for `decodeAudioData`, `AudioBufferSourceNode`, manual buffering).
- Built-in buffering, seeking, and pause/resume.
- `audio.currentTime` is reliable and doesn't drift.
- SFX still use the existing AudioContext in `audio.ts` — no conflict.

## BeatState Interface (Unchanged)

```typescript
interface BeatState {
  kickIntensity: number;     // 0-1, set to 1 on kick beat, decays
  snareIntensity: number;    // 0-1, set to 1 on snare beat, decays
  hatIntensity: number;      // 0-1, set to 1 on hat beat, decays
  beatPhase: number;         // 0-1 continuous between beats
  visualIntensity: number;   // 0-1 based on difficulty layers
  bpm: number;               // current BPM (from bpmSections)
}
```

The renderer reads this exactly as it does today. Zero changes to `renderer.ts`.

## Integration Changes

| File | Change |
|------|--------|
| `src/music.ts` | Replace `MusicEngine` class with `SongPlayer` class |
| `src/types.ts` | Add `SongData` and related interfaces (shared with tool) |
| `src/game.ts` | `startGame()` loads song JSON, passes to `SongPlayer.start()` |
| `src/renderer.ts` | No changes |
| `src/audio.ts` | Keep for SFX only |
| `songs/` | New directory for bundled MP3 + JSON pairs |
| `tools/analyze-song/` | New dev-only CLI project |

## What Gets Removed

- All procedural synth code (oscillators, noise buffers, filters, delay bus)
- The lookahead scheduler (`setInterval` + `pendingEvents` queue)
- BPM queueing / bar-boundary logic
- Bass/arp pattern arrays

## Testing

- **CLI tool**: Unit tests for each analysis stage (decode, beats, energy, events, format). Integration test: analyze a known test MP3, assert output matches expected structure.
- **SongPlayer**: Unit tests for index advancement, beat phase calculation, intensity decay. Mock `audio.currentTime` to simulate playback.
- **Existing renderer tests**: Should pass unchanged since `BeatState` interface is the same.
