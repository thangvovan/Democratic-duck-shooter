import { ArmedDuck } from './ArmedDuck.js';
import { PALETTES } from './duckArt.js';

// Stage 2 enemy: a duck cop that shoots back.
export class PoliceDuck extends ArmedDuck {
  constructor(o = {}) {
    super({ ...o, type: 'policeDuck', accessory: 'police', palette: PALETTES.police, lifetime: Infinity });
  }
}
