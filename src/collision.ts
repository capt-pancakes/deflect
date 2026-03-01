import type { Signal, Deflector, Port, Vec2 } from './types';
import {
  vec2,
  sub,
  scale,
  scaleMut,
  addMut,
  normalize,
  reflect,
  dist,
  length,
  pointToSegmentDist,
  segmentNormal,
} from './math';

/** Tunable constants for collision detection */
export interface CollisionConfig {
  aimAssistStrength: number;
  collisionBuffer: number;
  nearMissThreshold: number;
  bounceLifeCost: number;
  coreRadius: number;
}

export const DEFAULT_COLLISION_CONFIG: CollisionConfig = {
  aimAssistStrength: 0.2,
  collisionBuffer: 8,
  nearMissThreshold: 50,
  bounceLifeCost: 0.4,
  coreRadius: 30,
};

/** Result types for collision events */
export interface DeflectorHit {
  type: 'deflector';
  signal: Signal;
  deflector: Deflector;
}

export interface CoreHit {
  type: 'core';
  signal: Signal;
}

export interface NearMiss {
  type: 'nearMiss';
  signal: Signal;
}

export interface PortCatch {
  type: 'portCatch';
  signal: Signal;
  port: Port;
}

export interface WrongPort {
  type: 'wrongPort';
  signal: Signal;
  port: Port;
}

export interface Escape {
  type: 'escape';
  signal: Signal;
}

export type CollisionEvent =
  | DeflectorHit
  | CoreHit
  | NearMiss
  | PortCatch
  | WrongPort
  | Escape;

export class CollisionSystem {
  config: CollisionConfig;

  constructor(config: Partial<CollisionConfig> = {}) {
    this.config = { ...DEFAULT_COLLISION_CONFIG, ...config };
  }

  /**
   * Check if an angle falls within a port's angular range.
   * Normalizes the angle difference to handle wraparound.
   */
  isAngleInPort(angle: number, port: Port): boolean {
    const span = port.angleEnd - port.angleStart;
    let rel = (angle - port.angleStart) % (Math.PI * 2);
    if (rel < 0) rel += Math.PI * 2;
    return rel <= span;
  }

  /**
   * Apply aim assist blending to a reflected velocity.
   * Biases the bounce direction toward the matching port.
   * Falls back to raw reflection if the blended vector is near-zero.
   */
  aimAssistBlend(
    reflectedVel: Vec2,
    signalPos: Vec2,
    signalVel: Vec2,
    effectiveNormal: Vec2,
    matchingPort: Port,
    center: Vec2,
    arenaRadius: number,
  ): Vec2 {
    const portMid = (matchingPort.angleStart + matchingPort.angleEnd) / 2;
    const portPos = vec2(
      center.x + Math.cos(portMid) * arenaRadius,
      center.y + Math.sin(portMid) * arenaRadius,
    );
    const toPort = normalize(sub(portPos, signalPos));
    const spd = length(reflectedVel);

    const blended = vec2(
      reflectedVel.x + toPort.x * this.config.aimAssistStrength * spd,
      reflectedVel.y + toPort.y * this.config.aimAssistStrength * spd,
    );
    if (length(blended) > 0.001) {
      return scale(normalize(blended), spd);
    } else {
      return reflect(signalVel, effectiveNormal);
    }
  }

  /**
   * Check a single signal against a deflector for collision.
   * If hit, mutates the signal's velocity, position, and deflected flag.
   * Also decays the deflector's life and resets its opacity.
   * Returns true if a collision occurred.
   */
  checkDeflectorCollision(
    signal: Signal,
    deflector: Deflector,
    ports: Port[],
    center: Vec2,
    arenaRadius: number,
  ): boolean {
    const d = pointToSegmentDist(signal.pos, deflector.start, deflector.end);
    if (d >= signal.radius + this.config.collisionBuffer) return false;

    const normal = segmentNormal(deflector.start, deflector.end);
    const dotProduct = signal.vel.x * normal.x + signal.vel.y * normal.y;
    const effectiveNormal = dotProduct < 0 ? normal : { x: -normal.x, y: -normal.y };

    // Base reflection
    let newVel = reflect(signal.vel, effectiveNormal);

    // AIM ASSIST: Bias bounce toward matching port
    const matchingPort = ports.find((p) => p.color === signal.color);
    if (matchingPort) {
      newVel = this.aimAssistBlend(
        newVel,
        signal.pos,
        signal.vel,
        effectiveNormal,
        matchingPort,
        center,
        arenaRadius,
      );
    }

    signal.vel = newVel;
    // Mutable: push signal position along normal in place (avoids 2 temp allocations)
    const pushOffset = { x: effectiveNormal.x, y: effectiveNormal.y };
    scaleMut(pushOffset, signal.radius + this.config.collisionBuffer + 2);
    addMut(signal.pos, pushOffset);
    signal.deflected = true;

    // Deflector decays on impact
    deflector.life -= deflector.life * this.config.bounceLifeCost;
    deflector.opacity = 1; // Flash briefly

    return true;
  }

  /**
   * Run all collision checks for one frame.
   * Returns an array of collision events. Game handles side effects.
   */
  checkCollisions(
    signals: Signal[],
    deflectors: Deflector[],
    ports: Port[],
    center: Vec2,
    arenaRadius: number,
  ): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    for (const signal of signals) {
      if (!signal.alive) continue;

      // --- Deflector collision ---
      for (const deflector of deflectors) {
        if (this.checkDeflectorCollision(signal, deflector, ports, center, arenaRadius)) {
          events.push({ type: 'deflector', signal, deflector });
          break;
        }
      }

      // --- Core collision ---
      const coreD = dist(signal.pos, center);

      // Near-miss detection (close to core but not hitting)
      if (
        coreD < this.config.coreRadius + this.config.nearMissThreshold &&
        coreD > this.config.coreRadius + signal.radius
      ) {
        if (signal.age > 0.5 && !signal.nearMissTriggered) {
          signal.nearMissTriggered = true;
          events.push({ type: 'nearMiss', signal });
        }
      }

      if (coreD < this.config.coreRadius + signal.radius) {
        signal.alive = false;
        events.push({ type: 'core', signal });
        continue;
      }

      // --- Port collision (only after deflection) ---
      const distFromCenter = dist(signal.pos, center);
      if (signal.deflected && distFromCenter >= arenaRadius - signal.radius - 5) {
        const angle = Math.atan2(signal.pos.y - center.y, signal.pos.x - center.x);

        let caught = false;
        for (const port of ports) {
          if (this.isAngleInPort(angle, port)) {
            signal.alive = false;
            if (port.color === signal.color) {
              events.push({ type: 'portCatch', signal, port });
            } else {
              events.push({ type: 'wrongPort', signal, port });
            }
            caught = true;
            break;
          }
        }

        if (!caught && distFromCenter >= arenaRadius + signal.radius) {
          signal.alive = false;
          events.push({ type: 'escape', signal });
        }
      }
    }

    return events;
  }
}
