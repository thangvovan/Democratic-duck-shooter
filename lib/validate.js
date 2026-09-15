// Server-side plausibility checks for submitted scores. The client is not trusted:
// every stat must be consistent with the game rules and with the other stats.

import { RULES, MAX_QUESTIONS, sanitizeNickname, isValidNickname } from '../public/src/data/rules.js';

const STAT_FIELDS = [
  'questions',
  'correct',
  'wrong',
  'ducksShot',
  'bodyguardsShot',
  'bulletsFired',
  'escapes',
];

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

  const { questions, correct, wrong, ducksShot, bodyguardsShot, bulletsFired, escapes, presidentDefeated } = stats;
  const president = presidentDefeated ? 1 : 0;

  if (questions > MAX_QUESTIONS) return fail('Too many questions');
  if (correct + wrong !== questions) return fail('Question stats do not add up');
  // Stage 1 + 2 bullets come only from correct answers.
  if (ducksShot > correct) return fail('More ducks than bullets');
  if (escapes > RULES.BOSS_MAX_ESCAPES) return fail('Too many escapes');
  if (presidentDefeated && escapes >= RULES.BOSS_MAX_ESCAPES) return fail('President already escaped');

  const guards = RULES.BODYGUARDS_PER_CYCLE;
  if (bodyguardsShot > guards * (escapes + 1)) return fail('Too many bodyguards');
  if (bodyguardsShot < guards * escapes) return fail('Escapes without bodyguards');
  if (presidentDefeated && bodyguardsShot !== guards * (escapes + 1)) return fail('Bodyguards still standing');

  const kills = ducksShot + bodyguardsShot + president;
  if (bulletsFired < kills) return fail('More hits than shots');

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
