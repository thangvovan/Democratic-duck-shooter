import { BaseStage } from './BaseStage.js';
import { drawPodium } from './backgrounds.js';
import { RULES } from '../data/rules.js';
import { Bodyguard } from '../entities/Bodyguard.js';
import { PresidentDuck, PODIUM } from '../entities/PresidentDuck.js';
import { W } from '../utils/draw.js';
import { rand, removeWhere } from '../utils/math.js';

// STAGE 3 — PRESIDENT: clear 3 bodyguards, then hit the fleeing boss before missing 3 times.
export class Stage3 extends BaseStage {
  constructor(game) {
    super(game, { label: 'STAGE 3 — PRESIDENT', background: 'government' });
    this.president = new PresidentDuck();
    this.guards = [];
    this.phase = 'arrive';
    this.timer = 0;
    this.misses = 0;
    this.bossTimer = 0;
    this.speedFactor = 1;
    this.called = false;
  }

  enter() {
    const { effects, audio } = this.game;
    effects.showMessage(this.label, { sub: 'BOSS FIGHT', duration: 2.2, size: 30 });
    audio.play('bossSpawn');
    this.startCycle();
  }

  exit() {
    this.guards.length = 0;
  }

  startCycle() {
    this.phase = 'arrive';
    this.timer = 0;
    this.called = false;
    this.president.arrive();
  }

  spawnGuards() {
    this.phase = 'guards';
    this.president.hide();
    const n = RULES.BODYGUARDS_PER_CYCLE;
    for (let i = 0; i < n; i++) {
      const fromLeft = i % 2 === 0;
      this.guards.push(
        new Bodyguard({
          x: fromLeft ? -70 : W + 70,
          y: rand(220, 360),
          angle: fromLeft ? 0 : Math.PI,
        }),
      );
    }
  }

  startBossRun() {
    this.phase = 'boss';
    this.misses = 0;
    this.bossTimer = 12;
    this.president.becomeTarget(this.speedFactor);
    this.game.effects.showMessage('SHOOT THE PRESIDENT!', {
      sub: `${RULES.BOSS_MAX_MISSES} MISSES AND HE ESCAPES`,
      duration: 1.5,
      size: 26,
    });
    this.game.audio.play('stageStart');
  }

  escape() {
    const { effects, audio, score } = this.game;
    this.president.escape();
    score.escapes++;
    audio.play('bossEscape');
    const final = score.escapes >= RULES.BOSS_MAX_ESCAPES;
    effects.showMessage('THE PRESIDENT HAS ESCAPED!', {
      sub: final ? 'HE IS GONE FOR GOOD...' : `ESCAPES: ${score.escapes}/${RULES.BOSS_MAX_ESCAPES}`,
      color: '#ff5a5a',
      duration: 2.6,
      size: 24,
    });
    this.phase = final ? 'failed' : 'escaped';
    this.timer = 2.8;
    this.speedFactor = Math.max(0.7, this.speedFactor * 0.9);
  }

  update(dt) {
    super.update(dt);
    const { effects } = this.game;
    this.president.update(dt);
    for (const guard of this.guards) guard.update(dt);
    removeWhere(this.guards, (g) => g.done);

    switch (this.phase) {
      case 'arrive':
        if (this.president.state === 'podium') {
          this.timer += dt;
          if (!this.called) {
            this.called = true;
            effects.addBubble(PODIUM.x, PODIUM.y - 30, 'PROTECT THE PRESIDENT!', { speaker: 'duck', life: 2 });
            this.game.audio.play('quack');
          }
          if (this.timer > 1.2) this.spawnGuards();
        }
        break;
      case 'guards':
        if (this.guards.every((g) => !g.alive)) {
          this.timer += dt;
          if (this.timer > 1.4) this.startBossRun();
        } else {
          this.timer = 0;
        }
        break;
      case 'boss':
        this.bossTimer -= dt;
        if (this.bossTimer <= 0) this.escape();
        break;
      case 'escaped':
        this.timer -= dt;
        if (this.timer <= 0 && this.president.state === 'gone') this.startCycle();
        break;
      case 'failed':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.phase = 'over';
          this.game.finishGame('escaped');
        }
        break;
      case 'defeated':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.phase = 'over';
          this.game.finishGame('victory');
        }
        break;
    }
  }

  canShoot() {
    return this.phase === 'guards' || this.phase === 'boss';
  }

  hasAmmo() {
    return true;
  }

  onShoot(x, y) {
    const { score, jokes, effects, audio } = this.game;

    if (this.phase === 'guards') {
      for (let i = this.guards.length - 1; i >= 0; i--) {
        const guard = this.guards[i];
        if (!guard.hitTest(x, y)) continue;
        guard.kill();
        score.registerKill('bodyguard', guard.x, guard.y);
        effects.addFeathers(guard.x, guard.y, '#3a3a44', 14);
        jokes.tell(guard.x, guard.y);
        return { hit: true };
      }
      if (this.president.hitTest(x, y)) {
        effects.addPopup(x, y - 20, 'PROTECTED!', { color: '#5ee7ff', size: 14 });
        audio.play('block');
      }
      return { hit: false };
    }

    if (this.phase === 'boss') {
      if (this.president.vulnerable && this.president.hitTest(x, y)) {
        const { x: px, y: py } = this.president;
        this.president.defeat();
        score.registerKill('president', px, py);
        effects.addStars(px, py, 14);
        effects.addFeathers(px, py, '#1c2f6b', 20);
        effects.addShake(12);
        jokes.tell(px, py);
        effects.showMessage('PRESIDENT DUCK DEFEATED!', { sub: 'FREEDOM WINS... APPARENTLY', duration: 3, size: 26 });
        audio.play('victory');
        this.phase = 'defeated';
        this.timer = 3.3;
        return { hit: true };
      }
      this.misses++;
      effects.addPopup(this.president.x, this.president.y - 60, `MISS ${this.misses}/${RULES.BOSS_MAX_MISSES}`, {
        color: '#ff5a5a',
        size: 14,
      });
      if (this.misses >= RULES.BOSS_MAX_MISSES) this.escape();
      return { hit: false };
    }

    return { hit: false };
  }

  renderEntities(ctx) {
    if (this.president.atPodium) {
      this.president.render(ctx);
      drawPodium(ctx);
    } else {
      drawPodium(ctx);
    }
    for (const guard of this.guards) guard.render(ctx);
    if (!this.president.atPodium) this.president.render(ctx);
  }

  getHud() {
    const { score } = this.game;
    return {
      label: this.label,
      ammoInfinite: true,
      misses: this.phase === 'boss' ? this.misses : null,
      maxMisses: RULES.BOSS_MAX_MISSES,
      escapes: score.escapes,
      maxEscapes: RULES.BOSS_MAX_ESCAPES,
      timer: this.phase === 'boss' ? Math.max(0, this.bossTimer) : null,
    };
  }
}
