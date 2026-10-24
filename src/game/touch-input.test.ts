import { describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({
  sounds: {
    move: vi.fn(),
    rotate: vi.fn(),
    softDrop: vi.fn(),
    hardDrop: vi.fn(),
  },
}));

import { createInitialState } from './engine';
import { tryMove, tryRotate } from './engine';
describe('touch gestures map to game actions', () => {
  it('uses the same engine helpers as keyboard play', () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.active = { kind: 'T', rotation: 0, x: 4, y: 0 };

    tryMove(state, 1, 0);
    expect(state.active!.x).toBe(5);
    tryRotate(state, 'cw');
    tryMove(state, 0, 1);
    expect(state.active!.y).toBe(1);
  });
});
