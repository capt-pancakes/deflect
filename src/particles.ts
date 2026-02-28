import type { Particle, Vec2 } from './types';
import { fromAngle } from './math';

const MAX_PARTICLES = 500;

export class ParticleSystem {
  particles: Particle[] = [];

  burst(pos: Vec2, color: string, count: number, speed: number = 200, life: number = 0.5) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.7);
      const vel = fromAngle(angle, spd);
      this.particles.push({
        pos: { x: pos.x, y: pos.y },
        vel,
        color,
        life,
        maxLife: life,
        radius: 2 + Math.random() * 3,
      });
    }
  }

  trail(pos: Vec2, color: string, count: number = 1) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 30;
      this.particles.push({
        pos: { x: pos.x, y: pos.y },
        vel: fromAngle(angle, spd),
        color,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        radius: 1 + Math.random() * 2,
      });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.vel.x *= 0.96;
      p.vel.y *= 0.96;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles.length = 0;
  }
}
