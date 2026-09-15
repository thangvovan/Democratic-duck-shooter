import { QUESTIONS } from '../data/questions.js';
import { answerSlot } from '../data/answerHash.js';
import { shuffle } from '../utils/math.js';

// Pure question logic: draws questions without repeats within a session and tracks answers.
// The correct option is never kept in plain form; it is decoded from answerCode only when needed.
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
      order, // displayed position -> original option index
      answerCode: q.answerCode,
    };
  }

  // Displayed index of the correct option.
  correctIndex(q) {
    return q.order.indexOf(answerSlot(q.question, q.answerCode));
  }

  answer(question, optionIndex) {
    const isCorrect = optionIndex >= 0 && question.order[optionIndex] === answerSlot(question.question, question.answerCode);
    this.total++;
    if (isCorrect) this.correct++;
    else this.wrong++;
    return isCorrect;
  }
}
