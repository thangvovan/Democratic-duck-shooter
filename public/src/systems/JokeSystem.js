import { JOKES } from '../data/jokes.js';
import { shuffle } from '../utils/math.js';
import { W, H } from '../utils/draw.js';

// The shooter says a joke every time he hits a duck. Jokes come from a shuffled bag so all 20
// rotate and the same line never repeats back-to-back.
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

  tell() {
    const text = this.next();
    // Beside the shooter (to his right), low on the screen so it doesn't block the view.
    this.effects.addBubble(W / 2 + 95, H - 50, text, { speaker: 'player' });
    return text;
  }
}
