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

import { COLS, LINE_CLEAR_ANIM_MS } from './constants';
import { createBoard, findFullRows, isRowFull } from './board';
import {
  advanceLineClear,
  createInitialState,
  hardDrop,
} from './engine';
import { createLineClearEffect } from './line-clear';
import { gameTick } from './tick';

function boardWithFullBottomRow() {
  const board = createBoard();
  const y = board.length - 1;
  for (let x = 0; x < COLS; x++) board[y][x] = 'I';
  return board;
}

describe('line clear animation', () => {
  it('defers spawn until animation completes', () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.board = boardWithFullBottomRow();
    state.active = null;
    const rows = findFullRows(state.board);
    state.lineClear = createLineClearEffect(
      rows.flatMap((y) =>
        Array.from({ length: COLS }, (_, x) => ({
          x,
          y,
          kind: 'I' as const,
        })),
      ),
      rows,
    );
    const nextBefore = state.nextQueue[0];

    advanceLineClear(state, LINE_CLEAR_ANIM_MS - 1);
    expect(state.active).toBeNull();
    expect(state.lineClear).not.toBeNull();

    advanceLineClear(state, 1);
    expect(state.lineClear).toBeNull();
    expect(state.active).not.toBeNull();
    expect(state.board[state.board.length - 1].every((c) => c === null)).toBe(
      true,
    );
    expect(state.nextQueue[0]).not.toBe(nextBefore);
  });

  it('locks a double and removes both rows after the animation', () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.board = createBoard();
    const y1 = state.board.length - 2;
    const y2 = state.board.length - 1;
    state.board[y1][0] = 'I';
    state.board[y2][0] = 'S';
    for (let x = 2; x < COLS; x++) {
      state.board[y1][x] = 'T';
      state.board[y2][x] = 'J';
    }
    state.board[y1 - 1][5] = 'O';
    state.board[y1 - 1][6] = 'O';
    state.active = { kind: 'O', rotation: 0, x: 0, y: y1 };
    state.bag.reset();
    state.nextQueue = state.bag.peek(5);

    hardDrop(state);
    expect(state.lineClear).not.toBeNull();
    expect(state.lineClear!.rows).toEqual([y1, y2]);
    expect(isRowFull(state.board, y1)).toBe(true);
    expect(isRowFull(state.board, y2)).toBe(true);

    advanceLineClear(state, LINE_CLEAR_ANIM_MS);
    expect(state.lineClear).toBeNull();
    expect(findFullRows(state.board)).toEqual([]);
  });

  it('gameTick advances line clear without an active piece', () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.board = boardWithFullBottomRow();
    state.lineClear = createLineClearEffect([{ x: 0, y: 21, kind: 'T' }], [
      21,
    ]);
    gameTick(state, LINE_CLEAR_ANIM_MS);
    expect(state.lineClear).toBeNull();
  });
});
