import { BaseStage } from './BaseStage.js';
import { RULES } from '../data/rules.js';
import { removeWhere } from '../utils/math.js';

// Shared flow for question-driven stages:
// intro -> [questions -> shooting -> outro] x waves -> next stage
export class WaveStage extends BaseStage {
  constructor(game, cfg) {
    super(game, cfg);
    this.cfg = cfg;
    this.wave = 0;
    this.ammo = 0;
    this.phase = 'intro';
    this.timer = 0;
    this.waveTimer = 0;
    this.waveKills = 0;
    this.ducks = [];
  }

  enter() {
    this.phase = 'intro';
    this.timer = 2.1;
    this.game.effects.showMessage(this.cfg.label, { sub: this.cfg.tagline, duration: 2.1, size: 30 });
    this.game.audio.play('stageStart');
  }

  exit() {
    this.game.questionUI.cancel();
    this.ducks.length = 0;
  }

  update(dt) {
    super.update(dt);
    for (const duck of this.ducks) duck.update(dt);
    removeWhere(this.ducks, (d) => d.done);

    switch (this.phase) {
      case 'intro':
        this.timer -= dt;
        if (this.timer <= 0) this.beginQuestions();
        break;
      case 'questions':
        this.game.questionUI.update(dt);
        break;
      case 'shooting':
        this.waveTimer -= dt;
        if (this.updateShooting(dt)) this.endWave();
        break;
      case 'outro':
        this.timer -= dt;
        if (this.timer <= 0) {
          if (this.wave < this.cfg.waves) this.beginQuestions();
          else this.game.completeStage();
        }
        break;
    }
  }

  beginQuestions() {
    this.wave++;
    this.phase = 'questions';
    this.ammo = 0;
    this.waveKills = 0;
    this.onWaveStart();
    this.game.changeState(this.cfg.questionState);

    const { questions: questionSystem, questionUI } = this.game;
    questionUI.start({
      title: this.cfg.label,
      subtitle: `WAVE ${this.wave}/${this.cfg.waves}`,
      questions: questionSystem.draw(this.cfg.pool, RULES.QUESTIONS_PER_WAVE),
      wrongText: this.cfg.wrongText,
      getRewards: () => this.getRewards(),
      onAnswer: (question, index) => {
        const correct = questionSystem.answer(question, index);
        if (correct) this.ammo++;
        else this.onWrongAnswer();
        return correct;
      },
      onComplete: () => this.beginShooting(),
    });
  }

  beginShooting() {
    this.phase = 'shooting';
    this.waveTimer = this.cfg.waveTime;
    this.game.changeState(this.cfg.shootingState);
    this.onShootingStart();
  }

  endWave() {
    this.phase = 'outro';
    this.timer = 1.9;
    for (const duck of this.ducks) if (duck.alive) duck.leave();
    this.game.effects.showMessage(this.wave < this.cfg.waves ? 'WAVE OVER' : 'STAGE CLEAR!', {
      sub: `DUCKS SHOT: ${this.waveKills}`,
      color: '#5ee7ff',
      duration: 1.8,
    });
    this.onWaveEnd();
  }

  canShoot() {
    return this.phase === 'shooting';
  }

  hasAmmo() {
    return this.ammo > 0;
  }

  consumeAmmo() {
    this.ammo--;
  }

  renderEntities(ctx) {
    for (const duck of this.ducks) duck.render(ctx);
  }

  getRewards() {
    return { ammo: this.ammo };
  }

  getHud() {
    return {
      label: this.cfg.label,
      ammo: this.ammo,
      timer: this.phase === 'shooting' ? Math.max(0, this.waveTimer) : null,
    };
  }

  // Hooks for subclasses
  onWaveStart() {}
  onWrongAnswer() {}
  onShootingStart() {}
  onWaveEnd() {}
  updateShooting() {
    return false;
  }
}
