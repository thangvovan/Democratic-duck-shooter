// Vector cartoon duck drawn in a 60-unit local space, facing right.

const OUTLINE = '#1a1030';

export const PALETTES = {
  yellow: { body: '#ffd93b', wing: '#f2b705', head: '#ffd93b' },
  white: { body: '#f7f7f7', wing: '#d6d6e0', head: '#f7f7f7' },
  mallard: { body: '#b98a5a', wing: '#8a5a2b', head: '#2e9e5b' },
  pink: { body: '#ff9fc6', wing: '#ff6fa8', head: '#ff9fc6' },
  student: { body: '#ffffff', wing: '#d9d9d9', head: '#ffd93b' },
  police: { body: '#2f5bd3', wing: '#1f3f9c', head: '#ffd93b' },
  bodyguard: { body: '#26262e', wing: '#15151b', head: '#ffd93b' },
  president: { body: '#1f4fb8', wing: '#173c8c', head: '#ffe27a' },
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

  if (o.rot) {
    ctx.rotate(o.rot);
  }

  ctx.scale((o.facing || 1) * s, s);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;

  // Student backpack
  if (o.accessory === 'student') {
    // Backpack body
    ctx.fillStyle = '#d62839';
    ctx.beginPath();
    ctx.roundRect(-25, -22, 25, 32, 5);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Backpack top flap
    ctx.fillStyle = '#b71f30';
    ctx.beginPath();
    ctx.moveTo(-25, -22);
    ctx.lineTo(0, -22);
    ctx.lineTo(-1, -13);
    ctx.lineTo(-24, -13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Front pocket
    ctx.fillStyle = '#c92a3a';
    ctx.beginPath();
    ctx.roundRect(-22, -10, 15, 10, 2);
    ctx.fill();
    ctx.stroke();

    // Backpack strap
    ctx.strokeStyle = '#8f1826';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-20, -20);
    ctx.quadraticCurveTo(-10, -10, -15, 5);
    ctx.stroke();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
  }

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
  ctx.fillStyle = p.body;
  ctx.fill();
  ctx.stroke();

  // Student uniform
  if (o.accessory === 'student') {
    // Black pants
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.moveTo(-23, 8);
    ctx.bezierCurveTo(
      -20, 17,
      -12, 22,
      0, 23
    );
    ctx.bezierCurveTo(
      12, 22,
      20, 17,
      23, 8
    );
    ctx.lineTo(23, 13);

    // Right leg
    ctx.lineTo(17, 21);
    ctx.lineTo(8, 21);
    ctx.lineTo(5, 15);

    // Left leg
    ctx.lineTo(3, 21);
    ctx.lineTo(-7, 21);
    ctx.lineTo(-10, 15);

    ctx.lineTo(-23, 13);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Black tie
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.moveTo(11, -4);
    ctx.lineTo(16, -4);
    ctx.lineTo(16, 3);
    ctx.lineTo(19, 11);
    ctx.lineTo(13.5, 15);
    ctx.lineTo(10, 11);
    ctx.lineTo(13, 3);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }

  // Bodyguard / President clothes
  if (o.accessory === 'bodyguard' || o.accessory === 'president') {
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(24, 2);
    ctx.lineTo(15, 17);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    if (o.accessory === 'president') {
      // Long red tie
      ctx.beginPath();
      ctx.moveTo(15, -5);
      ctx.lineTo(20, -5);
      ctx.lineTo(22, 13);
      ctx.lineTo(18, 19);
      ctx.lineTo(14, 13);
      ctx.closePath();
      ctx.fillStyle = '#d62839';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 3;
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(15, -2, 4, 12);
    }
  }

  // Police badge
  if (o.accessory === 'police') {
    circle(ctx, 12, 4, 4, '#ffd23f', 2);
  }

  // Wing
  ctx.save();
  ctx.translate(-4, 2);
  ctx.rotate(-(o.flap || 0));
  ctx.beginPath();
  ctx.ellipse(
    -7,
    0,
    15,
    8,
    0,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = p.wing;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Head
  circle(ctx, 18, -14, 12, p.head);

  // President hair
  if (o.accessory === 'president') {
    // Voluminous swept-up hair
    ctx.beginPath();
    ctx.moveTo(5, -10);

    ctx.quadraticCurveTo(
      1,
      -26,
      12,
      -30
    );
    ctx.quadraticCurveTo(
      22,
      -43,
      35,
      -36
    );
    ctx.quadraticCurveTo(
      39,
      -32,
      33,
      -28
    );
    ctx.quadraticCurveTo(
      26,
      -30,
      22,
      -23
    );
    ctx.quadraticCurveTo(
      14,
      -22,
      9,
      -13
    );
    ctx.closePath();
    ctx.fillStyle = '#E8C56A';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Hair highlight
    ctx.beginPath();
    ctx.moveTo(12, -29);
    ctx.quadraticCurveTo(
      22,
      -39,
      31,
      -34
    );
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = OUTLINE;
  }

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

  // Beak middle line
  ctx.beginPath();
  ctx.moveTo(28, -13);
  ctx.lineTo(38, -13);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Eye
  if (o.dead) {
    // Dead eye
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(18.5, -20.5);
    ctx.lineTo(25.5, -13.5);
    ctx.moveTo(25.5, -20.5);
    ctx.lineTo(18.5, -13.5);
    ctx.stroke();
  } else if (o.accessory === 'president') {
    const eyeR = o.scared ? 5.6 : 4.3;

    // White eye
    circle(
      ctx,
      22,
      -16,
      eyeR,
      '#fff',
      2
    );

    // Pupil
    circle(
      ctx,
      o.scared ? 22.5 : 23.2,
      -16,
      o.scared ? 1.5 : 2.2,
      '#111',
      0
    );

    // Eyebrow
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (o.scared) {
      ctx.moveTo(17, -22);
      ctx.lineTo(26, -25);
    } else {
      ctx.moveTo(17, -22.5);
      ctx.lineTo(27, -21);
    }
    ctx.stroke();
  } else if (
    o.accessory === 'bodyguard' ||
    o.shades
  ) {
    // Sunglasses
    ctx.fillStyle = '#111';
    ctx.fillRect(
      15,
      -21,
      14,
      7
    );
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, -18);
    ctx.lineTo(7, -16);
    ctx.stroke();

    // Reflection
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(
      17,
      -20,
      4,
      2
    );
  } else {

    // Normal eye
    circle(
      ctx,
      22,
      -17,
      4.3,
      '#fff',
      2
    );
    circle(
      ctx,
      23.2,
      -17,
      2.2,
      '#111',
      0
    );
  }

  // Glasses
  if (o.accessory === 'glasses' && !o.dead) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      22,
      -17,
      6.5,
      0,
      Math.PI * 2
    );
    ctx.moveTo(15.5, -17);
    ctx.lineTo(8, -15);
    ctx.stroke();
  }

  // Hats
  if (o.accessory === 'police') {
    // Police hat
    ctx.fillStyle = '#1f3a93';
    ctx.beginPath();
    ctx.moveTo(6, -24);
    ctx.lineTo(8, -33);
    ctx.quadraticCurveTo(
      18,
      -38,
      30,
      -33
    );
    ctx.lineTo(29, -24);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Hat band
    ctx.fillStyle = '#111';
    ctx.fillRect(
      14,
      -25,
      21,
      4
    );

    // Badge
    circle(
      ctx,
      18,
      -30,
      2.6,
      '#ffd23f',
      1.5
    );
  } else if (o.accessory === 'bodyguard') {
    ctx.strokeStyle = '#cfd3dc';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(9, -12);
    ctx.quadraticCurveTo(
      2,
      -4,
      6,
      4
    );
    ctx.stroke();
  }

  // Restore canvas
  ctx.restore();
}