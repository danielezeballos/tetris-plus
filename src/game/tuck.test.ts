import { describe, expect, it, vi } from 'vitest';

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

import { collides, createBoard } from './board';
import { createInitialState, tryMove } from './engine';
import { LOCK_DELAY_MS } from './constants';
import { getCells } from './tetromino';

/** Pink bar cols 1–3, empty tuck cell (4,floor), green stack on the right. */
function overhangBoard() {
  const board = createBoard();
  const floor = board.length - 1;
  for (let x = 1; x <= 3; x++) board[floor][x] = 'T';
  board[floor][5] = 'S';
  board[floor][6] = 'S';
  board[floor - 1][5] = 'S';
  board[floor - 1][6] = 'S';
  board[floor - 2][6] = 'S';
  return board;
}

describe('tuck under overhang', () => {
  it('slides sideways into the gap under an overhang while grounded', () => {
    const board = overhangBoard();
    const floor = board.length - 1;
    expect(board[floor][4]).toBe(null);

    const state = createInitialState();
    state.phase = 'playing';
    state.board = board;
    state.active = { kind: 'T', rotation: 0, x: 1, y: floor - 1 };
    state.onGround = true;
    state.lockTimer = LOCK_DELAY_MS - 1;

    expect(collides(board, state.active!, 1, 0)).toBe(false);
    expect(tryMove(state, 1, 0)).toBe(true);
    expect(state.lockTimer).toBe(LOCK_DELAY_MS);

    expect(
      getCells(state.active!).some(([cx, cy]) => cx === 4 && cy === floor),
    ).toBe(true);
    expect(board[floor][4]).toBe(null);

    expect(tryMove(state, 0, 1)).toBe(false);
    expect(collides(board, state.active!, 1, 0)).toBe(true);
  });
});
