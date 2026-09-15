import { getBackground } from './backgrounds.js';

// Common stage interface used by Game and ShootingSystem.
export class BaseStage {
  constructor(game, { label, background }) {
    this.game = game;
    this.label = label;
    this.backgroundKind = background;
    this.time = 0;
    this.countsStats = true; // tutorial shots do not count toward the final result
    this.showPlayer = true;
  }

  enter() {}
  exit() {}

  update(dt) {
    this.time += dt;
  }

  renderEntities() {}
  renderOverlay() {}

  render(ctx) {
    const bg = getBackground(this.backgroundKind, this.game.dpr);
    bg.drawBack(ctx, this.time);
    this.renderEntities(ctx);
    bg.drawFront(ctx, this.time);
    this.renderOverlay(ctx);
  }

  canShoot() {
    return false;
  }

  hasAmmo() {
    return false;
  }

  consumeAmmo() {}

  onShoot() {
    return { hit: false };
  }

  getHud() {
    return { label: this.label };
  }
}
