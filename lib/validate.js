// Server-side plausibility checks for submitted scores. The client is not trusted:
// every stat must be consistent with the game rules and with the other stats.

import { RULES, sanitizeNickname, isValidNickname } from '../public/src/data/rules.js';

const STAT_FIELDS = ['questions', 'correct', 'wrong', 'ducksShot', 'bodyguardsShot', 'bulletsFired', 'shields'];

const isCount = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;

export function validateSubmission(body, tokenPayload, now = Date.now()) {
  const fail = (error) => ({ ok: false, error });

  const nickname = sanitizeNickname(body.nickname);
  if (!isValidNickname(nickname) || nickname !== String(body.nickname).trim().toUpperCase()) {
    return fail('Invalid nickname');
  }

  const elapsedSeconds = (now - tokenPayload.iat) / 1000;
  const minSeconds = Number(process.env.MIN_GAME_SECONDS ?? RULES.MIN_GAME_SECONDS);
  if (elapsedSeconds < minSeconds) return fail('Game finished too quickly');
  if (elapsedSeconds > RULES.MAX_GAME_SECONDS) return fail('Game session expired');

  const stats = body.stats;
  if (!stats || typeof stats !== 'object') return fail('Missing stats');
  for (const field of STAT_FIELDS) {
    if (!isCount(stats[field], 10_000)) return fail(`Invalid stat: ${field}`);
  }
  if (typeof stats.presidentDefeated !== 'boolean') return fail('Invalid stat: presidentDefeated');

  const { questions, correct, wrong, ducksShot, bodyguardsShot, bulletsFired, shields, presidentDefeated } = stats;
  const president = presidentDefeated ? 1 : 0;

  if (questions > RULES.MAX_QUESTIONS) return fail('Too many questions');
  // Every answer is followed by a fixed feedback pause, so answers cannot come faster than that.
  if (questions > Math.floor(Math.max(0, elapsedSeconds) / RULES.QUESTION_FEEDBACK_TIME) + 2) {
    return fail('Questions answered too fast');
  }
  if (correct + wrong !== questions) return fail('Question stats do not add up');

  // Every player bullet comes from a correct answer.
  const kills = ducksShot + bodyguardsShot + president;
  if (bulletsFired > correct) return fail('More shots than bullets');
  if (bulletsFired < kills) return fail('More hits than shots');

  if (shields > RULES.MAX_SHIELD_RESTORES) return fail('Too many shield restores');
  const guards = RULES.BODYGUARDS_PER_CYCLE;
  // The shield only comes back after all bodyguards of the current cycle are down.
  if (bodyguardsShot > guards * (shields + 1)) return fail('Too many bodyguards');
  if (bodyguardsShot < guards * shields) return fail('Shield restored without bodyguards down');
  if (presidentDefeated && bodyguardsShot !== guards * (shields + 1)) return fail('Bodyguards still standing');

  const score = body.score;
  const base = ducksShot * RULES.POINTS.duck + bodyguardsShot * RULES.POINTS.bodyguard + president * RULES.POINTS.president;
  if (!Number.isInteger(score) || score < base || score > base * RULES.MAX_COMBO_MULTIPLIER) {
    return fail('Score does not match stats');
  }

  return {
    ok: true,
    record: {
      id: tokenPayload.jti,
      nickname,
      score,
      correct_answers: correct,
      wrong_answers: wrong,
      ducks_shot: ducksShot,
      bodyguards_shot: bodyguardsShot,
      president_defeated: presidentDefeated,
      bullets_fired: bulletsFired,
      duration_seconds: Math.round(elapsedSeconds),
      createdAt: new Date(now).toISOString(),
    },
  };
}
