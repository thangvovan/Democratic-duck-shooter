import { Duck } from './Duck.js';
import { PALETTES } from './duckArt.js';
import { drawText } from '../utils/draw.js';

// Stage 2 enemy: a duck cop that telegraphs ("!") before firing at the player.
export class PoliceDuck extends Duck {
  constructor(o = {}) {
    super({ ...o, type: 'policeDuck', accessory: 'police', palette: PALETTES.police, lifetime: Infinity });
    this.aimTime = 0;
    this.aimDuration = 0;
    this.onFire = null;
    this.target = null;
  }

  get aiming() {
    return this.aimTime > 0;
  }

  startAim(duration, target, onFire) {
    this.aimTime = duration;
    this.aimDuration = duration;
    this.target = target;
    this.onFire = onFire;
  }

  cancelAim() {
    this.aimTime = 0;
    this.onFire = null;
    this.speedScale = 1;
  }

  update(dt) {
    if (this.aiming) {
      if (!this.alive) {
        this.cancelAim();
      } else {
        this.speedScale = 0.2;
        this.aimTime -= dt;
        if (this.aimTime <= 0) {
          const fire = this.onFire;
          this.cancelAim();
          fire?.(this);
        }
      }
    }
    super.update(dt);
  }

  render(ctx) {
    if (this.aiming && this.target) {
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
    if (this.aiming && Math.floor(this.aimTime * 10) % 2 === 0) {
      drawText(ctx, '!', this.x, this.y - this.size * 0.9, { size: 22, color: '#ff3b3b' });
    }
  }
}
