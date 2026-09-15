import { WaveStage } from './WaveStage.js';
import { STATES } from '../game/GameState.js';
import { Duck } from '../entities/Duck.js';
import { PALETTES } from '../entities/duckArt.js';
import { W, GROUND_Y } from '../utils/draw.js';
import { rand, pick } from '../utils/math.js';

const DUCK_PALETTES = [PALETTES.yellow, PALETTES.white, PALETTES.mallard, PALETTES.pink];

// STAGE 1 — SCHOOL: correct answers = bullets, lots of small fast ducks.
export class Stage1 extends WaveStage {
  constructor(game) {
    super(game, {
      label: 'STAGE 1 — SCHOOL',
      tagline: 'SHOOT THE DUCKS',
      background: 'school',
      pool: 'school',
      waves: 2,
      waveTime: 25,
      questionState: STATES.STAGE_1_QUESTIONS,
      shootingState: STATES.STAGE_1_SHOOTING,
      wrongText: 'NO BULLET',
    });
    this.spawnTimer = 0;
    this.emptyTimer = 0;
  }

  onWaveStart() {
    this.emptyTimer = 0;
  }

  onShootingStart() {
    const { effects, audio } = this.game;
    if (this.ammo === 0) {
      effects.showMessage('NO AMMO!', { sub: 'THE DUCKS ARE LAUGHING AT YOU', color: '#ff5a5a', duration: 2 });
      audio.play('wrong');
    } else {
      effects.showMessage('SHOOT!', { sub: `${this.ammo} BULLET${this.ammo > 1 ? 'S' : ''}`, duration: 1.1 });
    }
    for (let i = 0; i < 4; i++) this.spawnDuck();
    this.spawnTimer = 0.5;
  }

  spawnDuck() {
    this.ducks.push(
      new Duck({
        x: rand(120, W - 120),
        y: GROUND_Y + rand(20, 50),
        size: rand(38, 46),
        speed: this.wave === 1 ? rand(210, 250) : rand(250, 290),
        palette: pick(DUCK_PALETTES),
        accessory: Math.random() < 0.25 ? 'glasses' : null,
      }),
    );
  }

  updateShooting(dt) {
    if (this.ammo === 0) {
      // Let the last hit duck fall (or let the ducks mock an empty gun) before ending.
      this.emptyTimer += dt;
      return this.emptyTimer > (this.waveKills === 0 && this.game.score.bulletsFired === 0 ? 2.2 : 1.2);
    }
    if (this.waveTimer <= 0) {
      this.ammo = 0;
      this.game.effects.showMessage("TIME'S UP!", { color: '#ff5a5a', duration: 1.2 });
      return false;
    }
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
      if (!duck.hitTest(x, y)) continue;
      duck.kill();
      this.waveKills++;
      const { score, jokes, effects } = this.game;
      score.registerKill('duck', duck.x, duck.y);
      effects.addFeathers(duck.x, duck.y, duck.palette.body);
      jokes.tell(duck.x, duck.y);
      return { hit: true };
    }
    return { hit: false };
  }
}
