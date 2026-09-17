import { W, H } from '../utils/draw.js';

// Converts pointer input into shots. Listeners are registered once for the lifetime of the game;
// the active stage decides whether shooting is allowed and what gets hit.
export class ShootingSystem {
  constructor(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.pointer = { x: W / 2, y: H / 2, inside: false };
    this.noAmmoCooldown = 0;
    this.hitPadding = 0;

    this.onMove = this.onMove.bind(this);
    this.onDown = this.onDown.bind(this);
    this.onLeave = () => (this.pointer.inside = false);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointerleave', this.onLeave);
  }

  toLogical(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  }

  onMove(e) {
    const p = this.toLogical(e);
    this.pointer.x = p.x;
    this.pointer.y = p.y;
    this.pointer.inside = true;
    this.game.player.aimAt(p.x, p.y);
  }

  onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    this.hitPadding = e.pointerType === 'touch' || e.pointerType === 'pen' ? 16 : 0;
    this.game.audio.unlock();
    this.onMove(e);
    this.shoot(this.pointer.x, this.pointer.y);
  }

  update(dt) {
    this.noAmmoCooldown = Math.max(0, this.noAmmoCooldown - dt);
  }

  shoot(x, y) {
    const { game } = this;
    const stage = game.stage;
    if (game.paused || !stage || !stage.canShoot()) return;

    if (!stage.hasAmmo()) {
      game.audio.play('empty');
      if (this.noAmmoCooldown <= 0) {
        game.effects.addPopup(x, y, 'HẾT ĐẠN!', { color: '#ff5a5a', size: 14, life: 0.8 });
        this.noAmmoCooldown = 0.5;
      }
      return;
    }

    stage.consumeAmmo();
    if (stage.countsStats) game.score.registerShot();

    const { player, effects, audio } = game;
    player.aimAt(x, y);
    player.fire();
    const muzzle = player.muzzle;
    effects.addMuzzleFlash(muzzle.x, muzzle.y);
    effects.addTracer(muzzle.x, muzzle.y, x, y);
    effects.addShake(5);
    audio.play('shoot');

    const result = stage.onShoot(x, y) || { hit: false };
    if (result.hit) {
      audio.play('hit');
    } else if (!result.neutral) {
      if (stage.countsStats) game.score.registerMiss();
      effects.addPopup(x, y, 'TRƯỢT', { color: '#ffffff', size: 12, life: 0.6 });
    }
  }

  destroy() {
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.canvas.removeEventListener('pointerleave', this.onLeave);
  }
}
