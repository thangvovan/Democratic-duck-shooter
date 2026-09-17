import { WaveStage } from './WaveStage.js';
import { STATES } from '../game/GameState.js';
import { RULES } from '../data/rules.js';
import { STAGE_SLIDES } from '../data/slides.js';
import { Duck } from '../entities/Duck.js';
import { PALETTES } from '../entities/duckArt.js';
import { W, GROUND_Y } from '../utils/draw.js';
import { rand, pick } from '../utils/math.js';

const DUCK_PALETTES = [PALETTES.yellow, PALETTES.white, PALETTES.mallard, PALETTES.pink];

// STAGE 1 — SCHOOL: correct answers = bullets, lots of small ducks.
export class Stage1 extends WaveStage {
  constructor(game) {
    super(game, {
      label: 'MÀN 1 — TRƯỜNG HỌC',
      tagline: 'BẮN VỊT CON',
      background: 'school',
      pool: 'school',
      questionsPerWave: RULES.QUESTIONS_PER_WAVE[1],
      questionState: STATES.STAGE_1_QUESTIONS,
      shootingState: STATES.STAGE_1_SHOOTING,
      wrongText: 'KHÔNG CÓ ĐẠN',
      briefing: STAGE_SLIDES[1],
    });
    this.spawnTimer = 0;
  }

  onShootingStart() {
    const { effects, audio } = this.game;
    if (this.ammo === 0) {
      audio.play('wrong');
    } else {
      effects.showMessage('BẮN!', { sub: `${this.ammo} VIÊN ĐẠN`, duration: 1.1 });
    }
    for (let i = 0; i < 4; i++) this.spawnDuck();
    this.spawnTimer = 0.5;
  }

  spawnDuck() {
    this.ducks.push(
      new Duck({
        x: rand(120, W - 120),
        y: GROUND_Y + rand(20, 50),
        size: rand(17, 21),
        speed: this.wave === 1 ? rand(85, 100) : rand(95, 110),
        accessory: "student",
      }),
    );
  }

  updateShooting(dt) {
    if (this.ammo === 0) return true; // out of ammo ends the shooting turn right away
    this.spawnTimer -= dt;
    const maxAlive = this.wave === 1 ? 5 : 6;
    const alive = this.ducks.reduce((n, d) => n + (d.alive ? 1 : 0), 0);
    if (alive < maxAlive && this.spawnTimer <= 0) {
      this.spawnDuck();
      this.spawnTimer = 0.45;
    }
    return false;
  }

  onShoot(x, y) {
    for (let i = this.ducks.length - 1; i >= 0; i--) {
      const duck = this.ducks[i];
      if (!duck.hitTest(x, y, this.pad)) continue;
      duck.kill();
      this.waveKills++;
      const { score, jokes, effects } = this.game;
      score.registerKill('duck', duck.x, duck.y);
      effects.addFeathers(duck.x, duck.y, duck.palette.body);
      jokes.tell();
      return { hit: true };
    }
    return { hit: false };
  }
}
