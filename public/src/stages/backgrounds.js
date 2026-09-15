// 2D cartoon backgrounds. Static parts are pre-rendered once per (kind, dpr) into offscreen
// canvases; only small animated details (clouds, police lights) are drawn every frame.
import { W, H, GROUND_Y, FONT, drawText } from '../utils/draw.js';

const OUT = '#1a1030';

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function sky(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function cloud(ctx, x, y, s, color = 'rgba(255,255,255,0.9)') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 26 * s, y - 12 * s, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 56 * s, y, 22 * s, 0, Math.PI * 2);
  ctx.rect(x, y - 4 * s, 56 * s, 26 * s);
  ctx.fill();
}

function drawClouds(ctx, t, color) {
  const clouds = [
    [100, 80, 1, 12],
    [420, 60, 0.8, 8],
    [700, 110, 1.2, 15],
    [260, 140, 0.6, 6],
  ];
  for (const [x, y, s, speed] of clouds) {
    const cx = ((x + t * speed) % (W + 200)) - 100;
    cloud(ctx, cx, y, s, color);
  }
}

function bushes(ctx, y, colorA, colorB) {
  ctx.fillStyle = colorA;
  ctx.fillRect(0, y + 18, W, H - y);
  for (let x = -20; x < W + 40; x += 58) {
    ctx.fillStyle = (x / 58) % 2 === 0 ? colorA : colorB;
    ctx.beginPath();
    ctx.arc(x, y + 26, 40, Math.PI, 0);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUT;
    ctx.stroke();
  }
  ctx.fillStyle = colorA;
  ctx.fillRect(0, y + 26, W, H - y);
}

function tree(ctx, x, y) {
  ctx.fillStyle = '#7a4b2a';
  ctx.fillRect(x - 10, y - 70, 20, 70);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 10, y - 70, 20, 70);
  ctx.fillStyle = '#3f9e4d';
  ctx.beginPath();
  ctx.arc(x, y - 100, 48, 0, Math.PI * 2);
  ctx.arc(x - 34, y - 78, 32, 0, Math.PI * 2);
  ctx.arc(x + 34, y - 78, 32, 0, Math.PI * 2);
  ctx.fill();
}

function flag(ctx, x, y, h) {
  ctx.fillStyle = '#d9d9d9';
  ctx.fillRect(x - 3, y - h, 6, h);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#d62839' : '#ffffff';
    ctx.fillRect(x + 3, y - h + 4 + i * 6, 64, 6);
  }
  ctx.fillStyle = '#1c2f6b';
  ctx.fillRect(x + 3, y - h + 4, 26, 24);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y - h + 4, 64, 42);
}

function sign(ctx, x, y, w, h, text, bg = '#ffd23f', color = '#1a1030', size = 14) {
  ctx.fillStyle = bg;
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
  ctx.fill();
  ctx.stroke();
  drawText(ctx, text, x, y + 1, { size, color, stroke: null });
}

const PAINTERS = {
  range: {
    back(ctx) {
      ctx.fillStyle = '#7a4a2a';
      ctx.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 48) {
        ctx.fillStyle = x % 96 === 0 ? '#84522f' : '#6f4226';
        ctx.fillRect(x, 0, 48, GROUND_Y);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, 0, 3, GROUND_Y);
      }
      // Awning
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#e63946' : '#ffffff';
        ctx.fillRect(i * 60, 0, 60, 46);
        ctx.beginPath();
        ctx.arc(i * 60 + 30, 46, 30, 0, Math.PI);
        ctx.fill();
      }
      sign(ctx, W / 2, 118, 380, 50, 'SHOOTING RANGE', '#ffd23f', OUT, 18);
      // Targets
      for (const tx of [200, 480, 760]) {
        ctx.fillStyle = '#4a2c18';
        ctx.fillRect(tx - 5, 300, 10, GROUND_Y - 300);
        for (let r = 4; r > 0; r--) {
          ctx.fillStyle = r % 2 === 0 ? '#ffffff' : '#e63946';
          ctx.beginPath();
          ctx.arc(tx, 280, r * 12, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = OUT;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tx, 280, 48, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Curtains
      for (const side of [0, 1]) {
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#9d1c2c' : '#b8243a';
          const x = side === 0 ? i * 18 : W - (i + 1) * 18;
          ctx.fillRect(x, 0, 18, GROUND_Y + 20);
        }
      }
    },
    front(ctx) {
      ctx.fillStyle = '#5a3620';
      ctx.fillRect(0, GROUND_Y + 10, W, H - GROUND_Y);
      ctx.fillStyle = '#8a5a34';
      ctx.fillRect(0, GROUND_Y + 4, W, 16);
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 4;
      ctx.strokeRect(-4, GROUND_Y + 4, W + 8, 16);
      for (let x = 30; x < W; x += 120) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x, GROUND_Y + 30, 60, 8);
      }
    },
    animate() {},
  },

  school: {
    back(ctx) {
      sky(ctx, '#58b8ff', '#c9f0ff');
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(850, 88, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7fd06b';
      ctx.beginPath();
      ctx.ellipse(200, GROUND_Y, 360, 90, 0, Math.PI, 0);
      ctx.ellipse(780, GROUND_Y, 380, 110, 0, Math.PI, 0);
      ctx.fill();

      tree(ctx, 90, GROUND_Y);
      tree(ctx, 880, GROUND_Y);

      // Building
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 4;
      ctx.fillStyle = '#c2553d';
      ctx.fillRect(240, 210, 480, GROUND_Y - 210);
      ctx.strokeRect(240, 210, 480, GROUND_Y - 210);
      ctx.fillStyle = '#f1e3c6';
      ctx.fillRect(228, 196, 504, 18);
      ctx.strokeRect(228, 196, 504, 18);
      // Tower
      ctx.fillStyle = '#b44a34';
      ctx.fillRect(425, 120, 110, 80);
      ctx.strokeRect(425, 120, 110, 80);
      ctx.fillStyle = '#6b2a1f';
      ctx.beginPath();
      ctx.moveTo(412, 122);
      ctx.lineTo(480, 60);
      ctx.lineTo(548, 122);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(480, 160, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(480, 160);
      ctx.lineTo(480, 143);
      ctx.moveTo(480, 160);
      ctx.lineTo(492, 166);
      ctx.stroke();
      // Windows
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 6; col++) {
          if (row === 1 && (col === 2 || col === 3)) continue;
          const x = 268 + col * 76;
          const y = 236 + row * 90;
          ctx.fillStyle = '#9fe3ff';
          ctx.fillRect(x, y, 46, 52);
          ctx.strokeRect(x, y, 46, 52);
          ctx.beginPath();
          ctx.moveTo(x + 23, y);
          ctx.lineTo(x + 23, y + 52);
          ctx.moveTo(x, y + 26);
          ctx.lineTo(x + 46, y + 26);
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.lineWidth = 4;
        }
      }
      // Door + sign
      ctx.fillStyle = '#5b3a29';
      ctx.fillRect(440, 350, 80, GROUND_Y - 350);
      ctx.strokeRect(440, 350, 80, GROUND_Y - 350);
      sign(ctx, 480, 318, 150, 32, 'SCHOOL', '#ffd23f', OUT, 14);
      flag(ctx, 180, GROUND_Y, 170);

      ctx.fillStyle = '#5cb848';
      ctx.fillRect(0, GROUND_Y - 6, W, H);
      ctx.fillStyle = '#d8d0c0';
      ctx.fillRect(0, GROUND_Y + 4, W, 14);
    },
    front(ctx) {
      bushes(ctx, GROUND_Y + 6, '#2f8f3a', '#3aa847');
    },
    animate(ctx, t) {
      drawClouds(ctx, t);
    },
  },

  police: {
    back(ctx) {
      sky(ctx, '#2b2160', '#ff8a5b');
      const r = seeded(42);
      let x = 0;
      while (x < W) {
        const w = 60 + r() * 70;
        const h = 120 + r() * 190;
        ctx.fillStyle = r() < 0.5 ? '#2a2350' : '#352c63';
        ctx.fillRect(x, GROUND_Y - h, w, h);
        ctx.fillStyle = '#ffd86b';
        for (let wy = GROUND_Y - h + 14; wy < GROUND_Y - 40; wy += 26) {
          for (let wx = x + 10; wx < x + w - 14; wx += 20) {
            if (r() < 0.45) ctx.fillRect(wx, wy, 9, 13);
          }
        }
        x += w + 4;
      }
      // Street
      ctx.fillStyle = '#9a96a8';
      ctx.fillRect(0, GROUND_Y - 28, W, 18);
      ctx.fillStyle = '#3a3a44';
      ctx.fillRect(0, GROUND_Y - 10, W, H);
      ctx.fillStyle = '#f2f2f2';
      for (let lx = 20; lx < W; lx += 110) ctx.fillRect(lx, GROUND_Y + 40, 60, 8);

      // Police car
      const cx = 700;
      const cy = GROUND_Y - 6;
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(cx - 120, cy - 60, 240, 50, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1f3a93';
      ctx.beginPath();
      ctx.roundRect(cx - 70, cy - 104, 140, 48, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#9fe3ff';
      ctx.fillRect(cx - 58, cy - 96, 52, 34);
      ctx.fillRect(cx + 6, cy - 96, 52, 34);
      ctx.fillStyle = '#1f3a93';
      ctx.fillRect(cx - 120, cy - 42, 240, 12);
      drawText(ctx, 'POLICE', cx, cy - 22, { size: 12, color: '#1f3a93', stroke: null });
      for (const wx of [cx - 70, cx + 70]) {
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(wx, cy - 8, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.arc(wx, cy - 8, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    front(ctx) {
      // Barricades
      for (const bx of [60, W - 200]) {
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(bx + 10, GROUND_Y + 10, 10, 60);
        ctx.fillRect(bx + 120, GROUND_Y + 10, 10, 60);
        for (let i = 0; i < 7; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#ff7b00' : '#ffffff';
          ctx.fillRect(bx + i * 20, GROUND_Y + 14, 20, 22);
        }
        ctx.strokeStyle = OUT;
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, GROUND_Y + 14, 140, 22);
      }
      // Tape
      ctx.save();
      ctx.translate(W / 2, GROUND_Y + 84);
      ctx.rotate(-0.03);
      ctx.fillStyle = '#ffd400';
      ctx.fillRect(-W, -16, W * 2, 32);
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 3;
      ctx.strokeRect(-W, -16, W * 2, 32);
      ctx.font = `12px ${FONT}`;
      ctx.fillStyle = OUT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = -2; i <= 2; i++) ctx.fillText('POLICE LINE - DO NOT CROSS', i * 330, 1);
      ctx.restore();
    },
    animate(ctx, t) {
      const on = Math.floor(t * 5) % 2 === 0;
      const cx = 700;
      const cy = GROUND_Y - 110;
      ctx.save();
      ctx.fillStyle = on ? '#ff2d2d' : '#5a1010';
      ctx.fillRect(cx - 40, cy - 6, 38, 14);
      ctx.fillStyle = on ? '#1a1a4a' : '#2d6bff';
      ctx.fillRect(cx + 2, cy - 6, 38, 14);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = on ? '#ff2d2d' : '#2d6bff';
      ctx.beginPath();
      ctx.arc(on ? cx - 20 : cx + 20, cy, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },

  government: {
    back(ctx) {
      sky(ctx, '#7cc8ff', '#e6f7ff');
      ctx.fillStyle = '#6fc25a';
      ctx.fillRect(0, GROUND_Y - 30, W, H);

      ctx.strokeStyle = OUT;
      ctx.lineWidth = 4;
      // Dome
      ctx.fillStyle = '#f4f1e8';
      ctx.fillRect(400, 150, 160, 50);
      ctx.strokeRect(400, 150, 160, 50);
      ctx.beginPath();
      ctx.arc(480, 152, 72, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(474, 56, 12, 26);
      ctx.strokeRect(474, 56, 12, 26);
      // Main building
      ctx.fillRect(170, 250, 620, GROUND_Y - 250);
      ctx.strokeRect(170, 250, 620, GROUND_Y - 250);
      ctx.beginPath();
      ctx.moveTo(300, 252);
      ctx.lineTo(480, 196);
      ctx.lineTo(660, 252);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawText(ctx, 'DUCK HOUSE', 480, 234, { size: 11, color: OUT, stroke: null });
      for (let i = 0; i < 9; i++) {
        const x = 200 + i * 70;
        ctx.fillStyle = '#e4dfd1';
        ctx.fillRect(x, 262, 20, GROUND_Y - 272);
        ctx.strokeRect(x, 262, 20, GROUND_Y - 272);
      }
      // Steps
      ctx.fillStyle = '#d8d2c2';
      ctx.fillRect(150, GROUND_Y - 12, 660, 12);
      ctx.strokeRect(150, GROUND_Y - 12, 660, 12);

      flag(ctx, 70, GROUND_Y - 10, 200);
      flag(ctx, 840, GROUND_Y - 10, 200);

      // Red carpet
      ctx.fillStyle = '#c1121f';
      ctx.beginPath();
      ctx.moveTo(420, GROUND_Y);
      ctx.lineTo(540, GROUND_Y);
      ctx.lineTo(600, H);
      ctx.lineTo(360, H);
      ctx.closePath();
      ctx.fill();
    },
    front(ctx) {
      bushes(ctx, GROUND_Y + 14, '#2f7f3a', '#3a9847');
      // Velvet ropes
      for (const [x1, x2] of [
        [40, 300],
        [660, 920],
      ]) {
        ctx.strokeStyle = '#a4161a';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(x1, GROUND_Y + 40);
        ctx.quadraticCurveTo((x1 + x2) / 2, GROUND_Y + 80, x2, GROUND_Y + 40);
        ctx.stroke();
        for (const x of [x1, x2]) {
          ctx.fillStyle = '#e0b43a';
          ctx.fillRect(x - 6, GROUND_Y + 30, 12, 80);
          ctx.beginPath();
          ctx.arc(x, GROUND_Y + 28, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = OUT;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    },
    animate(ctx, t) {
      drawClouds(ctx, t);
    },
  },
};

// Podium drawn by stage 3 in front of the president while he hides behind it.
export function drawPodium(ctx) {
  const x = W / 2;
  const y = 336;
  ctx.save();
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 4;
  ctx.fillStyle = '#6b3f23';
  ctx.beginPath();
  ctx.moveTo(x - 62, y);
  ctx.lineTo(x + 62, y);
  ctx.lineTo(x + 48, GROUND_Y + 4);
  ctx.lineTo(x - 48, GROUND_Y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a5530';
  ctx.fillRect(x - 72, y - 12, 144, 16);
  ctx.strokeRect(x - 72, y - 12, 144, 16);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(x, y + 42, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawText(ctx, 'P', x, y + 43, { size: 16, color: OUT, stroke: null });
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 12);
  ctx.lineTo(x - 22, y - 42);
  ctx.moveTo(x + 14, y - 12);
  ctx.lineTo(x + 22, y - 42);
  ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.fillRect(x - 27, y - 48, 10, 8);
  ctx.fillRect(x + 17, y - 48, 10, 8);
  ctx.restore();
}

const cache = new Map();

function layer(dpr, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  paint(ctx);
  return canvas;
}

export function getBackground(kind, dpr) {
  const key = `${kind}@${dpr}`;
  let bg = cache.get(key);
  if (bg) return bg;
  const painter = PAINTERS[kind];
  const back = layer(dpr, painter.back);
  const front = layer(dpr, painter.front);
  bg = {
    drawBack(ctx, t) {
      ctx.drawImage(back, 0, 0, W, H);
      painter.animate(ctx, t);
    },
    drawFront(ctx) {
      ctx.drawImage(front, 0, 0, W, H);
    },
  };
  cache.set(key, bg);
  return bg;
}

export function clearBackgroundCache() {
  cache.clear();
}
