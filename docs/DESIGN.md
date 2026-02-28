# DEFLECT - Game Design Document

## One-Line Pitch
Swipe to draw deflectors that bounce colored signals into matching ports before they hit your core.

## Core Mechanic (5-second learn)
1. Colored orbs flow toward the center of your screen
2. Swipe to draw a temporary wall
3. Orbs bounce off your walls
4. Guide them into matching-colored zones around the edge
5. Don't let them hit the core

## Why It's Addictive
- **Near-miss tension**: Every orb that barely misses your deflector drives "one more try"
- **Escalating flow state**: Starts with 1 color, slow. Ramps every 15 seconds.
- **Satisfying physics**: Bouncing orbs with particle trails feels great
- **Combo chains**: Perfect redirects build multipliers with escalating visual feedback
- **Sub-second retry**: Death → tap → playing in under 0.5 seconds

## Game Rules
- **Arena**: Circular play area, core (health) in center
- **Ports**: 2-6 colored zones around the perimeter (like pie slices)
- **Signals**: Colored orbs spawn from edges, drift toward core
- **Deflectors**: Swipe to draw temporary walls (last 3 seconds, max 3 active)
- **Scoring**: Signal → matching port = points × combo multiplier
- **Damage**: Signal → core = lose 1 HP (start with 5 HP)
- **Wrong port**: Signal → wrong color port = no score, no damage
- **Game over**: Core HP reaches 0

## Difficulty Ramp (60-90 second rounds)
- 0-15s: 1 color (red), slow speed, 1 port
- 15-30s: 2 colors (red + blue), medium speed, 2 ports
- 30-45s: 3 colors, faster, 3 ports
- 45-60s: 4 colors, fast, signals from all directions
- 60s+: Speed keeps increasing until you die

## Modes
- **Arcade** (default): Survive as long as you can, chase high scores
- **Zen**: No core HP, no game over, just chase accuracy percentage
- **Daily Challenge**: Seeded pattern, same for everyone, one attempt

## Tech Stack
- Vite + TypeScript (fast builds, tiny bundle)
- HTML5 Canvas (no framework - maximum performance, minimum size)
- Web Audio API (procedural sound effects)
- Local Storage (high scores, streaks)
- PWA (offline play, add to home screen)

## Visual Style
- Dark background with neon/glowing elements
- Signals leave particle trails
- Ports pulse with their color
- Deflectors glow and fade
- Screen shake on core damage
- Particle explosions on successful matches

## Target Metrics
- Load time: < 2 seconds on 3G
- Bundle size: < 200KB
- 60 FPS on mid-range phones
- Zero-friction: URL → playing in < 3 seconds
