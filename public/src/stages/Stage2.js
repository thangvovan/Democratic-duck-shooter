import { WaveStage } from './WaveStage.js';
import { STATES } from '../game/GameState.js';
import { RULES } from '../data/rules.js';
import { PoliceDuck } from '../entities/PoliceDuck.js';
import { EnemyBullet } from '../entities/Bullet.js';
import { W, GROUND_Y } from '../utils/draw.js';
import { rand, removeWhere } from '../utils/math.js';

const MAX_COPS = 3;

// STAGE 2 — POLICE: every wrong answer gives the duck cops exactly one bullet to fire back.
export class Stage2 extends WaveStage {
  constructor(game) {
    super(game, {
      label: 'STAGE 2 — POLICE',
      tagline: 'THE DUCKS SHOOT BACK',
      background: 'police',
      pool: 'police',
      waves: 2,
      waveTime: 25,
      questionState: STATES.STAGE_2_QUESTIONS,
      shootingState: STATES.STAGE_2_SHOOTING,
      wrongText: '+1 ENEMY BULLET',
    });
    this.hp = RULES.STAGE2_PLAYER_HP;
    this.enemyAmmo = 0;
    this.bullets = [];
    this.fireCooldown = 0;
    this.respawnTimer = 0;
    this.settleTimer = 0;
  }

  exit() {
    super.exit();
    this.bullets.length = 0;
  }

  onWaveStart() {
    this.enemyAmmo = 0;
    this.bullets.length = 0;
    this.settleTimer = 0;
  }

  onWrongAnswer() {
    this.enemyAmmo++;
  }

  getRewards() {
    return { ammo: this.ammo, enemyAmmo: this.enemyAmmo };
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
    this.fireCooldown = 1.8;
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
    const { player } = this.game;

    for (const bullet of this.bullets) {
      bullet.update(dt);
      if (bullet.arrived && !bullet.destroyed) {
        bullet.destroyed = true;
        this.hitPlayer();
        if (this.phase !== 'shooting') return false;
      }
    }
    removeWhere(this.bullets, (b) => b.done);

    const alive = this.ducks.filter((d) => d.alive);
    const busy = this.ammo > 0 || this.enemyAmmo > 0;

    if (busy && alive.length < MAX_COPS) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.spawnCop();
        this.respawnTimer = 0.9;
      }
    }

    const someoneAiming = alive.some((d) => d.aiming);
    if (this.enemyAmmo > 0 && !someoneAiming) {
      this.fireCooldown -= dt;
      const shooters = alive.filter((d) => !d.entering);
      if (this.fireCooldown <= 0 && shooters.length > 0) {
        const cop = shooters[Math.floor(Math.random() * shooters.length)];
        cop.startAim(0.75, player.position, (c) => this.fire(c));
        this.fireCooldown = this.ammo > 0 ? rand(1.4, 2.3) : rand(0.8, 1.2);
      }
    }

    if (this.waveTimer <= 0 && this.ammo > 0) {
      this.ammo = 0;
      this.game.effects.showMessage("TIME'S UP!", { color: '#ff5a5a', duration: 1.2 });
    }

    const finished = this.ammo === 0 && this.enemyAmmo === 0 && this.bullets.length === 0 && !someoneAiming;
    if (!finished) {
      this.settleTimer = 0;
      return false;
    }
    this.settleTimer += dt;
    return this.settleTimer > 1.1;
  }

  fire(cop) {
    if (this.phase !== 'shooting' || this.enemyAmmo <= 0) return;
    this.enemyAmmo--;
    this.bullets.push(new EnemyBullet(cop.x, cop.y, this.game.player.position));
    this.game.audio.play('enemyShot');
  }

  hitPlayer() {
    const { player, effects, audio } = this.game;
    this.hp = Math.max(0, this.hp - 1);
    player.hurt();
    effects.addHurtFlash();
    effects.addShake(14);
    effects.addPopup(W / 2, GROUND_Y - 20, '-1 HP', { color: '#ff3b3b', size: 20 });
    audio.play('hurt');

    if (this.hp <= 0) {
      this.phase = 'dead';
      this.timer = 2.8;
      for (const duck of this.ducks) if (duck.cancelAim) duck.cancelAim();
      effects.showMessage("YOU'VE BEEN ARRESTED!", { sub: 'FREEDOM HAS LIMITS', color: '#ff3b3b', duration: 2.8, size: 28 });
      audio.play('gameOver');
    }
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
    const { effects, audio, score, jokes } = this.game;

    for (const bullet of this.bullets) {
      if (!bullet.hitTest(x, y)) continue;
      bullet.destroyed = true;
      effects.addStars(bullet.x, bullet.y, 8, '#ff7b7b');
      effects.addPopup(bullet.x, bullet.y - 20, 'BLOCKED!', { color: '#5ee7ff', size: 12 });
      audio.play('block');
      return { hit: false, neutral: true };
    }

    for (let i = this.ducks.length - 1; i >= 0; i--) {
      const cop = this.ducks[i];
      if (!cop.hitTest(x, y)) continue;
      cop.cancelAim();
      cop.kill();
      this.waveKills++;
      score.registerKill('policeDuck', cop.x, cop.y);
      effects.addFeathers(cop.x, cop.y, '#2f5bd3');
      jokes.tell(cop.x, cop.y);
      return { hit: true };
    }
    return { hit: false };
  }

  renderEntities(ctx) {
    super.renderEntities(ctx);
  }

  renderOverlay(ctx) {
    for (const bullet of this.bullets) bullet.render(ctx);
  }

  getHud() {
    return {
      ...super.getHud(),
      hp: this.hp,
      maxHp: RULES.STAGE2_PLAYER_HP,
      enemyAmmo: this.enemyAmmo,
    };
  }
}
