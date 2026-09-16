import { GameLoop } from './GameLoop.js';
import { STATES, StateMachine, GAMEPLAY_STATES, QUESTION_STATES } from './GameState.js';
import { W, H } from '../utils/draw.js';
import { storage, isTutorialCompleted } from '../utils/storage.js';

import { AudioSystem } from '../systems/AudioSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { JokeSystem } from '../systems/JokeSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { QuestionSystem } from '../systems/QuestionSystem.js';
import { ShootingSystem } from '../systems/ShootingSystem.js';

import { Player } from '../entities/Player.js';
import { MenuScene } from '../stages/MenuScene.js';
import { Tutorial } from '../stages/Tutorial.js';
import { Stage1 } from '../stages/Stage1.js';
import { Stage2 } from '../stages/Stage2.js';
import { Stage3 } from '../stages/Stage3.js';

import { Menu } from '../ui/Menu.js';
import { QuestionUI } from '../ui/QuestionUI.js';
import { BriefingUI } from '../ui/BriefingUI.js';
import { LeaderboardUI } from '../ui/Leaderboard.js';
import { ResultScreen } from '../ui/ResultScreen.js';
import { renderHud, renderCrosshair } from '../ui/HUD.js';

import { createSession, submitScore, sendProgress } from '../api/leaderboard.js';
import { HOW_TO_PLAY } from '../data/slides.js';

export class Game {
  constructor(canvas, uiRoot) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.resize();

    this.audio = new AudioSystem();
    this.effects = new EffectsSystem();
    this.jokes = new JokeSystem(this.effects);
    this.score = new ScoreSystem(this.effects);
    this.questions = new QuestionSystem();
    this.player = new Player();
    this.shooting = new ShootingSystem(this, canvas);
    this.menuScene = new MenuScene(this);

    this.stage = null;
    this.paused = false;
    this.nickname = storage.get('nickname', '');
    this.runId = 0;
    this.sessionPromise = null;
    this.lastResult = null;
    this.leaderboardReturn = STATES.MENU;
    this.aimingClass = false;

    this.menu = new Menu(uiRoot, {
      onPlay: () => this.changeState(STATES.PLAYER_NAME),
      onLeaderboard: () => this.openLeaderboard(STATES.MENU),
      onHowTo: () => this.briefingUI.show({ title: 'HOW TO PLAY', slides: HOW_TO_PLAY, button: 'BACK' }),
      onToggleMute: () => this.toggleMute(),
      onNameConfirmed: (name) => this.onNameConfirmed(name),
      onBackToMenu: () => this.changeState(STATES.MENU),
      onResume: () => this.setPaused(false),
      onQuit: () => this.quitToMenu(),
    });
    this.menu.setMuted(this.audio.muted);
    this.questionUI = new QuestionUI(uiRoot, this.audio);
    this.briefingUI = new BriefingUI(uiRoot);
    this.leaderboardUI = new LeaderboardUI(uiRoot, { onBack: () => this.closeLeaderboard() });
    this.resultScreen = new ResultScreen(uiRoot, {
      onPlayAgain: () => this.startRun(),
      onLeaderboard: () => this.openLeaderboard(STATES.RESULT),
      onMenu: () => this.changeState(STATES.MENU),
    });

    this.fsm = new StateMachine(STATES.MENU, (next, prev) => this.onStateChange(next, prev));
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render(),
    );
    this.bindGlobalEvents(uiRoot);
  }

  get state() {
    return this.fsm.state;
  }

  start() {
    this.onStateChange(STATES.MENU, null);
    this.loop.start();
  }

  bindGlobalEvents(uiRoot) {
    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('resize', () => this.resize());

    uiRoot.addEventListener('click', (e) => {
      if (e.target.closest('button')) this.audio.play('ui');
    });

    window.addEventListener('keydown', (e) => {
      const typing = e.target instanceof HTMLInputElement;
      if (e.key === 'Escape') {
        if (this.briefingUI.visible && !GAMEPLAY_STATES.has(this.state)) this.briefingUI.hide();
        else if (this.state === STATES.PLAYER_NAME) this.changeState(STATES.MENU);
        else if (this.state === STATES.LEADERBOARD) this.closeLeaderboard();
        else this.setPaused(!this.paused);
        return;
      }
      if (typing || e.repeat) return;
      // Slides: arrows page through, Enter advances (buttons already handle Enter natively).
      if (this.briefingUI.visible && !this.paused) {
        const onButton = e.target instanceof HTMLButtonElement;
        if (e.key === 'ArrowRight' || (e.key === 'Enter' && !onButton)) {
          e.preventDefault();
          this.briefingUI.next();
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.briefingUI.back();
          return;
        }
      }
      if (e.key === 'm' || e.key === 'M') this.toggleMute();
      else if (!this.paused && QUESTION_STATES.has(this.state)) this.questionUI.handleKey(e.key);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.setPaused(true);
    });
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (dpr === this.dpr && this.canvas.width === W * dpr) return;
    this.dpr = dpr;
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
  }

  // ---------- State / flow ----------

  changeState(next) {
    return this.fsm.go(next);
  }

  onStateChange(next) {
    this.menu.hideAll();
    if (next !== STATES.RESULT) this.resultScreen.hide();
    if (next !== STATES.LEADERBOARD) this.leaderboardUI.hide();
    if (!GAMEPLAY_STATES.has(next)) {
      this.setPaused(false);
      this.briefingUI.hide();
    }

    switch (next) {
      case STATES.MENU:
        this.setStage(null);
        this.menu.showMain();
        break;
      case STATES.PLAYER_NAME:
        this.menu.showName(this.nickname);
        break;
      case STATES.LEADERBOARD:
        this.leaderboardUI.show(this.nickname || null);
        break;
      case STATES.RESULT:
        if (this.lastResult) this.resultScreen.reveal();
        break;
    }
  }

  onNameConfirmed(name) {
    this.nickname = name;
    storage.set('nickname', name);
    if (isTutorialCompleted()) {
      this.startRun();
    } else {
      this.changeState(STATES.TUTORIAL);
      this.setStage(new Tutorial(this));
    }
  }

  startRun() {
    this.runId++;
    this.lastResult = null;
    this.score.reset();
    this.questions.reset();
    this.requestSession();
    this.reportProgress(1);
    if (!this.changeState(STATES.STAGE_1_QUESTIONS)) return;
    this.setStage(new Stage1(this));
  }

  // Tells the live scoreboard that this player is in a run (start = 0 points, then after each stage).
  async reportProgress(stage, { done = false } = {}) {
    if (!this.nickname) return;
    const token = await this.sessionPromise;
    if (!token) return;
    try {
      await sendProgress({ token, nickname: this.nickname, score: this.score.score, stage, done });
    } catch {
      /* the live board is optional */
    }
  }

  requestSession() {
    // One request per game; gameplay continues even if the server is unreachable.
    this.sessionPromise = createSession().catch(() => null);
  }

  completeStage() {
    if (this.stage instanceof Stage1) {
      this.reportProgress(2);
      this.changeState(STATES.STAGE_2_QUESTIONS);
      this.setStage(new Stage2(this));
    } else if (this.stage instanceof Stage2) {
      this.reportProgress(3);
      this.changeState(STATES.STAGE_3_QUESTIONS);
      this.setStage(new Stage3(this));
    }
  }

  finishGame(outcome) {
    const stats = {
      ...this.score.getStats(),
      questions: this.questions.total,
      correct: this.questions.correct,
      wrong: this.questions.wrong,
    };
    const result = { runId: this.runId, outcome, nickname: this.nickname, score: this.score.score, stats };
    this.lastResult = result;
    this.setStage(null);
    this.changeState(STATES.RESULT);
    this.resultScreen.show(result);
    this.submitResult(result);
  }

  async submitResult(result) {
    const token = await this.sessionPromise;
    if (!token) {
      this.resultScreen.setError(result.runId, 'OFFLINE: SCORE NOT SUBMITTED.');
      return;
    }
    const { stats } = result;
    try {
      const response = await submitScore({
        token,
        nickname: result.nickname,
        score: result.score,
        stats: {
          questions: stats.questions,
          correct: stats.correct,
          wrong: stats.wrong,
          ducksShot: stats.ducksShot,
          bodyguardsShot: stats.bodyguardsShot,
          bulletsFired: stats.bulletsFired,
          shields: stats.shields,
          presidentDefeated: stats.presidentDefeated,
        },
      });
      this.resultScreen.setSubmitted(result.runId, response);
    } catch (err) {
      const message = err.status === 429 ? 'TOO MANY SUBMISSIONS. TRY LATER.' : `SCORE NOT SUBMITTED: ${String(err.message).toUpperCase()}`;
      this.resultScreen.setError(result.runId, message);
      this.reportProgress(0, { done: true }); // drop the "playing" row anyway
    }
  }

  openLeaderboard(returnState) {
    this.leaderboardReturn = returnState;
    this.changeState(STATES.LEADERBOARD);
  }

  closeLeaderboard() {
    this.changeState(this.leaderboardReturn === STATES.RESULT && this.lastResult ? STATES.RESULT : STATES.MENU);
  }

  quitToMenu() {
    if (GAMEPLAY_STATES.has(this.state)) this.reportProgress(0, { done: true });
    this.setPaused(false);
    this.changeState(STATES.MENU);
  }

  setStage(stage) {
    if (this.stage) this.stage.exit();
    this.effects.clear();
    this.questionUI.cancel();
    this.briefingUI.hide();
    this.stage = stage;
    if (stage) stage.enter();
  }

  setPaused(paused) {
    if (paused && !GAMEPLAY_STATES.has(this.state)) return;
    this.paused = paused;
    this.menu.showPause(paused);
  }

  toggleMute() {
    this.menu.setMuted(this.audio.toggleMute());
  }

  // ---------- Loop ----------

  update(dt) {
    if (this.paused) return;
    this.shooting.update(dt);
    this.effects.update(dt);
    this.score.update(dt);
    this.player.update(dt);
    if (this.stage) this.stage.update(dt);
    else this.menuScene.update(dt);
  }

  render() {
    const { ctx, stage } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#1b1036';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    this.effects.applyShake(ctx);
    if (stage) stage.render(ctx);
    else this.menuScene.render(ctx);
    this.effects.renderWorld(ctx);
    if (stage?.showPlayer) this.player.render(ctx);
    ctx.restore();

    this.effects.renderOverlay(ctx);
    if (stage && !stage.hideHud) renderHud(ctx, stage.getHud(), this);

    const aiming = Boolean(stage?.canShoot()) && !this.paused;
    if (aiming !== this.aimingClass) {
      this.aimingClass = aiming;
      this.canvas.classList.toggle('aiming', aiming);
    }
    if (aiming && this.shooting.pointer.inside) {
      renderCrosshair(ctx, this.shooting.pointer.x, this.shooting.pointer.y);
    }
  }
}
