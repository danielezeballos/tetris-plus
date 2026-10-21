import { COLS, TOTAL_ROWS, type PieceKind } from './constants';
import type { ActivePiece } from './tetromino';
import { getCells } from './tetromino';

export type Cell = PieceKind | null;

export function createBoard(): Cell[][] {
  return Array.from({ length: TOTAL_ROWS }, () =>
    Array.from({ length: COLS }, () => null),
  );
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < COLS && y >= 0 && y < TOTAL_ROWS;
}

export function collides(
  board: Cell[][],
  piece: ActivePiece,
  offsetX = 0,
  offsetY = 0,
): boolean {
  const cells = getCells(piece);
  const occupying = new Set(cells.map(([cx, cy]) => `${cx},${cy}`));
  for (const [x, y] of cells) {
    const nx = x + offsetX;
    const ny = y + offsetY;
    if (nx < 0 || nx >= COLS) return true;
    if (ny >= TOTAL_ROWS) return true;
    if (ny >= 0 && board[ny][nx] !== null) {
      const moving = offsetX !== 0 || offsetY !== 0;
      if (!moving || !occupying.has(`${nx},${ny}`)) return true;
    }
  }
  return false;
}

export function lockPiece(board: Cell[][], piece: ActivePiece): void {
  for (const [x, y] of getCells(piece)) {
    if (inBounds(x, y)) {
      board[y][x] = piece.kind;
    }
  }
}

export function findFullRows(board: Cell[][]): number[] {
  const rows: number[] = [];
  for (let y = 0; y < TOTAL_ROWS; y++) {
    if (board[y].every((c) => c !== null)) rows.push(y);
  }
  return rows;
}

export function isRowFull(board: Cell[][], y: number): boolean {
  return board[y].every((c) => c !== null);
}

/** Remove specific row indices (bottom-up) then any other full rows. */
export function clearFullRows(board: Cell[][]): number {
  let cleared = 0;
  for (let y = TOTAL_ROWS - 1; y >= 0; y--) {
    if (isRowFull(board, y)) {
      board.splice(y, 1);
      board.unshift(Array.from({ length: COLS }, () => null));
      cleared++;
      y++;
    }
  }
  return cleared;
}

export function removeRows(board: Cell[][], rows: number[]): number {
  const unique = [...new Set(rows)].sort((a, b) => b - a);
  let removed = 0;
  for (const y of unique) {
    if (y < 0 || y >= board.length) continue;
    board.splice(y, 1);
    board.unshift(Array.from({ length: COLS }, () => null));
    removed++;
  }
  return removed;
}

/** @deprecated alias */
export function clearLines(board: Cell[][]): number {
  return clearFullRows(board);
}

export function ghostY(board: Cell[][], piece: ActivePiece): number {
  let drop = 0;
  while (!collides(board, piece, 0, drop + 1)) {
    drop++;
  }
  return piece.y + drop;
}
