import { isMuted } from '../sound';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.08,
): void {
  if (isMuted()) return;
  const ac = getCtx();
  if (ac.state === 'suspended') {
    ac.resume();
  }
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ac.destination);
  const t = ac.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

export const sounds = {
  move: () => tone(220, 0.03, 'triangle', 0.04),
  rotate: () => tone(330, 0.04, 'triangle', 0.05),
  softDrop: () => {},
  hardDrop: () => tone(120, 0.08, 'sawtooth', 0.06),
  lock: () => tone(90, 0.06, 'square', 0.05),
  lineClear: (lines: number) => {
    const base = 400 + lines * 80;
    tone(base, 0.12, 'triangle', 0.07);
    setTimeout(() => tone(base * 1.25, 0.1, 'triangle', 0.06), 60);
  },
  hold: () => tone(280, 0.05, 'sine', 0.05),
  levelUp: () => {
    tone(520, 0.1, 'sine', 0.06);
    setTimeout(() => tone(660, 0.12, 'sine', 0.06), 80);
  },
  gameOver: () => {
    tone(200, 0.2, 'sawtooth', 0.07);
    setTimeout(() => tone(140, 0.35, 'sawtooth', 0.06), 150);
  },
  start: () => {
    tone(440, 0.08, 'sine', 0.06);
    setTimeout(() => tone(550, 0.1, 'sine', 0.06), 70);
  },
};
