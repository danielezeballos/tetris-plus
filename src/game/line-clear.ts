import type { PieceKind } from './constants';
import { LINE_CLEAR_ANIM_MS } from './constants';

export interface LineClearCell {
  x: number;
  y: number;
  kind: PieceKind;
}

export interface LineClearEffect {
  cells: LineClearCell[];
  rows: number[];
  elapsed: number;
  duration: number;
}

export function createLineClearEffect(
  cells: LineClearCell[],
  rows: number[],
): LineClearEffect {
  return {
    cells,
    rows: [...rows].sort((a, b) => a - b),
    elapsed: 0,
    duration: LINE_CLEAR_ANIM_MS,
  };
}

export function lineClearProgress(effect: LineClearEffect): number {
  return Math.min(1, effect.elapsed / effect.duration);
}
