import { lerp, dist2 } from '../utils/math.js';

// Stage 2 enemy projectile: a big cartoon pellet flying toward the player.
// It grows as it approaches (fake depth) and can be shot down.
export class EnemyBullet {
  constructor(x, y, target, duration = 1.25) {
    this.sx = x;
    this.sy = y;
    this.tx = target.x;
    this.ty = target.y;
    this.duration = duration;
    this.t = 0;
    this.x = x;
    this.y = y;
    this.scale = 0.6;
    this.destroyed = false;
    this.trail = [];
  }

  get arrived() {
    return this.t >= this.duration;
  }

  get done() {
    return this.destroyed || this.arrived;
  }

  update(dt) {
    this.t += dt;
    const k = Math.min(1, this.t / this.duration);
    this.x = lerp(this.sx, this.tx, k);
    this.y = lerp(this.sy, this.ty, k) - Math.sin(k * Math.PI) * 50;
    this.scale = 0.6 + k * 1.3;
    this.trail.push(this.x, this.y);
    if (this.trail.length > 12) this.trail.splice(0, 2);
  }

  hitTest(px, py, pad = 0) {
    return !this.done && dist2(px, py, this.x, this.y) <= (14 * this.scale + 14 + pad) ** 2;
  }

  render(ctx) {
    ctx.save();
    for (let i = 0; i < this.trail.length; i += 2) {
      ctx.globalAlpha = (i / this.trail.length) * 0.5;
      ctx.fillStyle = '#ffb3b3';
      ctx.beginPath();
      ctx.arc(this.trail[i], this.trail[i + 1], 5 * this.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const r = 10 * this.scale;
    ctx.fillStyle = '#ff3b3b';
    ctx.strokeStyle = '#1a1030';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(this.x - r * 0.35, this.y - r * 0.35, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
