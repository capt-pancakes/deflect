# Spectrum Visualizer Design

## Problem
Background flashing feels wrong. Beat sync works but the visual feedback channel (whole-screen flash) doesn't match the game's aesthetic. Need music visualization that integrates with gameplay elements.

## Design

### 1. Web Audio Spectrum Pipeline
Wire `<audio>` through `AudioContext` + `AnalyserNode` in `SongPlayer`.
- `fftSize = 64` -> 32 frequency bins
- Expose `getFrequencyData(): Uint8Array` called once per frame by renderer
- Reuse single `Uint8Array(32)` buffer (zero GC pressure)
- Connect on `start()`, disconnect on `stop()`
- Fallback: empty array if no AudioContext, ports render as current

### 2. Spectrum Bars in Port Segments
Each port segment gets ~10 bars radiating outward from arena ring.
- Each bar maps to a frequency bin (low freqs -> first ports, high -> later)
- Bar height: frequency value mapped to 5-35px
- Bar color: port color, alpha scales with height
- "Hungry" state (matching signal approaching): brightness/height boost
- Smooth interpolation toward target height each frame (no jitter)
- Bars only in port arc zones; gaps between ports stay clear for signals

### 3. Core Bass Thump
Replace subtle corePulse with kick-driven physical scale.
- Kick: radius jumps 30 -> ~42px (proportional to kickIntensity)
- Fast exponential decay back to base (~0.85 per frame)
- HP pips and inner elements scale with core
- No glow bloom change

### 4. Background Cleanup + Particle Bursts
- Tone down per-beat screen flash (very low opacity, kick-only)
- Remove radial gradient background pulse
- Add particle bursts on drops and strong kicks during drops (15-25 particles from arena edge in dominant port color)

## Files to Modify
| File | Changes |
|------|---------|
| `src/song-player.ts` | Add AudioContext + AnalyserNode, expose getFrequencyData() |
| `src/renderer.ts` | Add renderSpectrumBars(), update renderPorts(), update renderCore(), tone down background effects |
| `src/game.ts` | Pass frequency data through RenderableGameState |

## Performance
- FFT runs on browser audio thread (free)
- getByteFrequencyData() is a memcpy (~32 bytes/frame)
- Drawing ~40 fillRect calls is cheaper than existing port glow arcs
- Net performance impact: negligible
