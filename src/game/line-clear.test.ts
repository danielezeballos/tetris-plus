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
import { createBoard, findFullRows } from './board';
import { advanceLineClear, createInitialState } from './engine';
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
    state.lineClear = createLineClearEffect(
      findFullRows(state.board).flatMap((y) =>
        Array.from({ length: COLS }, (_, x) => ({
          x,
          y,
          kind: 'I' as const,
        })),
      ),
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

  it('gameTick advances line clear without an active piece', () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.board = boardWithFullBottomRow();
    state.lineClear = createLineClearEffect([{ x: 0, y: 21, kind: 'T' }]);
    gameTick(state, LINE_CLEAR_ANIM_MS);
    expect(state.lineClear).toBeNull();
  });
});
