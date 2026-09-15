import { drawDuck, PALETTES } from './duckArt.js';
import { W, H, GROUND_Y, drawText } from '../utils/draw.js';
import { rand, dist2 } from '../utils/math.js';

export const PODIUM = { x: W / 2, y: 318 };

// Fictional boss. States: offstage, arriving, podium, hiding, running, escaping, hit, falling, gone
export class PresidentDuck {
  constructor() {
    this.size = 78;
    this.x = W + 100;
    this.y = PODIUM.y;
    this.state = 'offstage';
    this.facing = -1;
    this.flap = 0;
    this.time = 0;
    this.speed = 560;
    this.pause = 0;
    this.waypoint = { x: PODIUM.x, y: PODIUM.y };
    this.rot = 0;
    this.vy = 0;
    this.timer = 0;
    this.hatOff = false;
  }

  get vulnerable() {
    return this.state === 'running';
  }

  get atPodium() {
    return this.state === 'podium' || this.state === 'hiding' || this.state === 'arriving';
  }

  arrive() {
    this.state = 'arriving';
    this.x = Math.random() < 0.5 ? -100 : W + 100;
    this.y = PODIUM.y;
    this.hatOff = false;
    this.rot = 0;
  }

  hide() {
    this.state = 'hiding';
  }

  becomeTarget(speedFactor) {
    this.state = 'running';
    this.speed = 560 * speedFactor;
    this.pause = 0.45;
    this.pickWaypoint();
  }

  escape() {
    this.state = 'escaping';
    this.waypoint = { x: this.x < W / 2 ? -140 : W + 140, y: this.y - 40 };
  }

  defeat() {
    this.state = 'hit';
    this.timer = 0.45;
    this.hatOff = true;
  }

  pickWaypoint() {
    let x;
    let y;
    let tries = 0;
    do {
      x = rand(90, W - 90);
      y = rand(130, GROUND_Y - 60);
      tries++;
    } while (dist2(x, y, this.x, this.y) < 230 ** 2 && tries < 10);
    this.waypoint = { x, y };
  }

  moveTowards(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 2) this.facing = dx > 0 ? 1 : -1;
    const step = speed * dt;
    if (d <= step) {
      this.x = tx;
      this.y = ty;
      return true;
    }
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    return false;
  }

  update(dt) {
    this.time += dt;
    switch (this.state) {
      case 'arriving':
        this.flap += dt * 10;
        if (this.moveTowards(PODIUM.x, PODIUM.y, 420, dt)) {
          this.state = 'podium';
          this.facing = 1;
        }
        break;
      case 'podium':
      case 'hiding':
        this.flap += dt * 4;
        this.y = PODIUM.y + Math.sin(this.time * 3) * 3;
        break;
      case 'running':
        this.flap += dt * 24;
        if (this.pause > 0) {
          this.pause -= dt;
        } else if (this.moveTowards(this.waypoint.x, this.waypoint.y, this.speed, dt)) {
          this.pause = 0.3; // short, readable stop so the boss stays fair to hit
          this.pickWaypoint();
        }
        break;
      case 'escaping':
        this.flap += dt * 26;
        if (this.moveTowards(this.waypoint.x, this.waypoint.y, 950, dt)) this.state = 'gone';
        break;
      case 'hit':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.state = 'falling';
          this.vy = -260;
        }
        break;
      case 'falling':
        this.vy += 1400 * dt;
        this.y += this.vy * dt;
        this.rot += 6 * dt;
        if (this.y > H + 120) this.state = 'gone';
        break;
    }
  }

  hitTest(px, py) {
    if (this.state === 'offstage' || this.state === 'gone') return false;
    return dist2(px, py, this.x, this.y) <= (this.size * 0.62) ** 2;
  }

  render(ctx) {
    if (this.state === 'offstage' || this.state === 'gone') return;
    const running = this.state === 'running' || this.state === 'escaping';
    const bob = running ? Math.abs(Math.sin(this.time * 18)) * -6 : 0;

    drawDuck(ctx, {
      x: this.x,
      y: this.y + bob,
      size: this.size,
      facing: this.facing,
      flap: Math.sin(this.flap) * (running ? 0.9 : 0.25),
      palette: PALETTES.president,
      accessory: 'president',
      dead: this.state === 'hit' || this.state === 'falling',
      hatOff: this.hatOff,
      rot: this.rot,
    });

    if (this.state === 'hiding') {
      ctx.save();
      ctx.globalAlpha = 0.25 + Math.sin(this.time * 4) * 0.08;
      ctx.fillStyle = '#5ee7ff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 6, this.size * 0.78, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (this.state === 'running') {
      drawText(ctx, 'PRESIDENT DUCK', this.x, this.y - this.size * 0.95, { size: 9, color: '#ffd23f' });
      if (this.pause > 0) {
        ctx.fillStyle = '#9be7ff';
        ctx.beginPath();
        ctx.ellipse(this.x - this.facing * 22, this.y - 40, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
