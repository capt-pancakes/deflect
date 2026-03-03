# 037 — Mode-Specific Music & Audio

**Priority:** T2 — Depth
**Refs:** product-vision.md §Part 7

---

## Description

Extend the existing procedural audio and layered music system with mode-specific tracks and new sound effects for power-ups, orb types, achievements, and milestones. The current system is strong — this ticket adds variety and mode identity.

### Mode-Specific Music

| Mode | Music Direction |
|------|----------------|
| Arcade | Current energetic electronic track (keep as-is) |
| Zen | New ambient track — slower BPM (70-80), pads instead of drums, evolves gently |
| Daily Challenge | Variation on Arcade theme matching daily modifier (e.g., "Speed Demon" = faster BPM) |
| Boss Rush | Aggressive, driving beat with heavier kick and distorted bass |
| Menu | Ambient background that smoothly transitions into gameplay music on mode select |

### New Sound Effects

| Event | Sound |
|-------|-------|
| Power-up collect | Satisfying "ding" with pitch variation by type |
| Power-up activate | Whoosh/shimmer communicating the effect |
| Bomb orb warning | Low rumbling on spawn |
| Gold orb | High-pitched shimmer trail |
| Achievement unlock | Triumphant 3-note chime |
| Level up | Ascending arpeggio |
| Streak milestone | Dramatic stinger |
| New high score (mid-game) | Brief musical flourish layered on current track |

---

## Acceptance Criteria

- [ ] Zen mode has a distinct ambient music track (slower BPM, atmospheric)
- [ ] Boss Rush has an aggressive music track distinct from Arcade
- [ ] Menu has ambient music that transitions smoothly into gameplay music
- [ ] Daily Challenge music adapts to the daily modifier
- [ ] All new sound effects are implemented and play at the correct events
- [ ] Sound effects respect the SFX toggle and volume settings
- [ ] Music tracks respect the Music toggle and volume settings
- [ ] Smooth crossfade between menu music and gameplay music (no hard cut)
- [ ] Audio system does not cause frame drops during transitions
- [ ] "Power down" audio cue when any power-up expires
- [ ] All music tracks are lazy-loaded (not bundled) — each MP3 is 2-5MB

---

**Tech note (Morgan TL):** Each music track (MP3) is 2-5MB. Four tracks = 8-20MB. Music MUST be lazy-loaded when a mode is selected, not bundled. The current `SongPlayer.start()` loads `Audio` elements by URL — maintain this pattern. Song JSON beat data files (currently `import neonOverdrive from '../songs/Neon-Overdrive.json'`) should also be lazy-loaded. For "Daily Challenge music adapts to modifier," use Web Audio API parameter changes (low-pass filter, pitch shift) rather than separate tracks per modifier.

## Dependencies

- 004 (Settings) — volume and toggle settings
