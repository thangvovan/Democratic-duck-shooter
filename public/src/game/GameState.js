export const STATES = Object.freeze({
  MENU: 'MENU',
  PLAYER_NAME: 'PLAYER_NAME',
  TUTORIAL: 'TUTORIAL',
  STAGE_1_QUESTIONS: 'STAGE_1_QUESTIONS',
  STAGE_1_SHOOTING: 'STAGE_1_SHOOTING',
  STAGE_2_QUESTIONS: 'STAGE_2_QUESTIONS',
  STAGE_2_SHOOTING: 'STAGE_2_SHOOTING',
  STAGE_3_BOSS: 'STAGE_3_BOSS',
  RESULT: 'RESULT',
  LEADERBOARD: 'LEADERBOARD',
});

const S = STATES;

const TRANSITIONS = {
  [S.MENU]: [S.PLAYER_NAME, S.LEADERBOARD],
  [S.PLAYER_NAME]: [S.TUTORIAL, S.STAGE_1_QUESTIONS, S.MENU],
  [S.TUTORIAL]: [S.STAGE_1_QUESTIONS, S.MENU],
  [S.STAGE_1_QUESTIONS]: [S.STAGE_1_SHOOTING, S.MENU],
  [S.STAGE_1_SHOOTING]: [S.STAGE_1_QUESTIONS, S.STAGE_2_QUESTIONS, S.MENU],
  [S.STAGE_2_QUESTIONS]: [S.STAGE_2_SHOOTING, S.MENU],
  [S.STAGE_2_SHOOTING]: [S.STAGE_2_QUESTIONS, S.STAGE_3_BOSS, S.RESULT, S.MENU],
  [S.STAGE_3_BOSS]: [S.RESULT, S.MENU],
  [S.RESULT]: [S.LEADERBOARD, S.STAGE_1_QUESTIONS, S.MENU],
  [S.LEADERBOARD]: [S.MENU, S.RESULT],
};

export const GAMEPLAY_STATES = new Set([
  S.TUTORIAL,
  S.STAGE_1_QUESTIONS,
  S.STAGE_1_SHOOTING,
  S.STAGE_2_QUESTIONS,
  S.STAGE_2_SHOOTING,
  S.STAGE_3_BOSS,
]);

export const QUESTION_STATES = new Set([S.STAGE_1_QUESTIONS, S.STAGE_2_QUESTIONS]);

export class StateMachine {
  constructor(initial, onChange) {
    this.current = initial;
    this.onChange = onChange;
  }

  get state() {
    return this.current;
  }

  is(...states) {
    return states.includes(this.current);
  }

  go(next) {
    if (next === this.current) return true;
    if (!TRANSITIONS[this.current]?.includes(next)) {
      console.warn(`[state] invalid transition ${this.current} -> ${next}`);
      return false;
    }
    const prev = this.current;
    this.current = next;
    this.onChange(next, prev);
    return true;
  }
}
