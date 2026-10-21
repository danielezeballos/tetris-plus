import './style.css';
import {
  createInitialState,
  startGame,
  togglePause,
  type GameState,
} from './game/engine';
import { bindKeyboard, updateInput } from './game/input';
import { gameTick } from './game/tick';
import { drawPreview, drawWell } from './game/renderer';
import { bindCustomizePanel } from './customize';
import { computeFitCellSize } from './layout-fit';
import { initPieceColors } from './piece-colors';
import { initSound, isMuted, muteToggleLabel, toggleMute } from './sound';
import {
  initTheme,
  isDarkTheme,
  themeToggleLabel,
  toggleTheme,
} from './theme';
import {
  fetchLeaderboards,
  formatLeaderboardError,
  formatLeaderboardLoading,
  formatLeaderboardRows,
  MAX_NAME_LENGTH,
  scoreQualifiesForSubmission,
  submitLeaderboardScore,
  type LeaderboardsView,
} from './leaderboards';

type BoardsLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: LeaderboardsView }
  | { status: 'error'; message: string };

initTheme();
initSound();
initPieceColors();

const state: GameState = createInitialState();

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="shell">
    <main class="layout">
      <aside class="panel panel-left">
        <div class="block">
          <span class="label">Hold</span>
          <canvas id="hold-canvas"></canvas>
        </div>
      </aside>
      <section class="well-wrap">
        <canvas id="well" aria-label="Playfield"></canvas>
        <div id="overlay" class="overlay hidden">
          <div class="overlay-card">
            <h2 id="overlay-title"></h2>
            <p id="overlay-body"></p>
            <div id="name-prompt" class="name-prompt hidden">
              <p class="name-prompt-label">Top 5 — your name</p>
              <input
                id="name-input"
                class="name-input"
                type="text"
                maxlength="40"
                autocomplete="name"
                placeholder="Anonymous if blank"
              />
              <button type="button" id="name-submit" class="primary-btn name-submit">
                Save score
              </button>
            </div>
            <div id="leaderboards" class="leaderboards hidden">
              <div class="lb-block">
                <span class="lb-heading">All-time</span>
                <ol id="lb-alltime" class="lb-list"></ol>
              </div>
              <div class="lb-block">
                <span class="lb-heading">Today</span>
                <ol id="lb-today" class="lb-list"></ol>
              </div>
              <button type="button" id="lb-retry" class="lb-retry hidden">
                Retry leaderboards
              </button>
            </div>
            <button type="button" id="overlay-btn" class="primary-btn"></button>
          </div>
        </div>
      </section>
      <aside class="panel panel-right">
        <div class="block">
          <span class="label">Next</span>
          <div id="next-queue" class="next-queue"></div>
        </div>
        <div class="block stats-block">
          <div class="stat-line"><span class="label">Score</span><strong id="score">0</strong></div>
          <div class="stat-line"><span class="label">Level</span><strong id="level">1</strong></div>
          <div class="stat-line"><span class="label">Lines</span><strong id="lines">0</strong></div>
        </div>
      </aside>
    </main>
    <footer class="page-foot">
      <p class="hint">Enter start · Esc pause · Arrows move · Space drop · Z/Ctrl CCW · X/↑ CW · A 180° · C/Shift hold · R restart</p>
      <div class="foot-controls">
        <button type="button" id="theme-toggle" class="theme-toggle" aria-pressed="false"></button>
        <button type="button" id="sound-toggle" class="theme-toggle" aria-pressed="false"></button>
        <div class="customize-wrap">
          <button type="button" id="customize-toggle" class="theme-toggle" aria-expanded="false">Customize</button>
          <div id="customize-panel" class="customize-panel hidden" role="dialog" aria-label="Piece colors">
            <div class="customize-head">
              <span class="label">Pieces</span>
              <button type="button" id="customize-close" class="theme-toggle">Close</button>
            </div>
            <div id="customize-rows" class="customize-rows"></div>
            <button type="button" id="customize-reset" class="theme-toggle customize-reset">Reset defaults</button>
          </div>
        </div>
      </div>
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
const namePrompt = document.querySelector<HTMLDivElement>('#name-prompt')!;
const nameInput = document.querySelector<HTMLInputElement>('#name-input')!;
const nameSubmit = document.querySelector<HTMLButtonElement>('#name-submit')!;
const leaderboardsEl = document.querySelector<HTMLDivElement>('#leaderboards')!;
const lbAllTime = document.querySelector<HTMLOListElement>('#lb-alltime')!;
const lbToday = document.querySelector<HTMLOListElement>('#lb-today')!;
const lbRetry = document.querySelector<HTMLButtonElement>('#lb-retry')!;
const themeToggle = document.querySelector<HTMLButtonElement>('#theme-toggle')!;
const soundToggle = document.querySelector<HTMLButtonElement>('#sound-toggle')!;

function syncThemeButton(): void {
  const dark = isDarkTheme();
  themeToggle.textContent = themeToggleLabel(dark ? 'dark' : 'light');
  themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
}

function syncSoundButton(): void {
  const muted = isMuted();
  soundToggle.textContent = muteToggleLabel(muted);
  soundToggle.setAttribute('aria-pressed', muted ? 'true' : 'false');
}

app.addEventListener(
  'pointerup',
  (e) => {
    if (e.pointerType === 'mouse' || e.pointerType === 'pen' || e.pointerType === 'touch') {
      const el = e.target;
      if (el instanceof Element) {
        const control = el.closest('button, a');
        if (control instanceof HTMLElement) {
          control.blur();
        }
      }
    }
  },
  true,
);

syncThemeButton();
syncSoundButton();
themeToggle.addEventListener('click', () => {
  toggleTheme();
  syncThemeButton();
  fitViewport();
});
soundToggle.addEventListener('click', () => {
  toggleMute();
  syncSoundButton();
});

for (let i = 0; i < 5; i++) {
  const c = document.createElement('canvas');
  c.className = 'next-piece';
  nextQueue.appendChild(c);
}

let boardsState: BoardsLoadState = { status: 'idle' };
let boardsFetchGen = 0;
let gameOverHandled = false;
let pauseBoardsHandled = false;
let pendingScoreSubmit = false;

function overlayShowsLeaderboards(): boolean {
  return state.phase === 'paused' || state.phase === 'gameover';
}

function renderLeaderboards(): void {
  if (!overlayShowsLeaderboards()) {
    leaderboardsEl.classList.add('hidden');
    lbRetry.classList.add('hidden');
    return;
  }
  leaderboardsEl.classList.remove('hidden');
  if (boardsState.status === 'loading') {
    lbAllTime.innerHTML = formatLeaderboardLoading();
    lbToday.innerHTML = formatLeaderboardLoading();
    lbRetry.classList.add('hidden');
    return;
  }
  if (boardsState.status === 'error') {
    const msg = boardsState.message;
    lbAllTime.innerHTML = formatLeaderboardError(msg);
    lbToday.innerHTML = formatLeaderboardError(msg);
    lbRetry.classList.remove('hidden');
    return;
  }
  if (boardsState.status === 'ready') {
    lbAllTime.innerHTML = formatLeaderboardRows(boardsState.data.allTime);
    lbToday.innerHTML = formatLeaderboardRows(boardsState.data.today);
    lbRetry.classList.add('hidden');
    return;
  }
  lbAllTime.innerHTML = formatLeaderboardLoading();
  lbToday.innerHTML = formatLeaderboardLoading();
  lbRetry.classList.add('hidden');
}

async function refreshLeaderboards(): Promise<void> {
  const gen = ++boardsFetchGen;
  boardsState = { status: 'loading' };
  renderLeaderboards();
  try {
    const data = await fetchLeaderboards();
    if (gen !== boardsFetchGen) return;
    boardsState = { status: 'ready', data };
  } catch {
    if (gen !== boardsFetchGen) return;
    boardsState = {
      status: 'error',
      message: 'Could not load leaderboards',
    };
  }
  renderLeaderboards();
}

function setNamePromptVisible(visible: boolean): void {
  namePrompt.classList.toggle('hidden', !visible);
  if (visible) {
    nameInput.value = '';
    window.setTimeout(() => nameInput.focus(), 0);
  }
}

function applyQualifyingScorePrompt(score: number): void {
  if (boardsState.status !== 'ready') {
    pendingScoreSubmit = false;
    setNamePromptVisible(false);
    return;
  }
  pendingScoreSubmit = scoreQualifiesForSubmission(boardsState.data, score);
  setNamePromptVisible(pendingScoreSubmit);
}

async function handleGameOver(): Promise<void> {
  const score = state.score;
  await refreshLeaderboards();
  applyQualifyingScorePrompt(score);
  updateOverlay();
}

async function handlePauseLeaderboards(): Promise<void> {
  await refreshLeaderboards();
  updateOverlay();
}

function updateOverlay(): void {
  const { phase } = state;
  if (phase === 'playing') {
    overlay.classList.add('hidden');
    return;
  }
  overlay.classList.remove('hidden');
  if (phase === 'start') {
    leaderboardsEl.classList.add('hidden');
    setNamePromptVisible(false);
    overlayTitle.textContent = 'tetris.plus';
    overlayBody.textContent = 'Clear lines to score. Speed increases every 10 lines.';
    overlayBtn.textContent = 'Start';
  } else if (phase === 'paused') {
    setNamePromptVisible(false);
    overlayTitle.textContent = 'Paused';
    overlayBody.textContent = '';
    overlayBtn.textContent = 'Resume';
    renderLeaderboards();
  } else {
    overlayTitle.textContent = 'Game over';
    overlayBody.textContent = `${state.score.toLocaleString()} points · level ${state.level}`;
    overlayBtn.textContent = 'Play again';
    renderLeaderboards();
  }
}

function onPhaseChange(): void {
  if (state.phase === 'gameover' && !gameOverHandled) {
    gameOverHandled = true;
    void handleGameOver();
  }
  if (state.phase === 'paused' && !pauseBoardsHandled) {
    pauseBoardsHandled = true;
    void handlePauseLeaderboards();
  }
  if (state.phase === 'playing') {
    pauseBoardsHandled = false;
    boardsState = { status: 'idle' };
    boardsFetchGen++;
  }
  if (state.phase !== 'gameover') {
    gameOverHandled = false;
    if (state.phase !== 'paused') {
      pendingScoreSubmit = false;
      setNamePromptVisible(false);
    }
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
  onPhaseChange();
  updateOverlay();
}

bindCustomizePanel(render);

function fitViewport(): void {
  computeFitCellSize(render);
}

let resizeTimer = 0;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(fitViewport, 50);
});

async function savePendingScore(): Promise<void> {
  if (!pendingScoreSubmit || state.phase !== 'gameover') return;
  const score = state.score;
  const name = nameInput.value.slice(0, MAX_NAME_LENGTH);
  pendingScoreSubmit = false;
  setNamePromptVisible(false);
  try {
    const result = await submitLeaderboardScore(score, name);
    boardsState = { status: 'ready', data: result.boards };
  } catch {
    boardsState = {
      status: 'error',
      message: 'Could not save score',
    };
  }
  renderLeaderboards();
}

lbRetry.addEventListener('click', () => {
  if (!overlayShowsLeaderboards()) return;
  if (state.phase === 'gameover') {
    void handleGameOver();
  } else if (state.phase === 'paused') {
    void handlePauseLeaderboards();
  }
});

nameSubmit.addEventListener('click', () => {
  void savePendingScore();
});
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    void savePendingScore();
  }
});

overlayBtn.addEventListener('click', () => {
  if (state.phase === 'start') startGame(state);
  else if (state.phase === 'paused') togglePause(state);
  else if (state.phase === 'gameover') {
    if (pendingScoreSubmit) void savePendingScore();
    startGame(state);
  }
});

bindKeyboard(state);

let last = performance.now();
function loop(now: number): void {
  const dt = Math.min(now - last, 50);
  last = now;
  updateInput(state, dt);
  gameTick(state, dt);
  render();
  requestAnimationFrame(loop);
}

fitViewport();
requestAnimationFrame(loop);

if (import.meta.env.DEV) {
  (globalThis as unknown as { __stackfall: { state: GameState } }).__stackfall =
    { state };
}
