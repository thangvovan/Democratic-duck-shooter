// Slide content for the how-to-play panel and the stage briefings.
// Each slide: { art: key in SLIDE_ART, title, text }. Keep it to the few things that matter.
import { RULES } from './rules.js';

export const HOW_TO_PLAY = [
  {
    art: 'answerAmmo',
    title: 'ANSWER TO GET AMMO',
    text: `EVERY CORRECT ANSWER LOADS 1 BULLET.`,
  },
  {
    art: 'shootDuck',
    title: 'CLICK TO SHOOT',
    text: 'SPEND YOUR BULLETS ON THE DUCKS. EVERY HIT SCORES.',
  },
  {
    art: 'combo',
    title: 'KEEP THE STREAK',
    text: '3 HITS IN A ROW = x1.5 POINTS. 5 HITS = x2.',
  },
];

export const STAGE_SLIDES = {
  1: [
    {
      art: 'smallDucks',
      title: 'SHOOT THE DUCKS',
      text: 'LET\'S AIMS AT THE DUCKS.',
    },
  ],

  2: [
    {
      art: 'copAmmo',
      title: 'WRONG ANSWERS ARM THE COPS',
      text: 'EACH WRONG ANSWER GIVES THE DUCKS 1 BULLET.',
    },
  ],

  3: [
    {
      art: 'guardAmmo',
      title: `${RULES.QUESTIONS_PER_WAVE[3]} QUESTIONS PER WAVE`,
      text: 'WRONG ANSWERS ARM THE BODYGUARDS. THEY SHOOT FASTER.',
    },
    {
      art: 'guards',
      title: 'DROP THE SHIELD',
      text: `SHOOT ALL ${RULES.BODYGUARDS_PER_CYCLE} BODYGUARDS TO EXPOSE PRESIDENT DUCK.`,
    },
    {
      art: 'shieldBack',
      title: 'THE SHIELD COMES BACK',
      text: `AFTER ${RULES.PRESIDENT_SHIELD_COOLDOWN}s, THE PRESIDENT GOES INTO HIDING AGAIN.`,
    },
  ],
};

export const TUTORIAL_DONE = [
  {
    art: 'goodShot',
    title: 'GOOD SHOT!',
    text: 'THAT DUCK WAS WORTH 100 POINTS. THE REAL GAME STARTS NOW.',
  },
];
