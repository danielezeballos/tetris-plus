import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({
  sounds: { move: vi.fn(), rotate: vi.fn(), softDrop: vi.fn() },
}));

import { DAS_HORIZONTAL_MS, ARR_HORIZONTAL_MS } from './constants';
import { createInitialState } from './engine';
import {
  inputHorizontalHeld,
  pressHorizontal,
  processHorizontalDas,
  resetInputDas,
} from './input';

describe('horizontal input', () => {
  beforeEach(() => {
    resetInputDas();
  });

  it('releases opposite direction when pressing a new horizontal key', () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.active = { kind: 'O', rotation: 0, x: 4, y: 0 };

    pressHorizontal('left', state);
    expect(inputHorizontalHeld()).toEqual({ left: true, right: false });

    pressHorizontal('right', state);
    expect(inputHorizontalHeld()).toEqual({ left: false, right: true });
  });

  it('fires one repeat step after DAS then one per ARR window', () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.active = { kind: 'O', rotation: 0, x: 4, y: 0 };
    pressHorizontal('right', state);
    const x0 = state.active!.x;

    processHorizontalDas(state, DAS_HORIZONTAL_MS - 1);
    expect(state.active!.x).toBe(x0);

    processHorizontalDas(state, 1);
    expect(state.active!.x).toBe(x0 + 1);

    const x1 = state.active!.x;
    processHorizontalDas(state, ARR_HORIZONTAL_MS - 1);
    expect(state.active!.x).toBe(x1);

    processHorizontalDas(state, 1);
    expect(state.active!.x).toBe(x1 + 1);
  });

  it('never moves two columns in one processHorizontalDas call', () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.active = { kind: 'O', rotation: 0, x: 2, y: 0 };
    pressHorizontal('right', state);
    const x0 = state.active!.x;
    processHorizontalDas(state, DAS_HORIZONTAL_MS + ARR_HORIZONTAL_MS * 3);
    expect(state.active!.x).toBe(x0 + 1);
  });
});
