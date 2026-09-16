// End of stage 3 when the president survives: he raises a wing while a squad of ducks
// carries a campaign banner down behind him. Runs for RULES.FINALE_TIME seconds.
import { drawDuck, PALETTES } from '../entities/duckArt.js';
import { RULES } from '../data/rules.js';
import { W, drawText } from '../utils/draw.js';
import { clamp, rand } from '../utils/math.js';

const BANNER_TEXT = ['MAKE AMERICA', 'GREAT AGAIN'];
const BANNER_W = 620;
const BANNER_H = 150;
const BANNER_X = (W - BANNER_W) / 2;
const BANNER_TOP = 150; // where the carried banner settles

// Timeline (seconds)
const T_CARRIERS_IN = 1.2; // ducks start flying down
const T_LANDED = 4.2; // banner has reached its place
const T_UNROLLED = 5.6; // banner fully unrolled
const T_CHEER = 6.0; // confetti + fanfare

export class Finale {
  constructor(game, president) {
    this.game = game;
    this.president = president;
    this.time = 0;
    this.cheered = false;
    this.carriers = [
      { x: BANNER_X, y: -80, flap: 0 },
      { x: BANNER_X + BANNER_W, y: -80, flap: Math.PI },
    ];
  }

  get done() {
    return this.time >= RULES.FINALE_TIME;
  }

  update(dt) {
    this.time += dt;
    const t = this.time;

    // Carriers descend, then hover with a slight sway.
    const drop = clamp((t - T_CARRIERS_IN) / (T_LANDED - T_CARRIERS_IN), 0, 1);
    const eased = 1 - (1 - drop) ** 3;
    for (const [i, carrier] of this.carriers.entries()) {
      carrier.flap += dt * 14;
      carrier.y = -80 + eased * (BANNER_TOP - 40 + 80);
      if (drop >= 1) carrier.y += Math.sin(t * 2 + i) * 4;
    }

    if (!this.cheered && t >= T_CHEER) {
      this.cheered = true;
      this.game.audio.play('victory');
      for (let i = 0; i < 6; i++) {
        this.game.effects.addStars(rand(BANNER_X, BANNER_X + BANNER_W), rand(BANNER_TOP, BANNER_TOP + BANNER_H), 6, '#ffd23f');
      }
    }
  }

  // Drawn behind the president so the banner sits at his back.
  render(ctx) {
    const t = this.time;
    if (t < T_CARRIERS_IN) return;

    const top = this.carriers[0].y + 40;
    const unroll = clamp((t - T_LANDED) / (T_UNROLLED - T_LANDED), 0, 1);
    const height = 24 + (BANNER_H - 24) * unroll;
    const sway = Math.sin(t * 1.6) * 0.012;

    ctx.save();
    ctx.translate(W / 2, top);
    ctx.rotate(sway);
    ctx.translate(-W / 2, -top);

    // Ropes from the carriers' feet to the banner corners
    ctx.strokeStyle = '#e9d8a6';
    ctx.lineWidth = 3;
    for (const carrier of this.carriers) {
      ctx.beginPath();
      ctx.moveTo(carrier.x, carrier.y + 14);
      ctx.lineTo(carrier.x, top);
      ctx.stroke();
    }

    // Banner cloth
    ctx.fillStyle = '#d62839';
    ctx.strokeStyle = '#1a1030';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(BANNER_X, top, BANNER_W, height);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(BANNER_X + 10, top + 8, BANNER_W - 20, 4);
    ctx.fillRect(BANNER_X + 10, top + height - 12, BANNER_W - 20, 4);

    // Gold fringe once it is open
    if (unroll > 0.5) {
      ctx.fillStyle = '#e0b43a';
      for (let x = BANNER_X + 8; x < BANNER_X + BANNER_W - 8; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, top + height);
        ctx.lineTo(x + 11, top + height + 12);
        ctx.lineTo(x + 22, top + height);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (unroll > 0.35) {
      ctx.globalAlpha = clamp((unroll - 0.35) / 0.4, 0, 1);
      BANNER_TEXT.forEach((line, i) => {
        drawText(ctx, line, W / 2, top + height / 2 - 24 + i * 46, { size: 30, color: '#ffffff', strokeWidth: 7 });
      });
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Carrier ducks holding the ropes with their feet
    for (const [i, carrier] of this.carriers.entries()) {
      drawDuck(ctx, {
        x: carrier.x,
        y: carrier.y,
        size: 50,
        facing: i === 0 ? 1 : -1,
        flap: Math.sin(carrier.flap) * 0.9,
        palette: PALETTES.yellow,
      });
    }
  }
}
