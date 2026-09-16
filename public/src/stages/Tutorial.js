import { BaseStage } from './BaseStage.js';
import { Duck } from '../entities/Duck.js';
import { HOW_TO_PLAY, TUTORIAL_DONE } from '../data/slides.js';
import { W, GROUND_Y, drawText } from '../utils/draw.js';
import { setTutorialCompleted } from '../utils/storage.js';

// One-time tutorial: how-to-play panel first, then a single slow duck to shoot.
export class Tutorial extends BaseStage {
  constructor(game) {
    super(game, { label: 'TUTORIAL', background: 'range' });
    this.countsStats = false;
    this.phase = 'briefing';
    this.timer = 0;
    this.duck = null;
    this.tutorialScore = 0;
  }

  enter() {
    this.game.briefingUI.show({
      title: 'HOW TO PLAY',
      subtitle: 'TUTORIAL',
      slides: HOW_TO_PLAY,
      button: 'START TUTORIAL',
      onContinue: () => this.begin(),
    });
  }

  begin() {
    this.phase = 'intro';
    this.timer = 1.2;
    this.game.effects.showMessage('TUTORIAL', { sub: 'WELCOME TO THE SHOOTING RANGE', duration: 1.3 });
  }

  exit() {
    this.game.briefingUI.hide();
  }

  update(dt) {
    super.update(dt);
    this.duck?.update(dt);

    if (this.phase === 'intro') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.duck = new Duck({
          x: W / 2,
          y: GROUND_Y + 40,
          size: 66,
          speed: 85,
          lifetime: Infinity,
          turnRate: 1.5,
          bounds: { left: 300, right: W - 300, top: 170, bottom: 320 },
        });
        this.phase = 'shoot';
      }
    } else if (this.phase === 'hit') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.phase = 'done';
        this.game.briefingUI.show({
          title: 'TUTORIAL DONE',
          slides: TUTORIAL_DONE,
          button: 'START GAME',
          onContinue: () => this.game.startRun(),
        });
      }
    }
  }

  canShoot() {
    return this.phase === 'shoot';
  }

  hasAmmo() {
    return true;
  }

  onShoot(x, y) {
    const { effects, jokes } = this.game;
    if (this.duck?.hitTest(x, y, this.pad)) {
      this.duck.kill();
      this.tutorialScore += 100;
      effects.addPopup(this.duck.x, this.duck.y - 30, '+100', { size: 22 });
      effects.addFeathers(this.duck.x, this.duck.y, this.duck.palette.body, 16);
      jokes.tell();
      effects.showMessage('GOOD SHOT!', { sub: 'EVERY DUCK = POINTS', duration: 1.8 });
      setTutorialCompleted();
      this.phase = 'hit';
      this.timer = 1.8;
      return { hit: true };
    }
    effects.addPopup(x, y, 'MISSED! TRY AGAIN', { color: '#ffffff', size: 12, life: 0.8 });
    return { hit: false, neutral: true };
  }

  renderEntities(ctx) {
    this.duck?.render(ctx);
  }

  renderOverlay(ctx) {
    if (this.phase !== 'shoot' || !this.duck) return;
    if (Math.floor(this.time * 2.5) % 2 === 0) {
      drawText(ctx, 'CLICK TO SHOOT', W / 2, 80, { size: 26, color: '#ffd23f' });
    }
    const bob = Math.sin(this.time * 6) * 6;
    const { x, y, size } = this.duck;
    drawText(ctx, 'TARGET', x, y - size - 34 + bob, { size: 12, color: '#ff5a5a' });
    ctx.save();
    ctx.fillStyle = '#ff5a5a';
    ctx.strokeStyle = '#1a1030';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - size - 20 + bob);
    ctx.lineTo(x + 12, y - size - 20 + bob);
    ctx.lineTo(x, y - size - 4 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  getHud() {
    return { label: this.label, ammoInfinite: true, score: this.tutorialScore };
  }
}
