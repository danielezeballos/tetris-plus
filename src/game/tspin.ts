import { COLS, LINE_SCORES, TOTAL_ROWS } from './constants';
import type { Cell } from './board';
import type { ActivePiece } from './tetromino';

/** Corner indices: 0 NW, 1 NE, 2 SW, 3 SE around T center. */
const FRONT_CORNER_IDX: Record<number, [number, number]> = {
  0: [0, 1],
  1: [1, 3],
  2: [2, 3],
  3: [0, 2],
};

function cornerFilled(board: Cell[][], x: number, y: number): boolean {
  if (x < 0 || x >= COLS || y < 0 || y >= TOTAL_ROWS) return true;
  return board[y][x] !== null;
}

/** After the T is locked on the board. */
export function classifyTSpin(
  board: Cell[][],
  piece: ActivePiece,
): 'full' | 'mini' | null {
  if (piece.kind !== 'T') return null;
  const rot = ((piece.rotation % 4) + 4) % 4;
  const cx = piece.x + 1;
  const cy = piece.y + 1;
  const corners = [
    [cx - 1, cy - 1],
    [cx + 1, cy - 1],
    [cx - 1, cy + 1],
    [cx + 1, cy + 1],
  ];
  const filled = corners.filter(([x, y]) => cornerFilled(board, x, y)).length;
  if (filled < 3) return null;
  const [a, b] = FRONT_CORNER_IDX[rot];
  const frontFilled =
    cornerFilled(board, corners[a][0], corners[a][1]) &&
    cornerFilled(board, corners[b][0], corners[b][1]);
  return frontFilled ? 'full' : 'mini';
}

export function tSpinLinePoints(
  lines: number,
  mini: boolean,
  level: number,
): number {
  if (lines === 0) return (mini ? 100 : 400) * level;
  if (lines === 1) return 200 * level;
  if (lines === 2) return 1_200 * level;
  if (lines === 3) return 1_600 * level;
  return 0;
}

export function isDifficultClear(
  lines: number,
  pieceKind: ActivePiece['kind'],
  tSpin: 'full' | 'mini' | null,
): boolean {
  if (lines === 4 && pieceKind === 'I') return true;
  return tSpin !== null && lines >= 1;
}

export function computeLockPoints(
  cleared: number,
  locked: ActivePiece,
  tSpin: 'full' | 'mini' | null,
  levelBefore: number,
  backToBack: boolean,
): { points: number; difficult: boolean } {
  let points = 0;
  if (tSpin) {
    points = tSpinLinePoints(cleared, tSpin === 'mini', levelBefore);
  } else if (cleared > 0) {
    const idx = Math.min(cleared, LINE_SCORES.length - 1);
    points = LINE_SCORES[idx] * levelBefore;
  }
  const difficult = isDifficultClear(cleared, locked.kind, tSpin);
  if (difficult && backToBack) {
    points = Math.floor((points * 3) / 2);
  }
  return { points, difficult };
}
