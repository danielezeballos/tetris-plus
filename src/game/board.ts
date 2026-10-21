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
  for (const [x, y] of getCells(piece)) {
    const nx = x + offsetX;
    const ny = y + offsetY;
    if (nx < 0 || nx >= COLS) return true;
    if (ny >= TOTAL_ROWS) return true;
    if (ny >= 0 && board[ny][nx] !== null) return true;
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

export function clearLines(board: Cell[][]): number {
  let cleared = 0;
  for (let y = TOTAL_ROWS - 1; y >= 0; y--) {
    if (board[y].every((c) => c !== null)) {
      board.splice(y, 1);
      board.unshift(Array.from({ length: COLS }, () => null));
      cleared++;
      y++;
    }
  }
  return cleared;
}

export function ghostY(board: Cell[][], piece: ActivePiece): number {
  let drop = 0;
  while (!collides(board, piece, 0, drop + 1)) {
    drop++;
  }
  return piece.y + drop;
}
