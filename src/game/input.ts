import { ARR_HORIZONTAL_MS, DAS_HORIZONTAL_MS, DAS_MS } from './constants';
import type { GameState } from './engine';
import {
  hardDrop,
  holdPiece,
  startGame,
  togglePause,
  tryMove,
  tryRotate,
} from './engine';

type Dir = 'left' | 'right' | 'down';

interface DasState {
  left: boolean;
  right: boolean;
  down: boolean;
  leftTimer: number;
  rightTimer: number;
  downTimer: number;
  leftArr: boolean;
  rightArr: boolean;
}

const das: DasState = {
  left: false,
  right: false,
  down: false,
  leftTimer: 0,
  rightTimer: 0,
  downTimer: 0,
  leftArr: false,
  rightArr: false,
};

function handleAction(state: GameState, action: string): void {
  switch (action) {
    case 'start':
      if (state.phase === 'start' || state.phase === 'gameover') {
        startGame(state);
      } else if (state.phase === 'paused') {
        togglePause(state);
      }
      break;
    case 'pause':
      if (state.phase === 'playing' || state.phase === 'paused') {
        togglePause(state);
      }
      break;
    case 'restart':
      if (state.phase === 'gameover') startGame(state);
      break;
    case 'left':
      tryMove(state, -1, 0);
      break;
    case 'right':
      tryMove(state, 1, 0);
      break;
    case 'down':
      tryMove(state, 0, 1);
      break;
    case 'hardDrop':
      hardDrop(state);
      break;
    case 'rotateCW':
      tryRotate(state, 'cw');
      break;
    case 'rotateCCW':
      tryRotate(state, 'ccw');
      break;
    case 'rotate180':
      tryRotate(state, '180');
      break;
    case 'hold':
      holdPiece(state);
      break;
  }
}

const KEY_MAP: Record<string, string> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowUp: 'rotateCW',
  ' ': 'hardDrop',
  x: 'rotateCW',
  X: 'rotateCW',
  z: 'rotateCCW',
  Z: 'rotateCCW',
  a: 'rotate180',
  A: 'rotate180',
  c: 'hold',
  C: 'hold',
  Shift: 'hold',
  Escape: 'pause',
  Enter: 'start',
  r: 'restart',
  R: 'restart',
};

export function holdHorizontal(dir: 'left' | 'right'): void {
  if (dir === 'left') {
    releaseHorizontal('right');
    das.left = true;
    das.leftTimer = 0;
    das.leftArr = false;
  } else {
    releaseHorizontal('left');
    das.right = true;
    das.rightTimer = 0;
    das.rightArr = false;
  }
}

export function pressHorizontal(dir: 'left' | 'right', state: GameState): void {
  if (dir === 'left') {
    releaseHorizontal('right');
    das.left = true;
    das.leftTimer = 0;
    das.leftArr = false;
    handleAction(state, 'left');
  } else {
    releaseHorizontal('left');
    das.right = true;
    das.rightTimer = 0;
    das.rightArr = false;
    handleAction(state, 'right');
  }
}

function releaseHorizontal(dir: 'left' | 'right'): void {
  if (dir === 'left') {
    das.left = false;
    das.leftTimer = 0;
    das.leftArr = false;
  } else {
    das.right = false;
    das.rightTimer = 0;
    das.rightArr = false;
  }
}

export function bindKeyboard(state: GameState): void {
  window.addEventListener('keydown', (e) => {
    let action = KEY_MAP[e.key];
    if (e.key === 'Control' && !e.repeat) {
      action = 'rotateCCW';
    }
    if (!action) return;
    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowDown', ' '].includes(e.key) ||
      e.key === 'ArrowUp'
    ) {
      e.preventDefault();
    }
    if (action === 'left') {
      if (!e.repeat) pressHorizontal('left', state);
      else das.left = true;
    } else if (action === 'right') {
      if (!e.repeat) pressHorizontal('right', state);
      else das.right = true;
    } else if (action === 'down') {
      das.down = true;
      if (!e.repeat) handleAction(state, 'down');
    } else if (!e.repeat) {
      handleAction(state, action);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') releaseHorizontal('left');
    if (e.key === 'ArrowRight') releaseHorizontal('right');
    if (e.key === 'ArrowDown') {
      das.down = false;
      das.downTimer = 0;
    }
  });
}

function horizontalStep(dir: 'left' | 'right', state: GameState): void {
  if (dir === 'left') tryMove(state, -1, 0);
  if (dir === 'right') tryMove(state, 1, 0);
}

/** DAS/ARR for held left/right — call before gravity each frame. */
export function processHorizontalDas(state: GameState, dtMs: number): void {
  const processHorizontal = (
    held: boolean,
    timer: number,
    arrPhase: boolean,
    dir: 'left' | 'right',
  ): { timer: number; arrPhase: boolean } => {
    if (!held || state.phase !== 'playing') {
      return { timer: 0, arrPhase: false };
    }
    let t = timer + dtMs;
    if (!arrPhase) {
      if (t >= DAS_HORIZONTAL_MS) {
        horizontalStep(dir, state);
        return { timer: 0, arrPhase: true };
      }
      return { timer: t, arrPhase: false };
    }
    if (ARR_HORIZONTAL_MS <= 0) {
      horizontalStep(dir, state);
      return { timer: 0, arrPhase: true };
    }
    if (t >= ARR_HORIZONTAL_MS) {
      horizontalStep(dir, state);
      return { timer: 0, arrPhase: true };
    }
    return { timer: t, arrPhase: true };
  };

  const left = processHorizontal(
    das.left,
    das.leftTimer,
    das.leftArr,
    'left',
  );
  das.leftTimer = left.timer;
  das.leftArr = left.arrPhase;

  const right = processHorizontal(
    das.right,
    das.rightTimer,
    das.rightArr,
    'right',
  );
  das.rightTimer = right.timer;
  das.rightArr = right.arrPhase;
}

export function getDasHeld(): { left: boolean; right: boolean } {
  return { left: das.left, right: das.right };
}

export function updateInput(state: GameState, dtMs: number): void {
  const stepDown = (): void => {
    tryMove(state, 0, 1);
  };

  if (das.down && state.phase === 'playing') {
    das.downTimer += dtMs;
    if (das.downTimer >= DAS_MS) {
      stepDown();
      das.downTimer = 0;
    }
  } else {
    das.downTimer = 0;
  }
}

export function resetInputDas(): void {
  releaseHorizontal('left');
  releaseHorizontal('right');
  das.down = false;
  das.downTimer = 0;
}

export function inputHorizontalHeld(): { left: boolean; right: boolean } {
  return { left: das.left, right: das.right };
}

