// Short-lived visual effects: score popups, speech bubbles, feathers, tracers,
// muzzle flash, screen shake and big center messages. All pools are capped.
import { W, H, FONT, drawText, roundRectPath, wrapText } from '../utils/draw.js';
import { rand, clamp, easeOutBack, removeWhere } from '../utils/math.js';

const MAX_PARTICLES = 220;
const MAX_POPUPS = 24;

export class EffectsSystem {
  constructor() {
    this.popups = [];
    this.particles = [];
    this.tracers = [];
    this.flashes = [];
    this.bubble = null;
    this.message = null;
    this.shake = 0;
    this.hurtFlash = 0;
  }

  clear() {
    this.popups.length = 0;
    this.particles.length = 0;
    this.tracers.length = 0;
    this.flashes.length = 0;
    this.bubble = null;
    this.message = null;
    this.shake = 0;
    this.hurtFlash = 0;
  }

  addPopup(x, y, text, { color = '#ffd23f', size = 18, life = 1 } = {}) {
    if (this.popups.length >= MAX_POPUPS) this.popups.shift();
    this.popups.push({ x, y, text, color, size, life, maxLife: life });
  }

  addBubble(x, y, text, { speaker = 'duck', life = 2.4 } = {}) {
    this.bubble = { x, y, text, speaker, life, maxLife: life, lines: null };
  }

  addFeathers(x, y, color = '#ffe066', count = 12) {
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      this.particles.push({
        type: 'feather',
        x,
        y,
        vx: rand(-160, 160),
        vy: rand(-220, 20),
        rot: rand(0, Math.PI * 2),
        vr: rand(-6, 6),
        size: rand(5, 9),
        color: Math.random() < 0.3 ? '#ffffff' : color,
        life: rand(0.9, 1.5),
        maxLife: 1.5,
      });
    }
  }

  addStars(x, y, count = 8, color = '#ffd23f') {
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = rand(120, 260);
      this.particles.push({
        type: 'star',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: 0,
        vr: rand(-8, 8),
        size: rand(5, 9),
        color,
        life: 0.5,
        maxLife: 0.5,
      });
    }
  }

  addMuzzleFlash(x, y) {
    this.flashes.push({ x, y, life: 0.07, maxLife: 0.07 });
  }

  addTracer(x1, y1, x2, y2) {
    this.tracers.push({ x1, y1, x2, y2, life: 0.08, maxLife: 0.08 });
  }

  addShake(amount) {
    this.shake = Math.min(18, this.shake + amount);
  }

  addHurtFlash() {
    this.hurtFlash = 0.45;
  }

  showMessage(text, { sub = '', color = '#ffd23f', duration = 1.8, size = 34 } = {}) {
    this.message = { text, sub, color, size, life: duration, maxLife: duration };
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 40);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);

    for (const p of this.popups) {
      p.life -= dt;
      p.y -= 50 * dt;
    }
    removeWhere(this.popups, (p) => p.life <= 0);

    for (const p of this.particles) {
      p.life -= dt;
      p.rot += p.vr * dt;
      if (p.type === 'feather') {
        p.vx *= 1 - 2.5 * dt;
        p.vy = Math.min(p.vy + 420 * dt, 70);
        p.x += (p.vx + Math.sin(p.life * 8) * 30) * dt;
      } else {
        p.vx *= 1 - 4 * dt;
        p.vy *= 1 - 4 * dt;
        p.x += p.vx * dt;
      }
      p.y += p.vy * dt;
    }
    removeWhere(this.particles, (p) => p.life <= 0);

    for (const t of this.tracers) t.life -= dt;
    removeWhere(this.tracers, (t) => t.life <= 0);
    for (const f of this.flashes) f.life -= dt;
    removeWhere(this.flashes, (f) => f.life <= 0);

    if (this.bubble) {
      this.bubble.life -= dt;
      if (this.bubble.life <= 0) this.bubble = null;
    }
    if (this.message) {
      this.message.life -= dt;
      if (this.message.life <= 0) this.message = null;
    }
  }

  applyShake(ctx) {
    if (this.shake > 0) ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));
  }

  renderWorld(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = clamp(p.life / (p.maxLife * 0.4), 0, 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.type === 'feather') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    for (const t of this.tracers) {
      ctx.save();
      ctx.globalAlpha = t.life / t.maxLife;
      ctx.strokeStyle = '#fff6b0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(t.x1, t.y1);
      ctx.lineTo(t.x2, t.y2);
      ctx.stroke();
      ctx.restore();
    }

    for (const f of this.flashes) {
      const s = 1 + (1 - f.life / f.maxLife);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(s, s);
      ctx.fillStyle = '#fff3a0';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 30 : 12;
        const a = (i / 10) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff9d2e';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderOverlay(ctx) {
    if (this.hurtFlash > 0) {
      ctx.save();
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
      g.addColorStop(0, 'rgba(255,0,0,0)');
      g.addColorStop(1, `rgba(255,30,30,${this.hurtFlash})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    for (const p of this.popups) {
      const t = 1 - p.life / p.maxLife;
      const scale = t < 0.2 ? easeOutBack(t / 0.2) : 1;
      drawText(ctx, p.text, p.x, p.y, { size: p.size * scale, color: p.color, alpha: clamp(p.life / 0.3, 0, 1) });
    }

    if (this.bubble) this.renderBubble(ctx, this.bubble);

    if (this.message) {
      const m = this.message;
      const t = 1 - m.life / m.maxLife;
      const scale = t < 0.15 ? easeOutBack(t / 0.15) : 1;
      const alpha = clamp(m.life / 0.3, 0, 1);
      drawText(ctx, m.text, W / 2, H / 2 - 20, { size: m.size * scale, color: m.color, alpha, strokeWidth: 8 });
      if (m.sub) drawText(ctx, m.sub, W / 2, H / 2 + 28, { size: 14, color: '#fff', alpha });
    }
  }

  renderBubble(ctx, b) {
    ctx.save();
    ctx.font = `11px ${FONT}`;
    if (!b.lines) b.lines = wrapText(ctx, b.text, 250);
    const lineHeight = 17;
    const width = Math.max(...b.lines.map((l) => ctx.measureText(l).width)) + 28;
    const height = b.lines.length * lineHeight + 22;

    const above = b.speaker === 'player' || b.y > 180;
    let bx = clamp(b.x - width / 2, 8, W - width - 8);
    let by = above ? b.y - height - 42 : b.y + 42;
    by = clamp(by, 52, H - height - 8);

    const t = 1 - b.life / b.maxLife;
    const scale = t < 0.12 ? easeOutBack(t / 0.12) : 1;
    ctx.globalAlpha = clamp(b.life / 0.3, 0, 1);
    ctx.translate(bx + width / 2, by + height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(bx + width / 2), -(by + height / 2));

    const tailX = clamp(b.x, bx + 16, bx + width - 16);
    ctx.fillStyle = b.speaker === 'player' ? '#fffbe6' : '#ffffff';
    ctx.strokeStyle = '#1a1030';
    ctx.lineWidth = 3;
    roundRectPath(ctx, bx, by, width, height, 10);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    if (above) {
      ctx.moveTo(tailX - 9, by + height - 2);
      ctx.lineTo(tailX, by + height + 16);
      ctx.lineTo(tailX + 9, by + height - 2);
    } else {
      ctx.moveTo(tailX - 9, by + 2);
      ctx.lineTo(tailX, by - 16);
      ctx.lineTo(tailX + 9, by + 2);
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(tailX - 7, above ? by + height - 5 : by + 1, 14, 5);

    ctx.fillStyle = '#1a1030';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    b.lines.forEach((line, i) => ctx.fillText(line, bx + width / 2, by + 12 + i * lineHeight));
    ctx.restore();
  }
}
