import { JOKES } from '../data/jokes.js';
import { shuffle } from '../utils/math.js';
import { W, GROUND_Y } from '../utils/draw.js';

// Picks jokes from a shuffled bag so all 20 rotate and the same line never repeats back-to-back.
export class JokeSystem {
  constructor(effects, jokes = JOKES) {
    this.effects = effects;
    this.jokes = jokes;
    this.bag = [];
    this.last = null;
  }

  next() {
    if (this.bag.length === 0) {
      this.bag = shuffle([...this.jokes]);
      const top = this.bag.length - 1;
      if (this.bag[top] === this.last && top > 0) [this.bag[0], this.bag[top]] = [this.bag[top], this.bag[0]];
    }
    this.last = this.bag.pop();
    return this.last;
  }

  // Randomly the hit duck or the shooter says the joke.
  tell(x, y) {
    const text = this.next();
    if (Math.random() < 0.5) {
      this.effects.addBubble(x, y, text, { speaker: 'duck' });
    } else {
      this.effects.addBubble(W / 2, GROUND_Y + 20, text, { speaker: 'player' });
    }
    return text;
  }
}
