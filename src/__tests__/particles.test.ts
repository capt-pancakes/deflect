import { describe, it, expect } from 'vitest';
import { ParticleSystem } from '../particles';

describe('ParticleSystem', () => {
  describe('burst', () => {
    it('creates the correct number of particles', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 100, y: 100 }, '#ff0000', 10);
      expect(ps.particles.length).toBe(10);
    });

    it('sets particle position to burst origin', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 50, y: 75 }, '#ff0000', 5);
      for (const p of ps.particles) {
        expect(p.pos.x).toBe(50);
        expect(p.pos.y).toBe(75);
      }
    });

    it('assigns the given color to all particles', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#00ff00', 3);
      for (const p of ps.particles) {
        expect(p.color).toBe('#00ff00');
      }
    });

    it('gives particles non-zero velocity', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 10, 200);
      for (const p of ps.particles) {
        const speed = Math.sqrt(p.vel.x * p.vel.x + p.vel.y * p.vel.y);
        expect(speed).toBeGreaterThan(0);
      }
    });

    it('respects max particle cap of 500', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 600);
      expect(ps.particles.length).toBe(500);
    });

    it('caps across multiple bursts', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 300);
      ps.burst({ x: 0, y: 0 }, '#00ff00', 300);
      expect(ps.particles.length).toBe(500);
    });

    it('uses custom life parameter', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 5, 200, 2.0);
      for (const p of ps.particles) {
        expect(p.life).toBe(2.0);
        expect(p.maxLife).toBe(2.0);
      }
    });
  });

  describe('trail', () => {
    it('creates particles', () => {
      const ps = new ParticleSystem();
      ps.trail({ x: 50, y: 50 }, '#0000ff');
      expect(ps.particles.length).toBeGreaterThan(0);
    });

    it('creates the specified count of particles', () => {
      const ps = new ParticleSystem();
      ps.trail({ x: 50, y: 50 }, '#0000ff', 5);
      expect(ps.particles.length).toBe(5);
    });

    it('defaults to 1 particle', () => {
      const ps = new ParticleSystem();
      ps.trail({ x: 50, y: 50 }, '#0000ff');
      expect(ps.particles.length).toBe(1);
    });

    it('respects max particle cap', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 500);
      ps.trail({ x: 50, y: 50 }, '#0000ff', 10);
      expect(ps.particles.length).toBe(500);
    });
  });

  describe('update', () => {
    it('applies velocity to position', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 1, 100, 5.0);
      const p = ps.particles[0];
      const velX = p.vel.x;
      const velY = p.vel.y;
      const dt = 0.016;
      ps.update(dt);
      expect(p.pos.x).toBeCloseTo(velX * dt, 5);
      expect(p.pos.y).toBeCloseTo(velY * dt, 5);
    });

    it('applies damping to velocity', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 1, 100, 5.0);
      const p = ps.particles[0];
      const velXBefore = p.vel.x;
      const velYBefore = p.vel.y;
      ps.update(0.016);
      // Velocity should be multiplied by 0.96
      expect(p.vel.x).toBeCloseTo(velXBefore * 0.96, 5);
      expect(p.vel.y).toBeCloseTo(velYBefore * 0.96, 5);
    });

    it('decreases life by dt', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 1, 100, 1.0);
      const p = ps.particles[0];
      ps.update(0.1);
      expect(p.life).toBeCloseTo(0.9, 5);
    });

    it('removes particles when life reaches 0', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 5, 100, 0.1);
      expect(ps.particles.length).toBe(5);
      // Update with dt larger than life
      ps.update(0.2);
      expect(ps.particles.length).toBe(0);
    });

    it('keeps alive particles with remaining life', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 3, 100, 1.0);
      ps.update(0.5);
      expect(ps.particles.length).toBe(3);
    });
  });

  describe('clear', () => {
    it('removes all particles', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 50);
      expect(ps.particles.length).toBe(50);
      ps.clear();
      expect(ps.particles.length).toBe(0);
    });

    it('works on empty system', () => {
      const ps = new ParticleSystem();
      ps.clear();
      expect(ps.particles.length).toBe(0);
    });
  });

  describe('render', () => {
    it('does not throw with mock context', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 3, 100, 1.0);

      const ctx = {
        globalAlpha: 1,
        fillStyle: '',
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
      } as unknown as CanvasRenderingContext2D;

      expect(() => ps.render(ctx)).not.toThrow();
    });

    it('restores globalAlpha to 1 after rendering', () => {
      const ps = new ParticleSystem();
      ps.burst({ x: 0, y: 0 }, '#ff0000', 2, 100, 1.0);

      const ctx = {
        globalAlpha: 1,
        fillStyle: '',
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
      } as unknown as CanvasRenderingContext2D;

      ps.render(ctx);
      expect(ctx.globalAlpha).toBe(1);
    });
  });
});
