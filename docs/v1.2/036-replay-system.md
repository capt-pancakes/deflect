# 036 — Replay System

**Priority:** T4 — Polish
**Refs:** feature-specs.md §7.4 (US-SOC-04), product-vision.md §Part 6

---

## Description

Record the last 5 seconds of gameplay inputs and offer a replay when a notable moment is detected. Replays play back at 0.5x speed with cinematic letterbox bars. Replay data is ephemeral (not saved between sessions).

### Notable Moment Detection

Replay is offered when any of these occurred:
- Combo reached 10x+ at any point
- Near-miss event followed by a catch within 2 seconds
- Bomb orb deflected with < 1 second to spare
- 3+ catches within 2 seconds

### Replay Playback

- Replays the recorded inputs against the seeded game state
- Rendered at 0.5x speed
- Cinematic black letterbox bars (top and bottom)
- Ends with a freeze frame on the highlight moment
- Player can tap to dismiss at any time

---

## Acceptance Criteria

- [ ] Replay button only appears on game over when a notable moment was detected
- [ ] Replay plays back smoothly at half speed
- [ ] Replay ends with a freeze frame on the highlight moment
- [ ] Player can tap to dismiss replay at any time
- [ ] Replay data is ephemeral (not saved between sessions)
- [ ] Uses input-recording approach (record swipe inputs with timestamps) rather than full state recording
- [ ] Last 5 seconds of inputs are continuously recorded (rolling buffer)
- [ ] Cinematic letterbox bars visible during replay
- [ ] **Stretch goal:** allow exporting replay as short video/GIF via canvas recording APIs

---

**Tech note (Morgan TL):** The game is NOT fully deterministic — `Math.random()` is used for particles and `performance.now()` for deflector cooldown. Recommended approach: record only inputs, replay against seeded game state, accept visual drift in particles (they don't affect gameplay). Recording buffer: 5 seconds at 60fps = ~300 frames = ~4.8KB, negligible memory. `MediaRecorder` + `canvas.captureStream()` for video export works in Chrome/Firefox but NOT Safari — consider out of scope.

## Dependencies

- 007 (Game Over Screen) — replay button location
