import { Duck } from './Duck.js';
import { drawText } from '../utils/draw.js';

// A duck that can shoot at the player. The bullet is loaded (ammo spent) when the warning starts;
// the duck stands still from the warning until its last shot. Killing it mid-warning wastes that ammo.
export class ArmedDuck extends Duck {
  constructor(o = {}) {
    super(o);
    this.aimTime = 0;
    this.aimDuration = 0;
    this.shotsLeft = 0;
    this.shotTimer = 0;
    this.onShot = null;
    this.target = null;
    this.hold = false; // frozen in place (e.g. during a volley)
  }

  // True while warning or firing.
  get aiming() {
    return this.aimTime > 0 || this.shotsLeft > 0;
  }

  startAim(duration, target, shots, onShot) {
    this.aimTime = duration;
    this.aimDuration = duration;
    this.target = target;
    this.shotsLeft = shots;
    this.shotTimer = 0;
    this.onShot = onShot;
  }

  cancelAim() {
    this.aimTime = 0;
    this.shotsLeft = 0;
    this.onShot = null;
  }

  update(dt) {
    if (this.aiming) {
      if (!this.alive) {
        this.cancelAim();
      } else if (this.aimTime > 0) {
        this.aimTime -= dt;
        if (this.aimTime <= 0) this.aimTime = 0;
      }
      if (this.alive && this.aimTime === 0 && this.shotsLeft > 0) {
        this.shotTimer -= dt;
        if (this.shotTimer <= 0) {
          this.shotsLeft--;
          this.shotTimer = 0.14;
          const shoot = this.onShot;
          if (this.shotsLeft === 0) this.onShot = null;
          shoot?.(this);
        }
      }
    }
    this.speedScale = this.alive && (this.aiming || this.hold) ? 0 : 1;
    super.update(dt);
  }

  kill() {
    this.cancelAim();
    super.kill();
  }

  render(ctx) {
    const warning = this.alive && this.aimTime > 0;
    if (warning && this.target) {
      const progress = 1 - this.aimTime / this.aimDuration;
      ctx.save();
      ctx.globalAlpha = 0.25 + progress * 0.5;
      ctx.strokeStyle = '#ff3b3b';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();
      ctx.restore();
    }
    super.render(ctx);
    if (warning && Math.floor(this.aimTime * 12) % 2 === 0) {
      const label = this.shotsLeft > 1 ? `!x${this.shotsLeft}` : '!';
      drawText(ctx, label, this.x, this.y - this.size * 0.9, { size: 20, color: '#ff3b3b' });
    }
  }
}
