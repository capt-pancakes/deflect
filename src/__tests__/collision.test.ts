import { describe, it, expect } from 'vitest';
import { CollisionSystem } from '../collision';
import type { Signal, Deflector, Port } from '../types';
import { vec2, length } from '../math';

function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: 1,
    pos: vec2(0, 0),
    vel: vec2(0, 100),
    color: 'red',
    radius: 8,
    trail: [],
    alive: true,
    age: 1,
    enteredArena: true,
    deflected: false,
    ...overrides,
  };
}

function makeDeflector(overrides: Partial<Deflector> = {}): Deflector {
  return {
    id: 1,
    start: vec2(-50, 50),
    end: vec2(50, 50),
    life: 3,
    maxLife: 3,
    opacity: 1,
    ...overrides,
  };
}

function makePort(overrides: Partial<Port> = {}): Port {
  return {
    angleStart: -Math.PI / 4,
    angleEnd: Math.PI / 4,
    color: 'red',
    pulsePhase: 0,
    catchCount: 0,
    ...overrides,
  };
}

describe('CollisionSystem', () => {
  describe('isAngleInPort', () => {
    const cs = new CollisionSystem();

    it('returns true for angle inside port range', () => {
      const port = makePort({ angleStart: -Math.PI / 4, angleEnd: Math.PI / 4 });
      expect(cs.isAngleInPort(0, port)).toBe(true);
    });

    it('returns true for angle at port start boundary', () => {
      const port = makePort({ angleStart: 0, angleEnd: Math.PI / 2 });
      expect(cs.isAngleInPort(0, port)).toBe(true);
    });

    it('returns false for angle outside port range', () => {
      const port = makePort({ angleStart: 0, angleEnd: Math.PI / 4 });
      expect(cs.isAngleInPort(Math.PI, port)).toBe(false);
    });

    it('handles wraparound angles (negative angles)', () => {
      // Port spans from 3PI/4 to 5PI/4 (wrapping around PI)
      const port = makePort({ angleStart: (3 * Math.PI) / 4, angleEnd: (5 * Math.PI) / 4 });
      expect(cs.isAngleInPort(Math.PI, port)).toBe(true);
    });

    it('returns false for angle just outside port', () => {
      const port = makePort({ angleStart: 0, angleEnd: 0.5 });
      expect(cs.isAngleInPort(0.6, port)).toBe(false);
    });
  });

  describe('deflector-signal collision detection', () => {
    it('detects collision when signal is close to deflector segment', () => {
      const cs = new CollisionSystem({ collisionBuffer: 8 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      // Signal moving downward, deflector is a horizontal line below it
      const signal = makeSignal({ pos: vec2(200, 52), vel: vec2(0, 100) });
      const deflector = makeDeflector({ start: vec2(150, 60), end: vec2(250, 60) });
      const port = makePort({ color: 'red' });

      const events = cs.checkCollisions([signal], [deflector], [port], center, arenaRadius);

      const deflectorEvents = events.filter((e) => e.type === 'deflector');
      expect(deflectorEvents.length).toBe(1);
      expect(signal.deflected).toBe(true);
    });

    it('does not detect collision when signal is far from deflector', () => {
      const cs = new CollisionSystem({ collisionBuffer: 8 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const signal = makeSignal({ pos: vec2(200, 0), vel: vec2(0, 100) });
      const deflector = makeDeflector({ start: vec2(150, 100), end: vec2(250, 100) });

      const events = cs.checkCollisions([signal], [deflector], [], center, arenaRadius);

      const deflectorEvents = events.filter((e) => e.type === 'deflector');
      expect(deflectorEvents.length).toBe(0);
      expect(signal.deflected).toBe(false);
    });

    it('decays deflector life on impact', () => {
      const cs = new CollisionSystem({ collisionBuffer: 8, bounceLifeCost: 0.4 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const signal = makeSignal({ pos: vec2(200, 52), vel: vec2(0, 100) });
      const deflector = makeDeflector({ start: vec2(150, 60), end: vec2(250, 60), life: 3 });

      cs.checkCollisions([signal], [deflector], [], center, arenaRadius);

      // Life should decrease by 40% of remaining (3 * 0.4 = 1.2, so 3 - 1.2 = 1.8)
      expect(deflector.life).toBeCloseTo(1.8);
    });
  });

  describe('aim assist blending', () => {
    it('biases bounce toward matching port', () => {
      const cs = new CollisionSystem({ aimAssistStrength: 0.2 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      // Port at top (angle = -PI/2)
      const port = makePort({
        angleStart: -Math.PI / 2 - 0.3,
        angleEnd: -Math.PI / 2 + 0.3,
        color: 'red',
      });
      const reflectedVel = vec2(100, 0); // Bouncing to the right
      const signalPos = vec2(200, 200);
      const signalVel = vec2(0, 100);
      const normal = vec2(0, -1);

      const result = cs.aimAssistBlend(
        reflectedVel,
        signalPos,
        signalVel,
        normal,
        port,
        center,
        arenaRadius,
      );

      // Result should still have the same speed
      expect(length(result)).toBeCloseTo(100, 0);
      // Result should be biased upward (toward port at top)
      expect(result.y).toBeLessThan(0);
    });

    it('falls back to reflect when blended vector is near-zero', () => {
      const cs = new CollisionSystem({ aimAssistStrength: 1.0 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      // Set up port directly behind the signal so toPort cancels reflectedVel
      const signalPos = vec2(200, 50); // signal above center
      // Port at angle PI (left side), toPort will point left
      const port = makePort({
        angleStart: Math.PI - 0.1,
        angleEnd: Math.PI + 0.1,
        color: 'red',
      });

      const reflectedVel = vec2(100, 0); // going right
      const signalVel = vec2(100, 0);
      const normal = vec2(-1, 0);

      const result = cs.aimAssistBlend(
        reflectedVel,
        signalPos,
        signalVel,
        normal,
        port,
        center,
        arenaRadius,
      );

      // Should NOT be zero — should fall back or produce valid result
      expect(length(result)).toBeGreaterThan(0);
      expect(Number.isNaN(result.x)).toBe(false);
      expect(Number.isNaN(result.y)).toBe(false);
    });

    it('preserves speed after blending', () => {
      const cs = new CollisionSystem({ aimAssistStrength: 0.3 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const port = makePort({
        angleStart: 0,
        angleEnd: Math.PI / 2,
        color: 'red',
      });

      const reflectedVel = vec2(150, 0);
      const signalPos = vec2(200, 200);
      const signalVel = vec2(0, 150);
      const normal = vec2(0, -1);

      const result = cs.aimAssistBlend(
        reflectedVel,
        signalPos,
        signalVel,
        normal,
        port,
        center,
        arenaRadius,
      );

      expect(length(result)).toBeCloseTo(150, 0);
    });
  });

  describe('core collision', () => {
    it('detects signal hitting core', () => {
      const cs = new CollisionSystem({ coreRadius: 30 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      // Signal is inside core radius
      const signal = makeSignal({ pos: vec2(200, 205), vel: vec2(0, -100), radius: 8 });

      const events = cs.checkCollisions([signal], [], [], center, arenaRadius);

      const coreEvents = events.filter((e) => e.type === 'core');
      expect(coreEvents.length).toBe(1);
      expect(signal.alive).toBe(false);
    });

    it('does not trigger core hit when signal is outside core radius', () => {
      const cs = new CollisionSystem({ coreRadius: 30 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      // Signal is well outside core
      const signal = makeSignal({ pos: vec2(200, 100), vel: vec2(0, 100) });

      const events = cs.checkCollisions([signal], [], [], center, arenaRadius);

      const coreEvents = events.filter((e) => e.type === 'core');
      expect(coreEvents.length).toBe(0);
      expect(signal.alive).toBe(true);
    });
  });

  describe('near-miss detection', () => {
    it('triggers near miss when close to core but not hitting', () => {
      const cs = new CollisionSystem({ coreRadius: 30, nearMissThreshold: 50 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      // Signal is within threshold but outside core+radius
      // core=30, signal.radius=8, so > 38 from center but < 80
      const signal = makeSignal({
        pos: vec2(200, 150), // 50 units from center
        vel: vec2(100, 0),
        age: 1.0,
      });

      const events = cs.checkCollisions([signal], [], [], center, arenaRadius);

      const nearMissEvents = events.filter((e) => e.type === 'nearMiss');
      expect(nearMissEvents.length).toBe(1);
      expect(signal.nearMissTriggered).toBe(true);
    });

    it('does not trigger near miss for young signals', () => {
      const cs = new CollisionSystem({ coreRadius: 30, nearMissThreshold: 50 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const signal = makeSignal({
        pos: vec2(200, 150),
        vel: vec2(100, 0),
        age: 0.2, // Too young
      });

      const events = cs.checkCollisions([signal], [], [], center, arenaRadius);

      const nearMissEvents = events.filter((e) => e.type === 'nearMiss');
      expect(nearMissEvents.length).toBe(0);
    });

    it('does not trigger near miss twice for same signal', () => {
      const cs = new CollisionSystem({ coreRadius: 30, nearMissThreshold: 50 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const signal = makeSignal({
        pos: vec2(200, 150),
        vel: vec2(100, 0),
        age: 1.0,
        nearMissTriggered: true, // Already triggered
      });

      const events = cs.checkCollisions([signal], [], [], center, arenaRadius);

      const nearMissEvents = events.filter((e) => e.type === 'nearMiss');
      expect(nearMissEvents.length).toBe(0);
    });
  });

  describe('port collision', () => {
    it('detects correct port catch for deflected signal at arena edge', () => {
      const cs = new CollisionSystem({ coreRadius: 30 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      // Port on the right side (angle ~0)
      const port = makePort({
        angleStart: -0.5,
        angleEnd: 0.5,
        color: 'red',
      });

      // Signal at arena edge heading right, deflected
      const signal = makeSignal({
        pos: vec2(200 + arenaRadius - 5, 200), // Near right edge
        vel: vec2(100, 0),
        deflected: true,
        color: 'red',
      });

      const events = cs.checkCollisions([signal], [], [port], center, arenaRadius);

      const catchEvents = events.filter((e) => e.type === 'portCatch');
      expect(catchEvents.length).toBe(1);
      expect(signal.alive).toBe(false);
    });

    it('detects wrong port catch', () => {
      const cs = new CollisionSystem({ coreRadius: 30 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const port = makePort({
        angleStart: -0.5,
        angleEnd: 0.5,
        color: 'blue', // Wrong color!
      });

      const signal = makeSignal({
        pos: vec2(200 + arenaRadius - 5, 200),
        vel: vec2(100, 0),
        deflected: true,
        color: 'red',
      });

      const events = cs.checkCollisions([signal], [], [port], center, arenaRadius);

      const wrongEvents = events.filter((e) => e.type === 'wrongPort');
      expect(wrongEvents.length).toBe(1);
    });

    it('detects escape when signal passes arena edge without hitting port', () => {
      const cs = new CollisionSystem({ coreRadius: 30 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      // Port at top, signal exits right (no port there)
      const port = makePort({
        angleStart: -Math.PI / 2 - 0.3,
        angleEnd: -Math.PI / 2 + 0.3,
        color: 'red',
      });

      const signal = makeSignal({
        pos: vec2(200 + arenaRadius + 10, 200), // Past arena edge on right
        vel: vec2(100, 0),
        deflected: true,
        color: 'red',
        radius: 8,
      });

      const events = cs.checkCollisions([signal], [], [port], center, arenaRadius);

      const escapeEvents = events.filter((e) => e.type === 'escape');
      expect(escapeEvents.length).toBe(1);
      expect(signal.alive).toBe(false);
    });

    it('does not check ports for non-deflected signals', () => {
      const cs = new CollisionSystem({ coreRadius: 30 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const port = makePort({ angleStart: -0.5, angleEnd: 0.5, color: 'red' });

      const signal = makeSignal({
        pos: vec2(200 + arenaRadius - 5, 200),
        vel: vec2(100, 0),
        deflected: false, // Not deflected yet
        color: 'red',
      });

      const events = cs.checkCollisions([signal], [], [port], center, arenaRadius);

      const portEvents = events.filter(
        (e) => e.type === 'portCatch' || e.type === 'wrongPort' || e.type === 'escape',
      );
      expect(portEvents.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('skips dead signals', () => {
      const cs = new CollisionSystem({ coreRadius: 30 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const signal = makeSignal({ pos: vec2(200, 200), alive: false });
      const deflector = makeDeflector({ start: vec2(195, 195), end: vec2(205, 205) });

      const events = cs.checkCollisions([signal], [deflector], [], center, arenaRadius);
      expect(events.length).toBe(0);
    });

    it('handles empty signals array', () => {
      const cs = new CollisionSystem();
      const events = cs.checkCollisions([], [], [], vec2(0, 0), 150);
      expect(events.length).toBe(0);
    });

    it('handles no deflectors', () => {
      const cs = new CollisionSystem({ coreRadius: 30 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const signal = makeSignal({ pos: vec2(200, 100), vel: vec2(0, 100) });

      const events = cs.checkCollisions([signal], [], [], center, arenaRadius);

      // No deflector events, signal too far from core
      const deflectorEvents = events.filter((e) => e.type === 'deflector');
      expect(deflectorEvents.length).toBe(0);
    });

    it('only collides with first deflector in list (breaks after first hit)', () => {
      const cs = new CollisionSystem({ collisionBuffer: 8 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const signal = makeSignal({ pos: vec2(200, 52), vel: vec2(0, 100) });
      const d1 = makeDeflector({ id: 1, start: vec2(150, 60), end: vec2(250, 60) });
      const d2 = makeDeflector({ id: 2, start: vec2(150, 60), end: vec2(250, 60) });

      const events = cs.checkCollisions([signal], [d1, d2], [], center, arenaRadius);

      const deflectorEvents = events.filter((e) => e.type === 'deflector');
      expect(deflectorEvents.length).toBe(1);
    });
  });

  describe('checkDeflectorCollision', () => {
    it('pushes signal away from deflector after collision', () => {
      const cs = new CollisionSystem({ collisionBuffer: 8 });
      const center = vec2(200, 200);
      const arenaRadius = 150;

      const signal = makeSignal({ pos: vec2(200, 55), vel: vec2(0, 100) });
      const posBefore = { ...signal.pos };
      const deflector = makeDeflector({ start: vec2(150, 60), end: vec2(250, 60) });

      cs.checkDeflectorCollision(signal, deflector, [], center, arenaRadius);

      // Signal should be pushed away from deflector (upward in this case)
      const distAfter = Math.abs(signal.pos.y - 60);
      expect(distAfter).toBeGreaterThan(Math.abs(posBefore.y - 60));
    });
  });
});
