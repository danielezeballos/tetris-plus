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

import { createBoard, lockPiece } from './board';
import {
  advanceLockDelay,
  createInitialState,
  type GameState,
} from './engine';
import { LOCK_DELAY_MS } from './constants';
import {
  classifyTSpin,
  computeLockPoints,
} from './tspin';
import type { ActivePiece } from './tetromino';

function lockNow(state: GameState): void {
  state.onGround = true;
  state.lockTimer = LOCK_DELAY_MS;
  advanceLockDelay(state, LOCK_DELAY_MS);
}

describe('T-spin detection', () => {
  it('detects a full T-spin with three corners and both front corners filled', () => {
    const board = createBoard();
    const piece: ActivePiece = { kind: 'T', rotation: 0, x: 3, y: 11 };
    lockPiece(board, piece);
    board[11][3] = 'I';
    board[11][5] = 'I';
    board[13][3] = 'I';
    expect(classifyTSpin(board, piece)).toBe('full');
  });

  it('detects a mini when the front corner pair is not both filled', () => {
    const board = createBoard();
    const piece: ActivePiece = { kind: 'T', rotation: 0, x: 3, y: 11 };
    lockPiece(board, piece);
    board[11][3] = 'I';
    board[13][3] = 'I';
    board[13][5] = 'I';
    expect(classifyTSpin(board, piece)).toBe('mini');
  });
});

describe('T-spin scoring and back-to-back', () => {
  const lockedT: ActivePiece = { kind: 'T', rotation: 0, x: 0, y: 0 };

  it('awards 1,200 × level for a T-spin double', () => {
    const { points } = computeLockPoints(2, lockedT, 'full', 3, false);
    expect(points).toBe(3_600);
  });

  it('applies back-to-back bonus on consecutive difficult clears', () => {
    const tetris: ActivePiece = { kind: 'I', rotation: 0, x: 0, y: 0 };
    const first = computeLockPoints(4, tetris, null, 2, false);
    expect(first.points).toBe(1_600);
    expect(first.difficult).toBe(true);
    const second = computeLockPoints(4, tetris, null, 2, true);
    expect(second.points).toBe(2_400);
  });

  it('breaks back-to-back on a normal single', () => {
    const normal: ActivePiece = { kind: 'O', rotation: 0, x: 0, y: 0 };
    const { points, difficult } = computeLockPoints(1, normal, null, 5, true);
    expect(points).toBe(500);
    expect(difficult).toBe(false);
  });
});

describe('engine lock scoring', () => {
  it('scores a full zero-line T-spin after rotation without a follow-up move', () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.board = createBoard();
    state.active = { kind: 'T', rotation: 0, x: 3, y: 11 };
    state.bag.reset();
    state.nextQueue = state.bag.peek(5);
    state.board[11][3] = 'I';
    state.board[11][5] = 'I';
    state.board[13][3] = 'I';

    state.tSpinReady = true;
    state.onGround = true;
    lockNow(state);

    expect(state.score).toBe(400);
    expect(state.backToBack).toBe(false);
  });
});
