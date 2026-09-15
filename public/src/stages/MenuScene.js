import { getBackground } from './backgrounds.js';
import { Duck } from '../entities/Duck.js';
import { PALETTES } from '../entities/duckArt.js';
import { W, GROUND_Y } from '../utils/draw.js';
import { rand, pick, removeWhere } from '../utils/math.js';

// Non-interactive animated backdrop behind the menus.
export class MenuScene {
  constructor(game) {
    this.game = game;
    this.ducks = [];
    this.time = 0;
    this.spawnTimer = 0.3;
  }

  update(dt) {
    this.time += dt;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.ducks.length < 3) {
      this.spawnTimer = rand(1.2, 2.5);
      this.ducks.push(
        new Duck({
          x: rand(120, W - 120),
          y: GROUND_Y + 40,
          speed: rand(90, 140),
          size: rand(44, 56),
          lifetime: rand(4, 7),
          palette: pick([PALETTES.yellow, PALETTES.white, PALETTES.mallard, PALETTES.president]),
          accessory: pick([null, 'glasses', 'police', 'bodyguard']),
        }),
      );
    }
    for (const duck of this.ducks) duck.update(dt);
    removeWhere(this.ducks, (d) => d.done);
  }

  render(ctx) {
    const bg = getBackground('range', this.game.dpr);
    bg.drawBack(ctx, this.time);
    for (const duck of this.ducks) duck.render(ctx);
    bg.drawFront(ctx, this.time);
  }
}
