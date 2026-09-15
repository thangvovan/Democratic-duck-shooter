import { BaseStage } from './BaseStage.js';
import { RULES } from '../data/rules.js';
import { removeWhere } from '../utils/math.js';

// Shared flow for question-driven stages:
// briefing -> intro -> [questions -> shooting -> outro] repeated until the stage timer runs out.
// The stage timer only runs during questions and shooting; shooting itself has no time limit.
export class WaveStage extends BaseStage {
  constructor(game, cfg) {
    super(game, cfg);
    this.cfg = cfg;
    this.wave = 0;
    this.ammo = 0;
    this.phase = 'briefing';
    this.timer = 0;
    this.stageTime = RULES.STAGE_TIME;
    this.waveKills = 0;
    this.ducks = [];
  }

  enter() {
    this.game.briefingUI.show({
      title: this.cfg.label,
      subtitle: this.cfg.tagline,
      lines: this.cfg.briefing,
      button: 'START STAGE',
      onContinue: () => this.startIntro(),
    });
  }

  startIntro() {
    this.phase = 'intro';
    this.timer = 1.6;
    this.game.effects.showMessage(this.cfg.label, { sub: this.cfg.tagline, duration: 1.6, size: 30 });
    this.game.audio.play('stageStart');
  }

  exit() {
    this.game.questionUI.cancel();
    this.game.briefingUI.hide();
    this.ducks.length = 0;
  }

  update(dt) {
    super.update(dt);
    for (const duck of this.ducks) duck.update(dt);
    removeWhere(this.ducks, (d) => d.done);

    if (this.phase === 'questions' || this.phase === 'shooting') {
      this.stageTime -= dt;
      if (this.stageTime <= 0) {
        this.stageTime = 0;
        this.timeUp();
        return;
      }
    }

    switch (this.phase) {
      case 'intro':
        this.timer -= dt;
        if (this.timer <= 0) this.beginQuestions();
        break;
      case 'questions':
        this.game.questionUI.update(dt);
        break;
      case 'shooting':
        if (this.updateShooting(dt)) this.endWave();
        break;
      case 'outro':
        this.timer -= dt;
        if (this.timer <= 0) {
          // Keep playing waves until the stage timer reaches exactly 0 (handled by timeUp).
          this.beginQuestions();
        }
        break;
      case 'timeup':
        this.timer -= dt;
        if (this.timer <= 0) this.finishStage();
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
      subtitle: `WAVE ${this.wave}`,
      questions: questionSystem.draw(this.cfg.pool, this.cfg.questionsPerWave),
      wrongText: this.cfg.wrongText,
      getRewards: () => this.getRewards(),
      getStageTime: () => this.stageTime,
      getCorrectIndex: (question) => questionSystem.correctIndex(question),
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
    this.game.changeState(this.cfg.shootingState);
    this.onShootingStart();
  }

  endWave() {
    this.phase = 'outro';
    this.timer = 0.6; // go back to the questions almost immediately
    if (this.cfg.ducksLeave !== false) for (const duck of this.ducks) if (duck.alive) duck.leave();
    this.game.effects.showMessage(this.ammo === 0 ? 'OUT OF AMMO!' : 'WAVE OVER', {
      sub: `HITS THIS WAVE: ${this.waveKills}`,
      color: '#5ee7ff',
      duration: 0.8,
    });
    this.onWaveEnd();
  }

  timeUp() {
    this.game.questionUI.cancel();
    this.phase = 'timeup';
    this.timer = 2.4;
    if (this.cfg.ducksLeave !== false) for (const duck of this.ducks) if (duck.alive) duck.leave();
    this.onTimeUp();
  }

  finishStage() {
    this.phase = 'over';
    this.onStageFinished();
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
    return { label: this.cfg.label, ammo: this.ammo, ammoSlots: this.cfg.questionsPerWave, stageTime: this.stageTime };
  }

  // Hooks for subclasses
  onWaveStart() {}
  onWrongAnswer() {}
  onShootingStart() {}
  onWaveEnd() {}
  updateShooting() {
    return false;
  }
  onTimeUp() {
    this.game.effects.showMessage("TIME'S UP!", { sub: 'STAGE OVER', color: '#ff5a5a', duration: 2.2 });
    this.game.audio.play('wrong');
  }
  onStageFinished() {
    this.game.completeStage();
  }
}
