// Canvas HUD: score, stage, ammo, HP, enemy ammo, boss misses, timer and combo.
import { W, drawText } from '../utils/draw.js';

const PAD = (n) => String(Math.floor(n)).padStart(7, '0');

function bulletIcon(ctx, x, y, color = '#ffcf5a', tip = '#c98b2b') {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#1a1030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 6, 8, 16, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tip;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 6);
  ctx.quadraticCurveTo(x, y - 16, x + 4, y - 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function heart(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-12, -2, -8, -12, 0, -6);
  ctx.bezierCurveTo(8, -12, 12, -2, 0, 6);
  ctx.closePath();
  ctx.fillStyle = filled ? '#ff3b5c' : 'rgba(255,255,255,0.15)';
  ctx.fill();
  ctx.strokeStyle = '#1a1030';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function iconRow(ctx, count, rightX, y, draw, max = 10) {
  const shown = Math.min(count, max);
  for (let i = 0; i < shown; i++) draw(rightX - i * 13, y);
  if (count > max) drawText(ctx, `+${count - max}`, rightX - shown * 13 - 6, y + 2, { size: 9, align: 'right' });
}

export function renderHud(ctx, hud, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,40,0.78)';
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(0, 46, W, 3);

  const score = hud.score ?? game.score.displayScore;
  drawText(ctx, 'SCORE', 16, 14, { size: 9, color: '#ffd23f', align: 'left', stroke: null });
  drawText(ctx, PAD(score), 16, 32, { size: 16, align: 'left' });

  drawText(ctx, hud.label, W / 2, 16, { size: 12, color: '#ffffff' });
  if (hud.timer != null) {
    drawText(ctx, `TIME ${Math.ceil(hud.timer)}`, W / 2, 35, {
      size: 10,
      color: hud.timer <= 5 ? '#ff5a5a' : '#5ee7ff',
      stroke: null,
    });
  }

  drawText(ctx, 'AMMO', W - 16, 14, { size: 9, color: '#ffd23f', align: 'right', stroke: null });
  if (hud.ammoInfinite) {
    drawText(ctx, 'UNLIMITED', W - 16, 32, { size: 11, align: 'right' });
  } else {
    const ammo = hud.ammo ?? 0;
    if (ammo === 0) drawText(ctx, 'EMPTY', W - 16, 32, { size: 11, color: '#ff5a5a', align: 'right' });
    else iconRow(ctx, ammo, W - 22, 32, (x, y) => bulletIcon(ctx, x, y));
  }

  let rowY = 66;
  if (hud.hp != null) {
    drawText(ctx, 'HP', W - 16 - hud.maxHp * 20 - 8, rowY, { size: 10, align: 'right' });
    for (let i = 0; i < hud.maxHp; i++) heart(ctx, W - 26 - (hud.maxHp - 1 - i) * 20, rowY, i < hud.hp);
    rowY += 24;
  }
  if (hud.enemyAmmo != null) {
    drawText(ctx, 'COP AMMO', W - 16 - Math.max(1, Math.min(hud.enemyAmmo, 10)) * 13 - 10, rowY + 2, {
      size: 9,
      color: '#ff8a8a',
      align: 'right',
    });
    if (hud.enemyAmmo === 0) drawText(ctx, '0', W - 20, rowY + 2, { size: 10, color: '#ff8a8a', align: 'right' });
    else iconRow(ctx, hud.enemyAmmo, W - 22, rowY + 2, (x, y) => bulletIcon(ctx, x, y, '#ff5a5a', '#9d1c2c'));
    rowY += 24;
  }
  if (hud.misses != null) {
    drawText(ctx, 'MISSES', W - 16 - hud.maxMisses * 20 - 6, rowY, { size: 9, align: 'right' });
    for (let i = 0; i < hud.maxMisses; i++) {
      drawText(ctx, i < hud.misses ? 'X' : 'O', W - 22 - (hud.maxMisses - 1 - i) * 20, rowY, {
        size: 12,
        color: i < hud.misses ? '#ff3b3b' : '#6f6a85',
      });
    }
    rowY += 24;
  }
  if (hud.escapes != null && hud.escapes > 0) {
    drawText(ctx, `ESCAPES ${hud.escapes}/${hud.maxEscapes}`, W - 16, rowY, { size: 9, color: '#ff8a8a', align: 'right' });
  }

  if (hud.score == null && game.score.streak >= 3) {
    drawText(ctx, `COMBO x${game.score.streak}`, 16, 66, {
      size: 11,
      color: game.score.streak >= 5 ? '#ff5da2' : '#5ee7ff',
      align: 'left',
    });
  }
  ctx.restore();
}

export function renderCrosshair(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  for (const [color, width] of [
    ['#1a1030', 6],
    ['#ffffff', 2.5],
  ]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.moveTo(-28, 0);
    ctx.lineTo(-9, 0);
    ctx.moveTo(28, 0);
    ctx.lineTo(9, 0);
    ctx.moveTo(0, -28);
    ctx.lineTo(0, -9);
    ctx.moveTo(0, 28);
    ctx.lineTo(0, 9);
    ctx.stroke();
  }
  ctx.fillStyle = '#ff3b3b';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
