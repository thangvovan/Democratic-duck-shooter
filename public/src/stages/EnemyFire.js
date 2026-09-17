import { EnemyBullet } from '../entities/Bullet.js';
import { W, GROUND_Y } from '../utils/draw.js';
import { removeWhere } from '../utils/math.js';

// Enemy shooting shared by stage 2 (cops) and stage 3 (bodyguards).
// - While the player has ammo: one shooter at a time warns, then fires one bullet.
// - Once the player is out of ammo: every shooter stops and they unload all remaining ammo together.
// Ammo is taken from the stage (takeAmmo) at the moment a warning starts.
export class EnemyFire {
  constructor(game, { hp, aimTime = 0.75, bulletTime = 1.25, takeAmmo, ammoLeft, onDeath = () => {} }) {
    this.game = game;
    this.hp = hp;
    this.maxHp = hp;
    this.aimTime = aimTime;
    this.bulletTime = bulletTime;
    this.takeAmmo = takeAmmo;
    this.ammoLeft = ammoLeft;
    this.onDeath = onDeath;
    this.bullets = [];
    this.cooldown = 0;
  }

  get inFlight() {
    return this.bullets.length > 0;
  }

  clear() {
    this.bullets.length = 0;
  }

  update(dt, { shooters = [], canFire = false, playerAmmo = 1, nextCooldown = () => 2 } = {}) {
    for (const bullet of this.bullets) {
      bullet.update(dt);
      if (bullet.arrived && !bullet.destroyed) {
        bullet.destroyed = true;
        this.hitPlayer();
        if (this.hp <= 0) return;
      }
    }
    removeWhere(this.bullets, (b) => b.done);

    if (this.hp <= 0 || !canFire) {
      for (const s of shooters) s.hold = false;
      return;
    }

    const idle = shooters.filter((s) => !s.aiming);
    const target = this.game.player.position;

    if (playerAmmo === 0) {
      for (const s of shooters) s.hold = true;
      const left = this.ammoLeft();
      if (left <= 0 || idle.length === 0) return;
      const counts = new Array(idle.length).fill(0);
      for (let i = 0; i < left; i++) counts[i % idle.length]++;
      idle.forEach((shooter, i) => {
        if (counts[i] === 0) return;
        for (let j = 0; j < counts[i]; j++) this.takeAmmo();
        shooter.startAim(this.aimTime, target, counts[i], (s) => this.fire(s));
      });
      return;
    }

    for (const s of shooters) s.hold = false;
    if (this.ammoLeft() <= 0 || shooters.some((s) => s.aiming)) return;
    this.cooldown -= dt;
    if (this.cooldown > 0 || idle.length === 0) return;

    const shooter = idle[Math.floor(Math.random() * idle.length)];
    this.takeAmmo();
    shooter.startAim(this.aimTime, target, 1, (s) => this.fire(s));
    this.cooldown = nextCooldown();
  }

  fire(shooter) {
    if (this.hp <= 0) return;
    this.bullets.push(new EnemyBullet(shooter.x, shooter.y, this.game.player.position, this.bulletTime));
    this.game.audio.play('enemyShot');
  }

  hitPlayer() {
    const { player, effects, audio } = this.game;
    this.hp = Math.max(0, this.hp - 1);
    player.hurt();
    effects.addHurtFlash();
    effects.addShake(14);
    effects.addPopup(W / 2, GROUND_Y - 20, '-1 MÁU', { color: '#ff3b3b', size: 20 });
    audio.play('hurt');
    if (this.hp <= 0) {
      this.clear();
      this.onDeath();
    }
  }

  // Returns true when the shot destroyed an incoming bullet.
  tryBlock(x, y, pad = 0) {
    for (const bullet of this.bullets) {
      if (!bullet.hitTest(x, y, pad)) continue;
      bullet.destroyed = true;
      const { effects, audio } = this.game;
      effects.addStars(bullet.x, bullet.y, 8, '#ff7b7b');
      effects.addPopup(bullet.x, bullet.y - 20, 'CHẶN!', { color: '#5ee7ff', size: 12 });
      audio.play('block');
      return true;
    }
    return false;
  }

  render(ctx) {
    for (const bullet of this.bullets) bullet.render(ctx);
  }
}
