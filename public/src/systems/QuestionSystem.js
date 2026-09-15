import { QUESTIONS } from '../data/questions.js';
import { shuffle } from '../utils/math.js';

// Pure question logic: draws questions without repeats within a session and tracks answers.
export class QuestionSystem {
  constructor(pools = QUESTIONS) {
    this.pools = pools;
    this.reset();
  }

  reset() {
    this.used = {};
    this.total = 0;
    this.correct = 0;
    this.wrong = 0;
  }

  draw(poolKey, count) {
    const pool = this.pools[poolKey];
    if (!pool) throw new Error(`Unknown question pool: ${poolKey}`);
    const used = (this.used[poolKey] ||= new Set());

    let available = pool.map((_, i) => i).filter((i) => !used.has(i));
    if (available.length < count) {
      // Pool exhausted: allow repeats again, but still avoid repeats inside this draw.
      used.clear();
      available = pool.map((_, i) => i);
    }

    return shuffle(available)
      .slice(0, count)
      .map((index) => {
        used.add(index);
        return this.prepare(pool[index]);
      });
  }

  prepare(q) {
    const order = shuffle(q.options.map((_, i) => i));
    return {
      question: q.question,
      options: order.map((i) => q.options[i]),
      correctAnswer: order.indexOf(q.correctAnswer),
    };
  }

  answer(question, optionIndex) {
    const isCorrect = optionIndex === question.correctAnswer;
    this.total++;
    if (isCorrect) this.correct++;
    else this.wrong++;
    return isCorrect;
  }
}
