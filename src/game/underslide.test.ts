import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('./audio', () => ({
  sounds: {
    move: vi.fn(),
    rotate: vi.fn(),
    softDrop: vi.fn(),
    lock: vi.fn(),
    lineClear: vi.fn(),
    levelUp: vi.fn(),
    gameOver: vi.fn(),
    start: vi.fn(),
    hold: vi.fn(),
    hardDrop: vi.fn(),
  },
}));

import { collides, createBoard, type Cell } from './board';
import {
  advanceLockDelay,
  applyGravity,
  createInitialState,
  tryMove,
} from './engine';
import { gameTick } from './tick';
import { gravityMs } from './constants';
import { getCells } from './tetromino';
import {
  getDasHeld,
  holdHorizontal,
  processHorizontalDas,
  resetInputDas,
} from './input';

/** Screenshot user-underslide-2: gap at (7,21), green overhang at (7,20). */
function underslideBoard(): Cell[][] {
  const board = createBoard();
  const F = board.length - 1;
  board[F][5] = 'S';
  board[F][6] = 'S';
  board[F - 1][6] = 'S';
  board[F - 1][7] = 'S';
  for (let y = F - 2; y >= F - 5; y--) board[y][6] = 'L';
  for (let y = F - 1; y >= F - 4; y--) board[y][5] = 'L';
  board[F - 5][5] = 'Z';
  return board;
}

/** Blue J from screenshot: rot 3 at (8,19) → (8,21)(9,19)(9,20)(9,21). */
const ACTIVE_J = { kind: 'J' as const, rotation: 3, x: 8, y: 19 };

describe('user underslide-2 board', () => {
  beforeEach(() => {
    resetInputDas();
  });

  it('J rot3 slides left into gap (7,21) while grounded', () => {
    const board = underslideBoard();
    expect(board[21][7]).toBe(null);
    expect(collides(board, ACTIVE_J, -1, 0)).toBe(false);

    const state = createInitialState();
    state.phase = 'playing';
    state.board = board;
    state.active = { ...ACTIVE_J };
    state.onGround = true;
    state.lockTimer = 100;

    expect(tryMove(state, -1, 0)).toBe(true);
    expect(getCells(state.active!).some(([cx, cy]) => cx === 7 && cy === 21)).toBe(
      true,
    );
  });

  it('tucks on landing frame when holding left (nudge after gravity)', () => {
    const board = underslideBoard();
    const state = createInitialState();
    state.phase = 'playing';
    state.board = board;
    state.active = { kind: 'J', rotation: 3, x: 8, y: 18 };
    state.onGround = false;
    state.lockTimer = 0;
    state.gravityAccumulator = gravityMs(1) - 1;

    holdHorizontal('left');
    processHorizontalDas(state, 1);
    applyGravity(state, 1);
    if (getDasHeld().left) tryMove(state, -1, 0);
    advanceLockDelay(state, 1);

    expect(state.active!.kind).toBe('J');
    expect(state.active!.y).toBe(19);
    expect(
      getCells(state.active!).some(([cx, cy]) => cx === 7 && cy === 21),
    ).toBe(true);
  });

  it('gameTick matches landing-frame tuck order', () => {
    const board = underslideBoard();
    const state = createInitialState();
    state.phase = 'playing';
    state.board = board;
    state.active = { kind: 'J', rotation: 3, x: 8, y: 18 };
    state.lockTimer = 0;
    state.gravityAccumulator = gravityMs(1) - 1;
    holdHorizontal('left');
    gameTick(state, 1);
    expect(
      getCells(state.active!).some(([cx, cy]) => cx === 7 && cy === 21),
    ).toBe(true);
  });
});
