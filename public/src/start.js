import { Game } from './game/Game.js';

async function boot() {
  // Backgrounds pre-render text, so give the pixel font a moment to load.
  try {
    await Promise.race([
      // Sample text makes the browser fetch the Vietnamese subset too (fonts are split by unicode-range).
      Promise.all([
        document.fonts.load('16px "Bungee"', 'ĐẠN VỊT TRƯỜNG BẮN Ấ Ề Ở Ữ'),
        document.fonts.load('700 16px "Chakra Petch"', 'Đạn vịt trường bắn ấ ề ở ữ'),
      ]),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch {
    /* fall back to monospace */
  }
  const game = new Game(document.getElementById('game'), document.getElementById('ui'));
  game.start();
  if (location.hostname === 'localhost') window.__game = game; // debugging aid in local dev only
}

boot();
