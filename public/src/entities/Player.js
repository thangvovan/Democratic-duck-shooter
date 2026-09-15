import { W, H } from '../utils/draw.js';
import { clamp } from '../utils/math.js';

const OUT = '#1a1030';
const SKIN = '#dca06f';
const SKIN_DARK = '#c08457';
const SHIRT = '#2f3542';

// Everything is drawn in "design units" with the origin at the bottom-center of the screen,
// then scaled down so the whole shooter is about as tall as the old gun (~130px).
const S = 0.62;
const BODY_PIVOT_Y = 40; // the body turns around a point just below the screen edge
const HANDS_Y = -150; // pistol held straight up above the head, along the body axis
const MUZZLE_LENGTH = 64;
const MAX_TURN = 1.1; // radians left/right from straight up

// The shooter: a small bald guy seen from behind. He turns his whole body to aim;
// the pistol stays fixed in his hands, so it turns with him.
export class Player {
  constructor() {
    this.angle = -Math.PI / 2;
    this.recoil = 0;
    this.hurtTimer = 0;
    this.visible = true;
  }

  // Design coordinates -> world coordinates, including body rotation and recoil.
  toWorld(dx, dy) {
    const rot = this.angle + Math.PI / 2;
    const vy = dy - BODY_PIVOT_Y + this.recoil * 8;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    return {
      x: W / 2 + (dx * cos - vy * sin) * S,
      y: H + (dx * sin + vy * cos + BODY_PIVOT_Y) * S,
    };
  }

  // Where enemy bullets aim (the back of his head).
  get position() {
    return this.toWorld(0, -104);
  }

  get muzzle() {
    return this.toWorld(0, HANDS_Y - MUZZLE_LENGTH);
  }

  aimAt(x, y) {
    const angle = Math.atan2(y - (H + BODY_PIVOT_Y * S), x - W / 2);
    this.angle = clamp(angle, -Math.PI / 2 - MAX_TURN, -Math.PI / 2 + MAX_TURN);
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
    const skin = flashing ? '#ff6b6b' : SKIN;

    ctx.save();
    ctx.translate(W / 2, H);
    ctx.scale(S, S);
    ctx.translate(0, BODY_PIVOT_Y);
    ctx.rotate(this.angle + Math.PI / 2);
    ctx.translate(0, -BODY_PIVOT_Y + this.recoil * 8);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Arms reaching up to the pistol
    for (const side of [-1, 1]) {
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.moveTo(side * 88, -36);
      ctx.lineTo(side * 8, HANDS_Y + 10);
      ctx.stroke();
      ctx.strokeStyle = SHIRT;
      ctx.lineWidth = 23;
      ctx.stroke();
    }

    // Pistol, pointing straight up along the body axis
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 3;
    ctx.fillStyle = '#2b2e36';
    ctx.beginPath();
    ctx.roundRect(-9, HANDS_Y - 6, 18, 30, 4); // grip
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5b6070';
    ctx.beginPath();
    ctx.roundRect(-8, HANDS_Y - MUZZLE_LENGTH, 16, 58, 3); // slide
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1a1c22';
    ctx.fillRect(-4, HANDS_Y - MUZZLE_LENGTH - 2, 8, 6); // muzzle
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-5, HANDS_Y - 56, 3, 44);

    // Hands on the grip
    ctx.fillStyle = skin;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 9, HANDS_Y + 6, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Torso (back), long enough that turning never shows a gap at the screen edge
    ctx.fillStyle = SHIRT;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-125, 110);
    ctx.lineTo(-125, 10);
    ctx.quadraticCurveTo(-118, -46, -52, -54);
    ctx.lineTo(52, -54);
    ctx.quadraticCurveTo(118, -46, 125, 10);
    ctx.lineTo(125, 110);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Neck
    ctx.fillStyle = flashing ? '#ff6b6b' : SKIN_DARK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-21, -84, 42, 36, 8);
    ctx.fill();
    ctx.stroke();

    // Ears
    ctx.fillStyle = skin;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 34, -100, 8, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Bald head (back view)
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -104, 34, 39, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(-11, -127, 12, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
