import { describe, expect, it } from 'vitest';
import {
  clearLines,
  collides,
  createBoard,
  ghostY,
} from './board';
import { COLS, PIECE_KINDS, TOTAL_ROWS } from './constants';
import type { ActivePiece } from './tetromino';
import { getCells } from './tetromino';

function piece(
  kind: ActivePiece['kind'],
  x: number,
  y: number,
  rotation = 0,
): ActivePiece {
  return { kind, x, y, rotation };
}

describe('collides', () => {
  it('allows minos above the hidden ceiling (y < 0)', () => {
    const board = createBoard();
    const i = piece('I', 3, -1, 0);
    expect(collides(board, i)).toBe(false);
  });

  it('blocks horizontal walls and floor', () => {
    const board = createBoard();
    expect(collides(board, piece('O', -2, 0))).toBe(true);
    expect(collides(board, piece('O', COLS - 3, 0))).toBe(false);
    expect(collides(board, piece('I', 3, TOTAL_ROWS - 1, 0), 0, 1)).toBe(
      true,
    );
  });

  it('flags overlap with stacked cells for each rotation', () => {
    const board = createBoard();
    board[12][6] = 'J';
    for (const kind of PIECE_KINDS) {
      if (kind === 'O') continue;
      for (let rot = 0; rot < 4; rot++) {
        const p = piece(kind, 5, 10, rot);
        const cells = getCells(p);
        const overlapsBlock = cells.some(([cx, cy]) => cx === 6 && cy === 12);
        const blocked = collides(board, p);
        if (overlapsBlock) {
          expect(blocked).toBe(true);
        } else {
          expect(blocked).toBe(false);
        }
      }
    }
  });
});

describe('clearLines', () => {
  it('removes full rows and drops rows above with no stray cells', () => {
    const board = createBoard();
    for (let x = 0; x < COLS; x++) {
      board[TOTAL_ROWS - 1][x] = 'I';
      board[TOTAL_ROWS - 2][x] = 'O';
    }
    board[TOTAL_ROWS - 2][0] = null;
    const cleared = clearLines(board);
    expect(cleared).toBe(1);
    expect(board[TOTAL_ROWS - 1][0]).toBe(null);
    for (let x = 1; x < COLS; x++) {
      expect(board[TOTAL_ROWS - 1][x]).toBe('O');
    }
    for (let y = 0; y < TOTAL_ROWS - 1; y++) {
      expect(board[y].every((c) => c === null)).toBe(true);
    }
  });
});

describe('ghostY', () => {
  it('uses the same collision as the active piece', () => {
    const board = createBoard();
    for (let x = 3; x < 7; x++) board[15][x] = 'Z';
    const active = piece('T', 3, 10, 0);
    const gy = ghostY(board, active);
    expect(gy).toBe(13);
    const ghost = { ...active, y: gy };
    expect(collides(board, ghost, 0, 1)).toBe(true);
    expect(collides(board, active, 0, gy - active.y + 1)).toBe(true);
  });
});
