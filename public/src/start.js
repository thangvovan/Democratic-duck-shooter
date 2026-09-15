import { Game } from './game/Game.js';

async function boot() {
  // Backgrounds pre-render text, so give the pixel font a moment to load.
  try {
    await Promise.race([
      document.fonts.load('16px "Press Start 2P"'),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch {
    /* fall back to monospace */
  }
  const game = new Game(document.getElementById('game'), document.getElementById('ui'));
  game.start();
  if (location.hostname === 'localhost') window.__game = game; // debugging aid in local dev only
}

boot();
