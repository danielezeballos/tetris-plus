import type { PieceKind } from './constants';
import { LINE_CLEAR_ANIM_MS } from './constants';

export interface LineClearCell {
  x: number;
  y: number;
  kind: PieceKind;
}

export interface LineClearEffect {
  cells: LineClearCell[];
  elapsed: number;
  duration: number;
}

export function createLineClearEffect(
  cells: LineClearCell[],
): LineClearEffect {
  return { cells, elapsed: 0, duration: LINE_CLEAR_ANIM_MS };
}

export function lineClearProgress(effect: LineClearEffect): number {
  return Math.min(1, effect.elapsed / effect.duration);
}
