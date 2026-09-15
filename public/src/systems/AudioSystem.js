// Synthesized retro sound effects with the Web Audio API (no audio files needed).
// The AudioContext is created lazily on the first user gesture to respect autoplay rules.
import { storage } from '../utils/storage.js';

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.muted = storage.get('muted') === '1';
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.45;
      this.master.connect(this.ctx.destination);

      const length = this.ctx.sampleRate * 0.5;
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  setMuted(muted) {
    this.muted = muted;
    storage.set('muted', muted ? '1' : '0');
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.45, this.ctx.currentTime, 0.02);
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  play(name) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    const sound = SOUNDS[name];
    if (sound) sound(this);
  }

  tone({ type = 'square', freq, freqEnd, start = 0, dur = 0.1, vol = 0.2 }) {
    const t = this.ctx.currentTime + start;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  noise({ start = 0, dur = 0.15, vol = 0.4, filter = 'lowpass', freq = 2000 }) {
    const t = this.ctx.currentTime + start;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const biquad = this.ctx.createBiquadFilter();
    biquad.type = filter;
    biquad.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(biquad).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.03);
  }
}

const SOUNDS = {
  shoot: (a) => {
    a.noise({ dur: 0.22, vol: 0.9, freq: 1800 });
    a.tone({ type: 'square', freq: 160, freqEnd: 40, dur: 0.14, vol: 0.35 });
  },
  empty: (a) => {
    a.tone({ type: 'square', freq: 1400, dur: 0.03, vol: 0.12 });
    a.tone({ type: 'square', freq: 900, start: 0.06, dur: 0.03, vol: 0.1 });
  },
  quack: (a) => {
    a.tone({ type: 'sawtooth', freq: 760, freqEnd: 420, dur: 0.12, vol: 0.18 });
    a.tone({ type: 'sawtooth', freq: 640, freqEnd: 360, start: 0.13, dur: 0.14, vol: 0.16 });
  },
  hit: (a) => {
    a.tone({ type: 'triangle', freq: 900, freqEnd: 1500, dur: 0.08, vol: 0.25 });
    SOUNDS.quack(a);
  },
  correct: (a) => {
    [660, 880, 1320].forEach((f, i) => a.tone({ type: 'square', freq: f, start: i * 0.07, dur: 0.1, vol: 0.12 }));
  },
  wrong: (a) => {
    a.tone({ type: 'sawtooth', freq: 220, freqEnd: 110, dur: 0.35, vol: 0.2 });
  },
  tick: (a) => {
    a.tone({ type: 'square', freq: 1200, dur: 0.025, vol: 0.06 });
  },
  ui: (a) => {
    a.tone({ type: 'square', freq: 520, dur: 0.04, vol: 0.08 });
  },
  stageStart: (a) => {
    [523, 659, 784, 1047].forEach((f, i) =>
      a.tone({ type: 'square', freq: f, start: i * 0.1, dur: i === 3 ? 0.35 : 0.1, vol: 0.13 }),
    );
  },
  enemyShot: (a) => {
    a.tone({ type: 'square', freq: 1300, freqEnd: 260, dur: 0.18, vol: 0.18 });
    a.noise({ dur: 0.08, vol: 0.3, freq: 3000 });
  },
  hurt: (a) => {
    a.tone({ type: 'sawtooth', freq: 320, freqEnd: 70, dur: 0.3, vol: 0.28 });
    a.noise({ dur: 0.15, vol: 0.4, freq: 900 });
  },
  block: (a) => {
    a.tone({ type: 'triangle', freq: 1800, freqEnd: 2400, dur: 0.07, vol: 0.2 });
  },
  bossSpawn: (a) => {
    for (let i = 0; i < 3; i++) {
      a.tone({ type: 'triangle', freq: 620, freqEnd: 960, start: i * 0.5, dur: 0.25, vol: 0.18 });
      a.tone({ type: 'triangle', freq: 960, freqEnd: 620, start: i * 0.5 + 0.25, dur: 0.25, vol: 0.18 });
    }
  },
  bossEscape: (a) => {
    a.tone({ type: 'sawtooth', freq: 900, freqEnd: 180, dur: 0.7, vol: 0.2 });
    a.tone({ type: 'square', freq: 1200, freqEnd: 300, start: 0.1, dur: 0.6, vol: 0.08 });
  },
  victory: (a) => {
    const notes = [523, 523, 523, 698, 880, 784, 1047];
    const times = [0, 0.12, 0.24, 0.36, 0.6, 0.78, 0.96];
    notes.forEach((f, i) => a.tone({ type: 'square', freq: f, start: times[i], dur: i === 6 ? 0.6 : 0.14, vol: 0.14 }));
  },
  gameOver: (a) => {
    [392, 370, 349, 311].forEach((f, i) =>
      a.tone({ type: 'sawtooth', freq: f, freqEnd: f * 0.97, start: i * 0.38, dur: i === 3 ? 0.9 : 0.35, vol: 0.16 }),
    );
  },
};
