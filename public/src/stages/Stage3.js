import { WaveStage } from './WaveStage.js';
import { EnemyFire } from './EnemyFire.js';
import { drawPodium } from './backgrounds.js';
import { STATES } from '../game/GameState.js';
import { RULES } from '../data/rules.js';
import { Bodyguard } from '../entities/Bodyguard.js';
import { PresidentDuck, PODIUM } from '../entities/PresidentDuck.js';
import { W } from '../utils/draw.js';
import { rand } from '../utils/math.js';

// STAGE 3 — PRESIDENT: questions arm both sides. Down the 3 bodyguards to drop the shield,
// then hit President Duck. After 50s of shooting his shield returns with new bodyguards.
export class Stage3 extends WaveStage {
  constructor(game) {
    super(game, {
      label: 'STAGE 3 — PRESIDENT',
      tagline: 'BOSS FIGHT',
      background: 'government',
      pool: 'president',
      questionsPerWave: RULES.QUESTIONS_PER_WAVE[3],
      questionState: STATES.STAGE_3_QUESTIONS,
      shootingState: STATES.STAGE_3_BOSS,
      wrongText: '+1 BODYGUARD BULLET',
      ducksLeave: false,
      briefing: [
        `${RULES.QUESTIONS_PER_WAVE[3]} QUESTIONS PER WAVE`,
        'CORRECT = +1 BULLET FOR YOU, WRONG = +1 FOR THE BODYGUARDS',
        `SHOOT ${RULES.BODYGUARDS_PER_CYCLE} BODYGUARDS TO DROP THE PRESIDENT'S SHIELD`,
        `SHIELD COMES BACK WHEN YOU RUN OUT OF AMMO OR AFTER ${RULES.PRESIDENT_SHIELD_COOLDOWN}S (AMMO RESETS TO 0)`,
        'BODYGUARDS WARN FAST AND SHOOT FAST. OUT OF AMMO = THEY ALL FIRE AT ONCE',
        `YOU HAVE ${RULES.STAGE3_PLAYER_HP} HP. HIT PRESIDENT DUCK BEFORE TIME RUNS OUT!`,
      ],
    });
    this.president = new PresidentDuck();
    this.boss = 'offstage'; // offstage | arrive | guards | vulnerable | defeated
    this.enemyAmmo = 0;
    this.shieldTimer = 0;
    this.clearTimer = 0;
    this.pendingShieldMessage = null;
    // Bodyguards warn for a shorter time and shoot faster bullets than the cops.
    this.enemyFire = new EnemyFire(game, {
      hp: RULES.STAGE3_PLAYER_HP,
      aimTime: 0.45,
      bulletTime: 0.8,
      takeAmmo: () => this.enemyAmmo--,
      ammoLeft: () => this.enemyAmmo,
      onDeath: () => this.onPlayerDown(),
    });
  }

  get guards() {
    return this.ducks;
  }

  startIntro() {
    super.startIntro();
    this.game.audio.play('bossSpawn');
    this.president.arrive();
    this.boss = 'arrive';
  }

  exit() {
    super.exit();
    this.enemyFire.clear();
  }

  onWaveStart() {
    this.enemyAmmo = 0;
    this.enemyFire.clear();
  }

  onWrongAnswer() {
    this.enemyAmmo++;
  }

  getRewards() {
    return { ammo: this.ammo, enemyAmmo: this.enemyAmmo, enemyLabel: 'GUARD BULLETS' };
  }

  spawnGuards() {
    this.boss = 'guards';
    this.president.hide();
    for (let i = 0; i < RULES.BODYGUARDS_PER_CYCLE; i++) {
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

  dropShield() {
    this.boss = 'vulnerable';
    this.shieldTimer = RULES.PRESIDENT_SHIELD_COOLDOWN;
    this.president.becomeTarget();
    this.game.effects.showMessage('SHIELD DOWN!', {
      sub: `SHOOT THE PRESIDENT! ${RULES.PRESIDENT_SHIELD_COOLDOWN} SECONDS`,
      duration: 1.6,
      size: 30,
    });
    this.game.audio.play('stageStart');
  }

  restoreShield(reason) {
    this.game.score.shields++;
    this.boss = 'arrive';
    this.pendingShieldMessage = reason; // re-shown after the wave-end message
    this.president.retreat();
    this.game.effects.showMessage('SHIELD RESTORED!', { sub: reason, color: '#5ee7ff', duration: 2 });
    this.game.audio.play('bossSpawn');
  }

  onShootingStart() {
    const { effects, audio } = this.game;
    const vulnerable = this.boss === 'vulnerable';
    effects.showMessage(vulnerable ? 'SHOOT THE PRESIDENT!' : 'SHOOT!', {
      sub: `YOU: ${this.ammo}   GUARDS: ${this.enemyAmmo}`,
      color: this.enemyAmmo > this.ammo ? '#ff5a5a' : '#ffd23f',
      duration: 1.4,
    });
    if (this.ammo === 0) audio.play('wrong');
    this.enemyFire.cooldown = 1.6;
  }

  update(dt) {
    super.update(dt);
    const { effects, audio } = this.game;
    this.president.update(dt);

    const armedGuards = this.guards.filter((g) => g.alive && !g.entering);
    this.enemyFire.update(dt, {
      shooters: armedGuards,
      canFire: this.phase === 'shooting',
      playerAmmo: this.ammo,
      nextCooldown: () => rand(1.8, 2.8),
    });

    const stageActive = !['timeup', 'over', 'victory', 'dead'].includes(this.phase);
    switch (stageActive ? this.boss : null) {
      case 'arrive':
        if (this.president.state === 'podium') {
          effects.addBubble(PODIUM.x, PODIUM.y - 30, 'PROTECT THE PRESIDENT!', { speaker: 'duck', life: 2 });
          audio.play('quack');
          this.spawnGuards();
        }
        break;
      case 'guards':
        if (this.guards.every((g) => !g.alive)) {
          this.clearTimer += dt;
          if (this.clearTimer > 1) {
            this.clearTimer = 0;
            this.dropShield();
          }
        } else {
          this.clearTimer = 0;
        }
        break;
      case 'vulnerable':
        if (this.phase === 'shooting') {
          this.shieldTimer -= dt;
          if (this.shieldTimer <= 0) {
            // Time's up: the shield returns and the player's remaining ammo is lost.
            this.ammo = 0;
            this.restoreShield("TIME'S UP! AMMO RESET TO 0");
          }
        }
        break;
    }

    if (this.phase === 'victory' || this.phase === 'dead') {
      this.timer -= dt;
      if (this.timer <= 0) {
        const outcome = this.phase === 'victory' ? 'victory' : 'shot';
        this.phase = 'over';
        this.game.finishGame(outcome);
      }
    }
  }

  updateShooting() {
    if (this.phase !== 'shooting') return false;
    if (this.boss === 'vulnerable' && this.ammo === 0) this.restoreShield('YOU RAN OUT OF AMMO');
    const guardsAlive = this.guards.some((g) => g.alive);
    const someoneAiming = this.guards.some((g) => g.aiming);
    // Bodyguard ammo is useless once every bodyguard is down.
    const enemyDone = this.enemyAmmo === 0 || !guardsAlive;
    return this.ammo === 0 && enemyDone && !this.enemyFire.inFlight && !someoneAiming;
  }

  onWaveEnd() {
    if (!this.pendingShieldMessage) return;
    this.game.effects.showMessage('SHIELD RESTORED!', { sub: this.pendingShieldMessage, color: '#5ee7ff', duration: 2 });
    this.pendingShieldMessage = null;
  }

  onPlayerDown() {
    this.phase = 'dead';
    this.timer = 2.8;
    for (const guard of this.guards) guard.cancelAim();
    this.game.effects.showMessage('THE BODYGUARDS GOT YOU!', {
      sub: 'PROTECT THE PRESIDENT!',
      color: '#ff3b3b',
      duration: 2.8,
      size: 26,
    });
    this.game.audio.play('gameOver');
  }

  onTimeUp() {
    this.president.escape();
    this.game.audio.play('bossEscape');
    this.game.effects.showMessage('THE PRESIDENT HAS ESCAPED!', {
      sub: "TIME'S UP",
      color: '#ff5a5a',
      duration: 2.4,
      size: 24,
    });
  }

  onStageFinished() {
    this.game.finishGame('escaped');
  }

  onShoot(x, y) {
    if (this.enemyFire.tryBlock(x, y, this.pad)) return { hit: false, neutral: true };
    const { score, jokes, effects, audio } = this.game;

    for (let i = this.guards.length - 1; i >= 0; i--) {
      const guard = this.guards[i];
      if (!guard.hitTest(x, y, this.pad)) continue;
      guard.kill();
      this.waveKills++;
      score.registerKill('bodyguard', guard.x, guard.y);
      effects.addFeathers(guard.x, guard.y, '#3a3a44', 14);
      jokes.tell();
      return { hit: true };
    }

    if (this.president.hitTest(x, y, this.pad)) {
      if (this.boss === 'vulnerable' && this.president.vulnerable) {
        const { x: px, y: py } = this.president;
        this.president.defeat();
        this.boss = 'defeated';
        this.waveKills++;
        score.registerKill('president', px, py);
        effects.addStars(px, py, 14);
        effects.addFeathers(px, py, '#1f4fb8', 20);
        effects.addShake(12);
        jokes.tell();
        effects.showMessage('PRESIDENT DUCK DEFEATED!', { sub: 'FREEDOM WINS... APPARENTLY', duration: 3, size: 26 });
        audio.play('victory');
        for (const guard of this.guards) guard.cancelAim();
        this.enemyFire.clear();
        this.phase = 'victory';
        this.timer = 3.3;
        return { hit: true };
      }
      effects.addPopup(x, y - 20, 'PROTECTED!', { color: '#5ee7ff', size: 14 });
      audio.play('block');
    }
    return { hit: false };
  }

  renderEntities(ctx) {
    const behind = this.president.atPodium;
    if (behind) this.president.render(ctx);
    drawPodium(ctx);
    if (behind) this.president.renderShield(ctx);
    for (const guard of this.guards) guard.render(ctx);
    if (!behind) this.president.render(ctx);
  }

  renderOverlay(ctx) {
    this.enemyFire.render(ctx);
  }

  getHud() {
    return {
      ...super.getHud(),
      hp: this.enemyFire.hp,
      maxHp: this.enemyFire.maxHp,
      enemyAmmo: this.enemyAmmo,
      enemySlots: this.cfg.questionsPerWave,
      enemyLabel: 'GUARD AMMO',
      shieldTime: this.boss === 'vulnerable' ? Math.max(0, this.shieldTimer) : null,    };
  }
}
