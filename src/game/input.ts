import { DAS_MS } from './constants';
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
}

const das: DasState = {
  left: false,
  right: false,
  down: false,
  leftTimer: 0,
  rightTimer: 0,
  downTimer: 0,
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
      das.left = true;
      if (!e.repeat) handleAction(state, 'left');
    } else if (action === 'right') {
      das.right = true;
      if (!e.repeat) handleAction(state, 'right');
    } else if (action === 'down') {
      das.down = true;
      if (!e.repeat) handleAction(state, 'down');
    } else if (!e.repeat) {
      handleAction(state, action);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') {
      das.left = false;
      das.leftTimer = 0;
    }
    if (e.key === 'ArrowRight') {
      das.right = false;
      das.rightTimer = 0;
    }
    if (e.key === 'ArrowDown') {
      das.down = false;
      das.downTimer = 0;
    }
  });
}

export function updateInput(state: GameState, dtMs: number): void {
  const step = (dir: Dir): void => {
    if (dir === 'left') tryMove(state, -1, 0);
    if (dir === 'right') tryMove(state, 1, 0);
    if (dir === 'down') tryMove(state, 0, 1);
  };

  const process = (
    held: boolean,
    timer: number,
    dir: Dir,
  ): number => {
    if (!held || state.phase !== 'playing') return 0;
    let t = timer + dtMs;
    if (t >= DAS_MS) {
      step(dir);
      return 0;
    }
    return t;
  };

  das.leftTimer = process(das.left, das.leftTimer, 'left');
  das.rightTimer = process(das.right, das.rightTimer, 'right');
  das.downTimer = process(das.down, das.downTimer, 'down');
}

export function bindTouchButtons(state: GameState): void {
  document.querySelectorAll<HTMLElement>('[data-action]').forEach((el) => {
    const action = el.dataset.action!;
    const fire = () => handleAction(state, action);
    el.addEventListener('click', (e) => {
      e.preventDefault();
      fire();
    });
    el.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        fire();
      },
      { passive: false },
    );
  });
}
