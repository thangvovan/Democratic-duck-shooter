import { W, H, GROUND_Y } from '../utils/draw.js';
import { clamp } from '../utils/math.js';

// The shooter: a cartoon "freedom blaster" at the bottom of the screen that follows the cursor.
export class Player {
  constructor() {
    this.pivotX = W / 2;
    this.pivotY = H + 34;
    this.angle = -Math.PI / 2;
    this.recoil = 0;
    this.hurtTimer = 0;
    this.visible = true;
  }

  get position() {
    return { x: W / 2, y: GROUND_Y + 50 };
  }

  get muzzle() {
    const len = 158 - this.recoil * 16;
    return { x: this.pivotX + Math.cos(this.angle) * len, y: this.pivotY + Math.sin(this.angle) * len };
  }

  aimAt(x, y) {
    this.angle = clamp(Math.atan2(y - this.pivotY, x - this.pivotX), -Math.PI + 0.35, -0.35);
  }

  fire() {
    this.recoil = 1;
  }

  hurt() {
    this.hurtTimer = 0.45;
  }

  update(dt) {
    this.recoil = Math.max(0, this.recoil - dt * 7);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
  }

  render(ctx) {
    if (!this.visible) return;
    const flashing = this.hurtTimer > 0 && Math.floor(this.hurtTimer * 20) % 2 === 0;
    ctx.save();
    ctx.translate(this.pivotX, this.pivotY + this.recoil * 6);
    ctx.rotate(this.angle + Math.PI / 2);
    ctx.translate(0, this.recoil * 14);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a1030';
    ctx.lineWidth = 4;

    // Barrel
    ctx.fillStyle = '#5b5f73';
    ctx.fillRect(-11, -150, 22, 90);
    ctx.strokeRect(-11, -150, 22, 90);
    ctx.fillStyle = '#ff9f1c';
    ctx.fillRect(-13, -160, 26, 14);
    ctx.strokeRect(-13, -160, 26, 14);

    // Body
    ctx.fillStyle = flashing ? '#ffffff' : '#e63946';
    ctx.beginPath();
    ctx.roundRect(-28, -80, 56, 110, 10);
    ctx.fill();
    ctx.stroke();

    // Star decal
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 13 : 5.5;
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * r, -40 + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();

    // Sight
    ctx.fillStyle = '#1a1030';
    ctx.fillRect(-4, -92, 8, 12);

    // Duck-yellow glove
    ctx.fillStyle = flashing ? '#ff6b6b' : '#ffd93b';
    ctx.beginPath();
    ctx.ellipse(0, 8, 34, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
