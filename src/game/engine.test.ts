import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { LOCK_DELAY_MS } from './constants';
import {
  createInitialState,
  tryMove,
  updateGame,
  type GameState,
} from './engine';
import { createBoard } from './board';
import type { ActivePiece } from './tetromino';

function playingWithActive(active: ActivePiece): GameState {
  const state = createInitialState();
  state.phase = 'playing';
  state.board = createBoard();
  state.active = active;
  return state;
}

describe('lock delay and grounding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears lock timer when piece slides off a ledge horizontally', () => {
    const state = playingWithActive({
      kind: 'T',
      rotation: 0,
      x: 3,
      y: 18,
    });
    state.board[20][3] = 'I';
    state.onGround = true;
    state.lockTimer = 400;

    expect(tryMove(state, 2, 0)).toBe(true);
    expect(state.onGround).toBe(false);

    updateGame(state, 100);
    expect(state.lockTimer).toBe(0);
    expect(state.active).not.toBeNull();
  });

  it('does not lock in mid-air when stale onGround was true', () => {
    const state = playingWithActive({
      kind: 'T',
      rotation: 0,
      x: 5,
      y: 18,
    });
    state.onGround = true;
    state.lockTimer = LOCK_DELAY_MS - 50;

    updateGame(state, 100);
    expect(state.active).not.toBeNull();
    expect(state.lockTimer).toBe(0);
    expect(state.onGround).toBe(false);
  });

  it('locks only after grounded lock delay elapses', () => {
    const state = playingWithActive({
      kind: 'O',
      rotation: 0,
      x: 4,
      y: 20,
    });
    state.onGround = true;
    state.lockTimer = 0;

    updateGame(state, LOCK_DELAY_MS);
    expect(state.board[21][5]).toBe('O');
    expect(state.board[21][6]).toBe('O');
  });
});
