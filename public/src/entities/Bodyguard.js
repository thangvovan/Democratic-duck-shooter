import { ArmedDuck } from './ArmedDuck.js';
import { PALETTES } from './duckArt.js';
import { W, GROUND_Y } from '../utils/draw.js';

// Stage 3 bodyguard: bigger, slower armed duck in a black suit that patrols near the president.
export class Bodyguard extends ArmedDuck {
  constructor(o = {}) {
    super({
      size: 60,
      speed: 125,
      turnRate: 2.4,
      lifetime: Infinity,
      bounds: { left: 90, right: W - 90, top: 170, bottom: GROUND_Y - 50 },
      ...o,
      type: 'bodyguard',
      accessory: 'bodyguard',
      palette: PALETTES.bodyguard,
    });
  }
}
