import { pointsFor } from '../data/rules.js';

export class ScoreSystem {
  constructor(effects) {
    this.effects = effects;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.displayScore = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.ducksShot = 0;
    this.bodyguardsShot = 0;
    this.presidentDefeated = false;
    this.bulletsFired = 0;
    this.shields = 0; // times President Duck's shield came back
  }

  registerShot() {
    this.bulletsFired++;
  }

  // type: 'duck' | 'policeDuck' | 'bodyguard' | 'president'
  registerKill(type, x, y) {
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const points = pointsFor(type, this.streak);
    this.score += points;

    if (type === 'duck' || type === 'policeDuck') this.ducksShot++;
    else if (type === 'bodyguard') this.bodyguardsShot++;
    else if (type === 'president') this.presidentDefeated = true;

    this.effects.addPopup(x, y - 30, `+${points}`, { size: type === 'president' ? 28 : 18 });
    if (this.streak >= 3) {
      this.effects.addPopup(x, y - 58, `COMBO x${this.streak}`, {
        color: this.streak >= 5 ? '#ff5da2' : '#5ee7ff',
        size: 14,
        life: 1.1,
      });
    }
    return points;
  }

  registerMiss() {
    this.streak = 0;
  }

  update(dt) {
    if (this.displayScore < this.score) {
      this.displayScore = Math.min(this.score, this.displayScore + Math.max(10, (this.score - this.displayScore) * 8) * dt);
    } else {
      this.displayScore = this.score;
    }
  }

  getStats() {
    return {
      ducksShot: this.ducksShot,
      bodyguardsShot: this.bodyguardsShot,
      presidentDefeated: this.presidentDefeated,
      bulletsFired: this.bulletsFired,
      shields: this.shields,
      bestStreak: this.bestStreak,
    };
  }
}
