import { drawDuck, PALETTES } from './duckArt.js';
import { W, H, GROUND_Y } from '../utils/draw.js';
import { rand, clamp, angleDelta, dist2 } from '../utils/math.js';

// A flying duck with smooth, random-but-fair wandering inside its bounds.
// States: flying -> (hit -> falling | leaving) -> done
export class Duck {
  constructor(o = {}) {
    this.type = o.type || 'duck';
    this.size = o.size ?? 46;
    this.speed = o.speed ?? 200;
    this.palette = o.palette || PALETTES.student;
    this.accessory = o.accessory || null;
    this.bounds = o.bounds || { left: 50, right: W - 50, top: 90, bottom: GROUND_Y - 60 };
    this.lifetime = o.lifetime ?? rand(6, 9);
    this.turnRate = o.turnRate ?? 3.2;

    this.x = o.x ?? rand(this.bounds.left, this.bounds.right);
    this.y = o.y ?? GROUND_Y + 30;
    this.angle = o.angle ?? -Math.PI / 2 + rand(-0.6, 0.6);
    this.targetAngle = this.angle;
    this.turnTimer = rand(0.6, 1.2);
    this.entering = true;

    this.state = 'flying';
    this.age = 0;
    this.flap = rand(0, Math.PI * 2);
    this.facing = Math.cos(this.angle) >= 0 ? 1 : -1;
    this.rot = 0;
    this.hitTimer = 0;
    this.vy = 0;
    this.speedScale = 1;
    this.escaped = false;
  }

  get alive() {
    return this.state === 'flying';
  }

  get done() {
    return this.state === 'done';
  }

  update(dt) {
    this.age += dt;
    switch (this.state) {
      case 'flying':
        this.flap += dt * 16;
        this.fly(dt);
        if (this.age > this.lifetime) this.leave();
        break;
      case 'leaving': {
        this.flap += dt * 20;
        const speed = this.speed * 1.4;
        this.x += Math.cos(this.angle) * speed * dt;
        this.y += Math.sin(this.angle) * speed * dt;
        if (this.y < -80 || this.x < -80 || this.x > W + 80) {
          this.state = 'done';
          this.escaped = true;
        }
        break;
      }
      case 'hit':
        this.hitTimer -= dt;
        if (this.hitTimer <= 0) {
          this.state = 'falling';
          this.vy = -140;
        }
        break;
      case 'falling':
        this.vy += 1500 * dt;
        this.y += this.vy * dt;
        this.rot += 7 * dt * this.facing;
        if (this.y > H + 80) this.state = 'done';
        break;
    }
  }

  fly(dt) {
    const b = this.bounds;
    if (this.entering) {
      if (this.y < b.bottom && this.y > b.top && this.x > b.left && this.x < b.right) this.entering = false;
    } else {
      this.turnTimer -= dt;
      if (this.turnTimer <= 0) {
        this.turnTimer = rand(0.5, 1.3);
        this.targetAngle = rand(0, Math.PI * 2);
      }
      // Steer back inside the play area.
      if (this.x < b.left && Math.cos(this.targetAngle) < 0.3) this.targetAngle = rand(-0.8, 0.8);
      if (this.x > b.right && Math.cos(this.targetAngle) > -0.3) this.targetAngle = Math.PI + rand(-0.8, 0.8);
      if (this.y < b.top && Math.sin(this.targetAngle) < 0.3) this.targetAngle = rand(0.4, Math.PI - 0.4);
      if (this.y > b.bottom && Math.sin(this.targetAngle) > -0.3) this.targetAngle = -rand(0.4, Math.PI - 0.4);
    }

    const delta = angleDelta(this.angle, this.targetAngle);
    this.angle += clamp(delta, -this.turnRate * dt, this.turnRate * dt);

    const speed = this.speed * this.speedScale;
    this.x += Math.cos(this.angle) * speed * dt;
    this.y += Math.sin(this.angle) * speed * dt;
    if (!this.entering) {
      this.x = clamp(this.x, 16, W - 16);
      this.y = clamp(this.y, 60, GROUND_Y - 20);
    }

    const c = Math.cos(this.angle);
    if (c > 0.2) this.facing = 1;
    else if (c < -0.2) this.facing = -1;
  }

  leave() {
    this.state = 'leaving';
    this.angle = -Math.PI / 2 + rand(-0.5, 0.5);
    this.facing = Math.cos(this.angle) >= 0 ? 1 : -1;
  }

  hitTest(px, py, pad = 0) {
    // Small ducks keep a minimum hit radius so they stay fair to click.
    const radius = Math.max(this.size * 0.64, 22) + pad;
    return this.alive && dist2(px, py, this.x, this.y) <= radius ** 2;
  }

  kill() {
    this.state = 'hit';
    this.hitTimer = 0.22;
  }

  render(ctx) {
    const moving = this.state === 'flying' || this.state === 'leaving';
    drawDuck(ctx, {
      x: this.x,
      y: this.y,
      size: this.size,
      facing: this.facing,
      flap: moving ? Math.sin(this.flap) * 0.7 : this.state === 'hit' ? -1 : 0.5,
      palette: this.palette,
      accessory: this.accessory,
      dead: this.state === 'hit' || this.state === 'falling',
      rot: this.rot,
    });
  }
}
