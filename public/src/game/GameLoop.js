// requestAnimationFrame loop with a clamped delta time (seconds).
export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.rafId = 0;
    this.last = 0;
    this.tick = this.tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  tick(now) {
    if (!this.running) return;
    // Clamp so a background tab or a hitch does not teleport entities.
    const dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  }
}
