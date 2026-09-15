// Game rules shared by the client (gameplay) and the server (score validation).
// Keep this file free of browser/Node specific APIs.

export const RULES = {
  POINTS: {
    duck: 100,
    policeDuck: 100,
    bodyguard: 150,
    president: 1000,
  },

  // Consecutive hits needed for each combo tier and the score multiplier it grants.
  COMBO_TIERS: [
    { streak: 5, multiplier: 2 },
    { streak: 3, multiplier: 1.5 },
  ],
  MAX_COMBO_MULTIPLIER: 2,

  STAGE_TIME: 180, // seconds per stage, counting questions + shooting
  QUESTION_TIME: 15, // seconds per question
  QUESTION_FEEDBACK_TIME: 0.3, // slide to the next question, also the fastest possible pace
  QUESTIONS_PER_WAVE: { 1: 5, 2: 5, 3: 8 },

  STAGE2_PLAYER_HP: 5,
  STAGE3_PLAYER_HP: 5,
  BODYGUARDS_PER_CYCLE: 3,
  // The president's shield comes back when the player runs out of ammo, or after this many
  // seconds of shooting (the player's ammo is then reset to 0).
  PRESIDENT_SHIELD_COOLDOWN: 50,
  MAX_SHIELD_RESTORES: 200,

  MAX_QUESTIONS: 500,

  NICKNAME_MIN: 2,
  NICKNAME_MAX: 12,

  MIN_GAME_SECONDS: 25,
  MAX_GAME_SECONDS: 2 * 60 * 60,
};

export function comboMultiplier(streak) {
  for (const tier of RULES.COMBO_TIERS) {
    if (streak >= tier.streak) return tier.multiplier;
  }
  return 1;
}

export function pointsFor(type, streak) {
  return Math.round(RULES.POINTS[type] * comboMultiplier(streak));
}

// Uppercase arcade-style nickname: letters, digits, space, _ and - only.
export function sanitizeNickname(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFKD')
    .toUpperCase()
    .replace(/[^A-Z0-9 _-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, RULES.NICKNAME_MAX)
    .trim();
}

export function isValidNickname(name) {
  return (
    typeof name === 'string' &&
    name.length >= RULES.NICKNAME_MIN &&
    name.length <= RULES.NICKNAME_MAX &&
    /^[A-Z0-9_-]([A-Z0-9 _-]*[A-Z0-9_-])?$/.test(name)
  );
}
