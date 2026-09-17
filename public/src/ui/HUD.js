// Canvas HUD: score, stage, ammo slots, HP, enemy ammo slots, shield timer and combo.
import { W, drawText } from '../utils/draw.js';
import { formatTime } from '../utils/math.js';

const PAD = (n) => String(Math.floor(n)).padStart(7, '0');
const FLASH_MS = 380;
const GRAY = { fill: '#6f6a85', tip: '#4a4560' };

// Remembers previous ammo counts so a slot can "pop" when a bullet is used or loaded.
const slotState = { ammo: { prev: null, flashes: [] }, enemy: { prev: null, flashes: [] } };

function bulletIcon(ctx, x, y, colors, scale = 1, flash = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = colors.fill;
  ctx.strokeStyle = '#1a1030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-4, -6, 8, 16, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = colors.tip;
  ctx.beginPath();
  ctx.moveTo(-4, -6);
  ctx.quadraticCurveTo(0, -16, 4, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -14, 10, 25);
  }
  ctx.restore();
}

// Always draws `slots` bullets; the first `count` are loaded, the rest are gray.
function slotRow(ctx, key, count, slots, rightX, y, colors) {
  const state = slotState[key];
  const now = performance.now();
  if (state.prev !== null && count < state.prev) {
    for (let i = count; i < state.prev; i++) state.flashes[i] = now;
  }
  state.prev = count;

  const spacing = 14;
  for (let i = 0; i < slots; i++) {
    const x = rightX - (slots - 1 - i) * spacing;
    const t = state.flashes[i] ? (now - state.flashes[i]) / FLASH_MS : 1;
    const animating = t < 1;
    bulletIcon(ctx, x, y, i < count ? colors : GRAY, animating ? 1 + (1 - t) * 0.7 : 1, animating ? 1 - t : 0);
  }
  return rightX - (slots - 1) * spacing - 12;
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

export function renderHud(ctx, hud, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,40,0.78)';
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(0, 46, W, 3);

  const score = hud.score ?? game.score.displayScore;
  drawText(ctx, 'ĐIỂM', 16, 14, { size: 9, color: '#ffd23f', align: 'left', stroke: null });
  drawText(ctx, PAD(score), 16, 32, { size: 16, align: 'left' });

  drawText(ctx, hud.label, W / 2, 16, { size: 12, color: '#ffffff' });
  if (hud.stageTime != null) {
    drawText(ctx, `THỜI GIAN ${formatTime(hud.stageTime)}`, W / 2, 35, {
      size: 10,
      color: hud.stageTime <= 20 ? '#ff5a5a' : '#5ee7ff',
      stroke: null,
    });
  }
  if (hud.shieldTime != null) {
    drawText(ctx, `KHIÊN HỒI SAU ${Math.ceil(hud.shieldTime)}`, W / 2, 64, {
      size: 12,
      color: hud.shieldTime <= 10 ? '#ff5a5a' : '#5ee7ff',
    });  }

  if (hud.ammoInfinite) {
    drawText(ctx, 'ĐẠN', W - 16, 14, { size: 9, color: '#ffd23f', align: 'right', stroke: null });
    drawText(ctx, 'VÔ HẠN', W - 16, 32, { size: 11, align: 'right' });
  } else {
    const labelX = slotRow(ctx, 'ammo', hud.ammo ?? 0, hud.ammoSlots, W - 22, 26, { fill: '#ffcf5a', tip: '#c98b2b' });
    drawText(ctx, 'ĐẠN', labelX, 26, { size: 9, color: '#ffd23f', align: 'right', stroke: null });
  }

  let rowY = 66;
  if (hud.hp != null) {
    drawText(ctx, 'MÁU', W - 16 - hud.maxHp * 20 - 8, rowY, { size: 10, align: 'right' });
    for (let i = 0; i < hud.maxHp; i++) heart(ctx, W - 26 - (hud.maxHp - 1 - i) * 20, rowY, i < hud.hp);
    rowY += 26;
  }
  if (hud.enemySlots != null) {
    const labelX = slotRow(ctx, 'enemy', hud.enemyAmmo, hud.enemySlots, W - 22, rowY, { fill: '#ff3b3b', tip: '#9d1c2c' });
    drawText(ctx, hud.enemyLabel || 'ĐẠN ĐỊCH', labelX, rowY, { size: 9, color: '#ff8a8a', align: 'right' });
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
