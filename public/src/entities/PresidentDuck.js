import { drawDuck, PALETTES } from './duckArt.js';
import { W, H, GROUND_Y, drawText } from '../utils/draw.js';
import { rand, dist2, lerp } from '../utils/math.js';

export const PODIUM = { x: W / 2, y: 318 };
const HIDE_Y = 336; // crouched behind the podium, only the head peeks out

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
    this.speed = 600;
    this.pause = 0;
    this.waypoint = { x: PODIUM.x, y: PODIUM.y };
    this.rot = 0;
    this.vy = 0;
    this.timer = 0;
  }

  get vulnerable() {
    return this.state === 'running';
  }

  get atPodium() {
    return this.state === 'podium' || this.state === 'hiding';
  }

  arrive() {
    this.state = 'arriving';
    this.x = Math.random() < 0.5 ? -100 : W + 100;
    this.y = PODIUM.y;
    this.rot = 0;
  }

  // Run back to the podium from wherever he is (shield restored).
  retreat() {
    this.state = 'arriving';
  }

  hide() {
    this.state = 'hiding';
  }

  // Survived stage 3: walk to the middle of the stage and raise a wing.
  celebrate() {
    this.state = 'celebrating';
    this.timer = 0;
  }

  becomeTarget() {
    this.state = 'running';
    this.y = PODIUM.y - 20;
    this.pause = 0.5;
    this.pickWaypoint();
  }

  escape() {
    if (this.state === 'hit' || this.state === 'falling' || this.state === 'gone') return;
    this.state = 'escaping';
    this.waypoint = { x: this.x < W / 2 ? -140 : W + 140, y: Math.min(this.y, PODIUM.y) - 40 };
  }

  defeat() {
    this.state = 'hit';
    this.timer = 0.45;
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
        this.flap += dt * 14;
        if (this.moveTowards(PODIUM.x, PODIUM.y, 540, dt)) {
          this.state = 'podium';
          this.facing = 1;
        }
        break;
      case 'podium':
        this.flap += dt * 4;
        this.y = PODIUM.y + Math.sin(this.time * 3) * 3;
        break;
      case 'hiding':
        this.flap += dt * 30;
        this.y = lerp(this.y, HIDE_Y, Math.min(1, dt * 8));
        this.x = PODIUM.x + Math.sin(this.time * 45) * 1.6; // trembling
        break;
      case 'running':
        this.flap += dt * 24;
        if (this.pause > 0) {
          this.pause -= dt;
        } else if (this.moveTowards(this.waypoint.x, this.waypoint.y, this.speed, dt)) {
          this.pause = 0.28; // short, readable stop so the boss stays fair to hit
          this.pickWaypoint();
        }
        break;
      case 'celebrating':
        // Step out in front of the podium so nothing covers him.
        this.timer += dt;
        if (!this.moveTowards(W / 2 - 210, GROUND_Y - 30, 300, dt)) break;
        this.facing = 1;
        this.y = GROUND_Y - 30 + Math.sin(this.time * 3) * 4;
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

  hitTest(px, py, pad = 0) {
    if (this.state === 'offstage' || this.state === 'gone') return false;
    return dist2(px, py, this.x, this.y) <= (this.size * 0.62 + pad) ** 2;
  }

  render(ctx) {
    if (this.state === 'offstage' || this.state === 'gone') return;
    const running = this.state === 'running' || this.state === 'escaping';
    const scared = this.state === 'hiding' || this.state === 'escaping' || this.state === 'arriving';
    const celebrating = this.state === 'celebrating';
    const bob = running ? Math.abs(Math.sin(this.time * 18)) * -6 : 0;

    drawDuck(ctx, {
      x: this.x,
      y: this.y + bob,
      size: this.size,
      facing: this.facing,
      // Celebrating: wing held up in the air, with a small victory wave.
      flap: celebrating ? -1.35 + Math.sin(this.time * 4) * 0.12 : Math.sin(this.flap) * (running || scared ? 0.9 : 0.25),
      palette: PALETTES.president,
      accessory: 'president',
      scared,
      dead: this.state === 'hit' || this.state === 'falling',
      rot: this.rot,
    });

    if (scared) {
      const s = this.size / 60;
      for (let i = 0; i < 2; i++) {
        const t = (this.time * 1.5 + i * 0.5) % 1;
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = '#9be7ff';
        ctx.strokeStyle = '#1a1030';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(this.x + (i === 0 ? -8 : 30) * s * this.facing, this.y - 30 * s + t * 22, 3.5, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    if (this.state === 'running') {
      drawText(ctx, 'VỊT TỔNG THỐNG', this.x, this.y - this.size * 1.05, { size: 9, color: '#ffd23f' });
    }
  }

  // Shield bubble over the podium, drawn in front of it while he hides.
  renderShield(ctx) {
    if (this.state !== 'hiding') return;
    ctx.save();
    ctx.globalAlpha = 0.22 + Math.sin(this.time * 4) * 0.06;
    ctx.fillStyle = '#5ee7ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(PODIUM.x, 350, 96, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.stroke();
    ctx.restore();
    drawText(ctx, 'KHIÊN', PODIUM.x, 244, { size: 10, color: '#5ee7ff' });
  }
}
