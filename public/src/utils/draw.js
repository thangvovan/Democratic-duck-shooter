export const W = 960;
export const H = 540;
export const GROUND_Y = 430;
export const FONT = '"Press Start 2P", "Courier New", monospace';

export function drawText(ctx, text, x, y, opts = {}) {
  const {
    size = 16,
    color = '#fff',
    align = 'center',
    baseline = 'middle',
    stroke = '#1a1030',
    strokeWidth = Math.max(3, size / 4),
    alpha = 1,
  } = opts;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (stroke) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function ellipse(ctx, x, y, rx, ry, fill, stroke, lineWidth = 3, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
