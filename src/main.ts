import './style.css';
import {
  initTheme,
  isDarkTheme,
  themeToggleLabel,
  toggleTheme,
} from './theme';

initTheme();
import {
  createInitialState,
  startGame,
  togglePause,
  updateGame,
  type GameState,
} from './game/engine';
import { bindKeyboard, bindTouchButtons, updateInput } from './game/input';
import { drawPreview, drawWell } from './game/renderer';

const state: GameState = createInitialState();

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="shell">
    <main class="layout">
      <aside class="panel panel-left">
        <div class="block">
          <span class="label">Hold</span>
          <canvas id="hold-canvas" width="88" height="88"></canvas>
        </div>
        <div class="touch-col mobile-only">
          <button type="button" data-action="hold" class="touch-btn">Hold</button>
          <button type="button" data-action="rotateCCW" class="touch-btn">↺</button>
          <button type="button" data-action="rotateCW" class="touch-btn">↻</button>
        </div>
      </aside>
      <section class="well-wrap">
        <canvas id="well" aria-label="Playfield"></canvas>
        <div id="overlay" class="overlay hidden">
          <div class="overlay-card">
            <h2 id="overlay-title"></h2>
            <p id="overlay-body"></p>
            <button type="button" id="overlay-btn" class="primary-btn"></button>
          </div>
        </div>
      </section>
      <aside class="panel panel-right">
        <div class="block">
          <span class="label">Next</span>
          <div id="next-queue" class="next-queue"></div>
        </div>
        <div class="block">
          <div class="stat-line"><span class="label">Score</span><strong id="score">0</strong></div>
          <div class="stat-line"><span class="label">Level</span><strong id="level">1</strong></div>
          <div class="stat-line"><span class="label">Lines</span><strong id="lines">0</strong></div>
        </div>
        <div class="touch-pad mobile-only">
          <button type="button" data-action="left" class="touch-btn">←</button>
          <button type="button" data-action="down" class="touch-btn">↓</button>
          <button type="button" data-action="right" class="touch-btn">→</button>
          <button type="button" data-action="hardDrop" class="touch-btn wide">Drop</button>
        </div>
      </aside>
    </main>
    <footer class="page-foot">
      <p class="hint desktop-only">Enter start · Esc pause · Arrows move · Space drop · Z/Ctrl CCW · X/↑ CW · A 180° · C/Shift hold · R restart</p>
      <button type="button" id="theme-toggle" class="theme-toggle" aria-pressed="false"></button>
    </footer>
  </div>
`;

const wellCanvas = document.querySelector<HTMLCanvasElement>('#well')!;
const holdCanvas = document.querySelector<HTMLCanvasElement>('#hold-canvas')!;
const nextQueue = document.querySelector<HTMLDivElement>('#next-queue')!;
const overlay = document.querySelector<HTMLDivElement>('#overlay')!;
const overlayTitle = document.querySelector<HTMLHeadingElement>('#overlay-title')!;
const overlayBody = document.querySelector<HTMLParagraphElement>('#overlay-body')!;
const overlayBtn = document.querySelector<HTMLButtonElement>('#overlay-btn')!;
const themeToggle = document.querySelector<HTMLButtonElement>('#theme-toggle')!;

function syncThemeButton(): void {
  const dark = isDarkTheme();
  themeToggle.textContent = themeToggleLabel(dark ? 'dark' : 'light');
  themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
}

syncThemeButton();
themeToggle.addEventListener('click', () => {
  toggleTheme();
  syncThemeButton();
  render();
});

for (let i = 0; i < 5; i++) {
  const c = document.createElement('canvas');
  c.className = 'next-piece';
  c.width = 88;
  c.height = 88;
  nextQueue.appendChild(c);
}

function updateOverlay(): void {
  const { phase } = state;
  if (phase === 'playing') {
    overlay.classList.add('hidden');
    return;
  }
  overlay.classList.remove('hidden');
  if (phase === 'start') {
    overlayTitle.textContent = 'Stackfall';
    overlayBody.textContent = 'Clear lines to score. Speed increases every 10 lines.';
    overlayBtn.textContent = 'Start';
  } else if (phase === 'paused') {
    overlayTitle.textContent = 'Paused';
    overlayBody.textContent = '';
    overlayBtn.textContent = 'Resume';
  } else {
    overlayTitle.textContent = 'Game over';
    overlayBody.textContent = `${state.score.toLocaleString()} points · level ${state.level}`;
    overlayBtn.textContent = 'Play again';
  }
}

function renderHud(): void {
  document.querySelector<HTMLElement>('#score')!.textContent =
    state.score.toLocaleString();
  document.querySelector<HTMLElement>('#level')!.textContent = String(
    state.level,
  );
  document.querySelector<HTMLElement>('#lines')!.textContent = String(
    state.lines,
  );

  drawPreview(holdCanvas, state.hold, 'Hold piece');
  const canvases = nextQueue.querySelectorAll('canvas');
  state.nextQueue.forEach((kind, i) => {
    drawPreview(canvases[i] as HTMLCanvasElement, kind, `Next ${i + 1}`);
  });
}

function render(): void {
  drawWell(wellCanvas, state);
  renderHud();
  updateOverlay();
}

overlayBtn.addEventListener('click', () => {
  if (state.phase === 'start') startGame(state);
  else if (state.phase === 'paused') togglePause(state);
  else if (state.phase === 'gameover') startGame(state);
});

bindKeyboard(state);
bindTouchButtons(state);

let last = performance.now();
function loop(now: number): void {
  const dt = Math.min(now - last, 50);
  last = now;
  updateInput(state, dt);
  updateGame(state, dt);
  render();
  requestAnimationFrame(loop);
}

render();
requestAnimationFrame(loop);
