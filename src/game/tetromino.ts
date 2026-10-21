import type { PieceKind } from './constants';

/** Each rotation: list of [x, y] mino offsets in a 4×4 box (SRS). */
const SHAPES: Record<PieceKind, readonly (readonly [number, number])[][]> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [2, 1], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [1, 1], [0, 1], [0, 2]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
};

export interface ActivePiece {
  kind: PieceKind;
  rotation: number;
  x: number;
  y: number;
}

export function getCells(piece: ActivePiece): [number, number][] {
  const rot = ((piece.rotation % 4) + 4) % 4;
  return SHAPES[piece.kind][rot].map(([dx, dy]) => [
    piece.x + dx,
    piece.y + dy,
  ]);
}

export function spawnPiece(kind: PieceKind): ActivePiece {
  const offsets: Record<PieceKind, [number, number]> = {
    I: [3, 0],
    O: [4, 0],
    T: [3, 0],
    S: [3, 0],
    Z: [3, 0],
    J: [3, 0],
    L: [3, 0],
  };
  const [x, y] = offsets[kind];
  return { kind, rotation: 0, x, y };
}
