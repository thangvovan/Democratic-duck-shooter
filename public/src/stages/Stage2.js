import { WaveStage } from './WaveStage.js';
import { EnemyFire } from './EnemyFire.js';
import { STATES } from '../game/GameState.js';
import { RULES } from '../data/rules.js';
import { STAGE_SLIDES } from '../data/slides.js';
import { PoliceDuck } from '../entities/PoliceDuck.js';
import { W, GROUND_Y } from '../utils/draw.js';
import { rand } from '../utils/math.js';

const MAX_COPS = 3;

// STAGE 2 — POLICE: every wrong answer gives the duck cops exactly one bullet to fire back.
export class Stage2 extends WaveStage {
  constructor(game) {
    super(game, {
      label: 'STAGE 2 — POLICE',
      tagline: 'THE DUCKS SHOOT BACK',
      background: 'police',
      pool: 'police',
      questionsPerWave: RULES.QUESTIONS_PER_WAVE[2],
      questionState: STATES.STAGE_2_QUESTIONS,
      shootingState: STATES.STAGE_2_SHOOTING,
      wrongText: '+1 ENEMY BULLET',
      briefing: STAGE_SLIDES[2],
    });
    this.enemyAmmo = 0;
    this.respawnTimer = 0;
    this.enemyFire = new EnemyFire(game, {
      hp: RULES.STAGE2_PLAYER_HP,
      aimTime: 0.75,
      bulletTime: 1.25,
      takeAmmo: () => this.enemyAmmo--,
      ammoLeft: () => this.enemyAmmo,
      onDeath: () => this.onPlayerDown(),
    });
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
    return { ammo: this.ammo, enemyAmmo: this.enemyAmmo, enemyLabel: 'COP BULLETS' };
  }

  onShootingStart() {
    const { effects, audio } = this.game;
    effects.showMessage('SHOOT BACK!', {
      sub: `YOU: ${this.ammo}   COPS: ${this.enemyAmmo}`,
      color: this.enemyAmmo > this.ammo ? '#ff5a5a' : '#ffd23f',
      duration: 1.4,
    });
    if (this.ammo === 0) audio.play('wrong');
    for (let i = 0; i < MAX_COPS; i++) this.spawnCop();
    this.enemyFire.cooldown = 1.8;
    this.respawnTimer = 0;
  }

  spawnCop() {
    this.ducks.push(
      new PoliceDuck({
        x: rand(140, W - 140),
        y: GROUND_Y + rand(20, 50),
        size: rand(48, 54),
        speed: this.wave === 1 ? 170 : 200,
      }),
    );
  }

  updateShooting(dt) {
    const alive = this.ducks.filter((d) => d.alive);

    this.enemyFire.update(dt, {
      shooters: alive.filter((d) => !d.entering),
      canFire: true,
      playerAmmo: this.ammo,
      nextCooldown: () => rand(1.4, 2.3),
    });
    if (this.phase !== 'shooting') return false;

    // Keep cops around while the player can shoot; during a volley only replace them if none are left.
    const needCops = this.ammo > 0 ? alive.length < MAX_COPS : this.enemyAmmo > 0 && alive.length === 0;
    if (needCops) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.spawnCop();
        this.respawnTimer = 0.9;
      }
    }

    const busy = alive.some((d) => d.aiming);
    return this.ammo === 0 && this.enemyAmmo === 0 && !this.enemyFire.inFlight && !busy;
  }

  onPlayerDown() {
    this.phase = 'dead';
    this.timer = 2.8;
    for (const duck of this.ducks) duck.cancelAim();
    this.game.effects.showMessage("YOU'VE BEEN ARRESTED!", {
      sub: 'FREEDOM HAS LIMITS',
      color: '#ff3b3b',
      duration: 2.8,
      size: 28,
    });
    this.game.audio.play('gameOver');
  }

  update(dt) {
    super.update(dt);
    if (this.phase === 'dead') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.phase = 'over';
        this.game.finishGame('arrested');
      }
    }
  }

  onShoot(x, y) {
    if (this.enemyFire.tryBlock(x, y, this.pad)) return { hit: false, neutral: true };

    const { effects, score, jokes } = this.game;
    for (let i = this.ducks.length - 1; i >= 0; i--) {
      const cop = this.ducks[i];
      if (!cop.hitTest(x, y, this.pad)) continue;
      cop.kill();
      this.waveKills++;
      score.registerKill('policeDuck', cop.x, cop.y);
      effects.addFeathers(cop.x, cop.y, '#2f5bd3');
      jokes.tell();
      return { hit: true };
    }
    return { hit: false };
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
      enemyLabel: 'COP AMMO',
    };
  }
}
