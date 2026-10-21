import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({
  sounds: { move: vi.fn(), rotate: vi.fn(), softDrop: vi.fn() },
}));

import { createInitialState } from './engine';
import {
  inputHorizontalHeld,
  pressHorizontal,
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
});
