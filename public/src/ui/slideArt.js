// Small canvas illustrations for the slide panels (how to play + stage briefings).
// Each function draws into a 440x150 box using the same cartoon style as the game.
import { drawDuck, PALETTES } from '../entities/duckArt.js';
import { drawText } from '../utils/draw.js';
import { formatTime } from '../utils/math.js';
import { RULES } from '../data/rules.js';

const OUT = '#1a1030';

function bullet(ctx, x, y, scale = 1, color = '#ffcf5a', tip = '#c98b2b') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-5, -8, 10, 20, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tip;
  ctx.beginPath();
  ctx.moveTo(-5, -8);
  ctx.quadraticCurveTo(0, -20, 5, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function crosshair(ctx, x, y, r = 22) {
  ctx.save();
  ctx.translate(x, y);
  for (const [color, width] of [
    [OUT, 6],
    ['#ffffff', 2.5],
  ]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.moveTo(-r - 10, 0);
    ctx.lineTo(-r + 8, 0);
    ctx.moveTo(r + 10, 0);
    ctx.lineTo(r - 8, 0);
    ctx.moveTo(0, -r - 10);
    ctx.lineTo(0, -r + 8);
    ctx.moveTo(0, r + 10);
    ctx.lineTo(0, r - 8);
    ctx.stroke();
  }
  ctx.restore();
}

function arrow(ctx, x1, x2, y, color = '#ffd23f') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 12, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 16, y - 11);
  ctx.lineTo(x2 - 16, y + 11);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function card(ctx, x, y, w, h, { correct = true } = {}) {
  ctx.save();
  ctx.fillStyle = '#2a1b52';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  const rowH = (h - 20) / 2;
  for (let i = 0; i < 4; i++) {
    const cx = x + 10 + (i % 2) * (w / 2 - 6);
    const cy = y + 10 + Math.floor(i / 2) * (rowH + 4);
    ctx.fillStyle = i === 1 ? (correct ? '#3ddc84' : '#ff3b3b') : 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(cx, cy, w / 2 - 16, rowH - 4, 4);
    ctx.fill();
  }
  ctx.restore();
  drawText(ctx, correct ? 'CORRECT' : 'WRONG', x + w / 2, y + h + 16, {
    size: 10,
    color: correct ? '#3ddc84' : '#ff3b3b',
  });
}

function heart(ctx, x, y, filled = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.bezierCurveTo(-14, -3, -9, -14, 0, -7);
  ctx.bezierCurveTo(9, -14, 14, -3, 0, 7);
  ctx.closePath();
  ctx.fillStyle = filled ? '#ff3b5c' : 'rgba(255,255,255,0.18)';
  ctx.fill();
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function pellet(ctx, x, y, r = 12) {
  ctx.save();
  ctx.fillStyle = '#ff3b3b';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function shooter(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#2f3542';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-44, 40);
  ctx.quadraticCurveTo(-40, -6, -18, -12);
  ctx.lineTo(18, -12);
  ctx.quadraticCurveTo(40, -6, 44, 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a3825';
  ctx.beginPath();
  ctx.ellipse(0, -30, 18, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function ammoRow(ctx, x, y, loaded, total) {
  for (let i = 0; i < total; i++) {
    const cx = x + i * 18;
    if (i < loaded) bullet(ctx, cx, y, 0.9);
    else bullet(ctx, cx, y, 0.9, '#6f6a85', '#4a4560');
  }
}

function duck(ctx, x, y, size, accessory, palette) {
  drawDuck(ctx, { x, y, size, facing: 1, flap: 0.5, palette, accessory });
}

// Wrong answer -> one bullet for the enemy duck (cops or bodyguards).
function enemyAmmoArt(ctx, accessory, palette) {
  card(ctx, 20, 30, 120, 70, { correct: false });
  arrow(ctx, 160, 240, 62, '#ff5a5a');
  duck(ctx, 300, 66, 62, accessory, palette);
  bullet(ctx, 380, 60, 1.3, '#ff5a5a', '#9d1c2c');
  drawText(ctx, '+1', 380, 100, { size: 12, color: '#ff5a5a' });
}

export const SLIDE_ART = {
  answerAmmo(ctx) {
    card(ctx, 30, 30, 130, 70);
    arrow(ctx, 180, 260, 62);
    bullet(ctx, 310, 62, 1.6);
    drawText(ctx, '+1', 360, 66, { size: 18, color: '#ffd23f' });
  },

  shootDuck(ctx) {
    duck(ctx, 150, 60, 70, null, PALETTES.yellow);
    crosshair(ctx, 150, 60, 30);
    shooter(ctx, 330, 118, 0.85);
    ctx.strokeStyle = '#fff6b0';
    ctx.lineWidth = 3;
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    ctx.moveTo(300, 86);
    ctx.lineTo(178, 62);
    ctx.stroke();
    ctx.setLineDash([]);
    drawText(ctx, '+100', 150, 118, { size: 14, color: '#ffd23f' });
  },

  combo(ctx) {
    for (let i = 0; i < 3; i++) duck(ctx, 70 + i * 80, 60, 52, null, PALETTES.yellow);
    drawText(ctx, 'x2', 360, 62, { size: 34, color: '#ff5da2' });
    drawText(ctx, 'HIT, HIT, HIT...', 160, 120, { size: 12, color: '#5ee7ff' });
  },

  stages(ctx) {
    const labels = ['SCHOOL', 'POLICE', 'PRESIDENT'];
    const art = [
      () => duck(ctx, 0, 0, 60, 'student', PALETTES.student),
      () => duck(ctx, 0, 0, 60, 'police', PALETTES.police),
      () => duck(ctx, 0, 0, 60, 'president', PALETTES.president),
    ];
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(80 + i * 140, 56);
      art[i]();
      ctx.restore();
      drawText(ctx, labels[i], 80 + i * 140, 112, { size: 10, color: '#ffd23f' });
      drawText(ctx, formatTime(RULES.STAGE_TIME), 80 + i * 140, 132, { size: 10, color: '#5ee7ff' });
    }
  },

  controls(ctx) {
    const keys = ['1-4', 'A-D', 'ESC', 'M'];
    const notes = ['ANSWER', 'ANSWER', 'PAUSE', 'MUTE'];
    crosshair(ctx, 60, 60, 22);
    drawText(ctx, 'CLICK = SHOOT', 60, 112, { size: 10 });
    keys.forEach((key, i) => {
      const x = 170 + i * 70;
      ctx.fillStyle = '#2a1b52';
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x - 28, 40, 56, 40, 6);
      ctx.fill();
      ctx.stroke();
      drawText(ctx, key, x, 60, { size: 11, color: '#ffd23f' });
      drawText(ctx, notes[i], x, 100, { size: 9 });
    });
  },

  smallDucks(ctx) {
    duck(ctx, 140, 50, 34, 'student', PALETTES.student);
    duck(ctx, 300, 52, 32, 'student', PALETTES.student);
    duck(ctx, 220, 96, 30, 'student', PALETTES.student);
    crosshair(ctx, 220, 96, 26);
  },

  copAmmo(ctx) {
    enemyAmmoArt(ctx, 'police', PALETTES.police);
  },

  guardAmmo(ctx) {
    enemyAmmoArt(ctx, 'bodyguard', PALETTES.bodyguard);
  },

  block(ctx) {
    duck(ctx, 70, 44, 58, 'police', PALETTES.police);
    pellet(ctx, 200, 70, 14);
    crosshair(ctx, 200, 70, 24);
    shooter(ctx, 340, 120, 0.8);
    for (let i = 0; i < 5; i++) heart(ctx, 300 + i * 22, 30, i < 4);
    drawText(ctx, 'BLOCKED!', 200, 124, { size: 11, color: '#5ee7ff' });
  },

  volley(ctx) {
    for (let i = 0; i < 3; i++) {
      duck(ctx, 60 + i * 70, 40 + (i % 2) * 24, 50, 'police', PALETTES.police);
      pellet(ctx, 95 + i * 70, 78 + (i % 2) * 20, 10);
    }
    shooter(ctx, 360, 120, 0.8);
    ammoRow(ctx, 300, 34, 0, 5);
    drawText(ctx, 'YOUR AMMO: 0', 355, 60, { size: 10, color: '#ff5a5a' });
  },

  guards(ctx) {
    duck(ctx, 220, 44, 68, 'president', PALETTES.president);
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#5ee7ff';
    ctx.beginPath();
    ctx.arc(220, 52, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 3; i++) duck(ctx, 100 + i * 120, 108, 52, 'bodyguard', PALETTES.bodyguard);
    drawText(ctx, 'SHIELD', 220, 132, { size: 10, color: '#5ee7ff' });
  },

  shieldBack(ctx) {
    ctx.save();
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(80, 62, 34, 0, Math.PI * 2);
    ctx.moveTo(80, 40);
    ctx.lineTo(80, 64);
    ctx.lineTo(98, 74);
    ctx.stroke();
    ctx.restore();
    drawText(ctx, '50s', 80, 122, { size: 12, color: '#ffd23f' });
    drawText(ctx, 'OR', 165, 62, { size: 12 });
    ammoRow(ctx, 215, 62, 0, 5);
    drawText(ctx, 'NO AMMO', 250, 122, { size: 10, color: '#ff5a5a' });
    arrow(ctx, 306, 348, 62, '#5ee7ff');
    // President back behind his shield
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = '#5ee7ff';
    ctx.beginPath();
    ctx.arc(396, 62, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    duck(ctx, 396, 62, 52, 'president', PALETTES.president);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(396, 62, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawText(ctx, 'SHIELD', 396, 122, { size: 9, color: '#5ee7ff' });
  },

  goodShot(ctx) {
    drawDuck(ctx, { x: 150, y: 70, size: 76, facing: 1, flap: -1, palette: PALETTES.yellow, dead: true, rot: 0.5 });
    drawText(ctx, '+100', 150, 126, { size: 16, color: '#ffd23f' });
    shooter(ctx, 330, 120, 0.85);
  },
};
