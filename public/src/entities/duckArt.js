// Vector cartoon duck drawn in a 60-unit local space, facing right.
const OUTLINE = '#1a1030';

export const PALETTES = {
  yellow: { body: '#ffd93b', wing: '#f2b705', head: '#ffd93b' },
  white: { body: '#f7f7f7', wing: '#d6d6e0', head: '#f7f7f7' },
  mallard: { body: '#b98a5a', wing: '#8a5a2b', head: '#2e9e5b' },
  pink: { body: '#ff9fc6', wing: '#ff6fa8', head: '#ff9fc6' },
  police: { body: '#2f5bd3', wing: '#1f3f9c', head: '#ffd93b' },
  bodyguard: { body: '#26262e', wing: '#15151b', head: '#ffd93b' },
  president: { body: '#1c2f6b', wing: '#13214d', head: '#ffe27a' },
};

function circle(ctx, x, y, r, fill, lineWidth = 3) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

export function drawDuck(ctx, o) {
  const p = o.palette || PALETTES.yellow;
  const s = o.size / 60;
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale((o.facing || 1) * s, s);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;

  // Tail
  ctx.beginPath();
  ctx.moveTo(-20, -2);
  ctx.lineTo(-35, -13);
  ctx.lineTo(-30, 8);
  ctx.closePath();
  ctx.fillStyle = p.body;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 6, 25, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (o.accessory === 'bodyguard' || o.accessory === 'president') {
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(24, 2);
    ctx.lineTo(15, 17);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.fillStyle = o.accessory === 'president' ? '#d62839' : '#111';
    ctx.fillRect(15, -2, 4, 12);
  }
  if (o.accessory === 'president') {
    ctx.save();
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#d62839';
    ctx.beginPath();
    ctx.moveTo(-14, -8);
    ctx.lineTo(10, 21);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
    circle(ctx, 17, -3, 3.5, '#d62839', 2);
  }
  if (o.accessory === 'police') {
    circle(ctx, 12, 4, 4, '#ffd23f', 2);
  }

  // Wing
  ctx.save();
  ctx.translate(-4, 2);
  ctx.rotate(-(o.flap || 0));
  ctx.beginPath();
  ctx.ellipse(-7, 0, 15, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = p.wing;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Head
  circle(ctx, 18, -14, 12, p.head);

  // Beak
  ctx.beginPath();
  ctx.moveTo(27, -19);
  ctx.lineTo(43, -13);
  ctx.lineTo(27, -7);
  ctx.closePath();
  ctx.fillStyle = '#ff9f1c';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(28, -13);
  ctx.lineTo(38, -13);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Eye
  if (o.dead) {
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(18.5, -20.5);
    ctx.lineTo(25.5, -13.5);
    ctx.moveTo(25.5, -20.5);
    ctx.lineTo(18.5, -13.5);
    ctx.stroke();
  } else if (o.accessory === 'bodyguard' || o.accessory === 'president' || o.shades) {
    ctx.fillStyle = '#111';
    ctx.fillRect(15, -21, 14, 7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, -18);
    ctx.lineTo(7, -16);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(17, -20, 4, 2);
  } else {
    circle(ctx, 22, -17, 4.3, '#fff', 2);
    circle(ctx, 23.2, -17, 2.2, '#111', 0);
  }

  if (o.accessory === 'glasses' && !o.dead) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(22, -17, 6.5, 0, Math.PI * 2);
    ctx.moveTo(15.5, -17);
    ctx.lineTo(8, -15);
    ctx.stroke();
  }

  // Hats
  if (o.accessory === 'police') {
    ctx.fillStyle = '#1f3a93';
    ctx.beginPath();
    ctx.moveTo(6, -24);
    ctx.lineTo(8, -33);
    ctx.quadraticCurveTo(18, -38, 30, -33);
    ctx.lineTo(29, -24);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.fillRect(14, -25, 21, 4);
    circle(ctx, 18, -30, 2.6, '#ffd23f', 1.5);
  } else if (o.accessory === 'bodyguard') {
    ctx.strokeStyle = '#cfd3dc';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(9, -12);
    ctx.quadraticCurveTo(2, -4, 6, 4);
    ctx.stroke();
  } else if (o.accessory === 'president' && !o.hatOff) {
    ctx.fillStyle = '#111';
    ctx.fillRect(9, -48, 19, 22);
    ctx.lineWidth = 2.5;
    ctx.strokeRect(9, -48, 19, 22);
    ctx.fillStyle = '#d62839';
    ctx.fillRect(9, -32, 19, 4);
    ctx.fillStyle = '#111';
    ctx.fillRect(4, -28, 29, 4);
    ctx.strokeRect(4, -28, 29, 4);
  }

  ctx.restore();
}
