export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const TOTAL_ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

export const NEXT_QUEUE_SIZE = 5;

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export const DAS_MS = 133;
export const ARR_MS = 0;

export const SOFT_DROP_SCORE = 1;
export const HARD_DROP_SCORE = 2;

export const LINE_SCORES = [0, 100, 300, 500, 800] as const;

/** Drop interval in ms per level (marathon-style curve). */
export function gravityMs(level: number): number {
  const table = [
    800, 717, 633, 550, 467, 383, 300, 217, 133, 100, 83, 67, 50, 33, 17,
  ];
  const idx = Math.min(Math.max(level - 1, 0), table.length - 1);
  return table[idx];
}

export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export const PIECE_KINDS: PieceKind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** Distinct palette — not guideline tetromino colors. */
export const PIECE_COLORS: Record<PieceKind, string> = {
  I: '#e85d75',
  O: '#f4b860',
  T: '#9b6dff',
  S: '#5ec98a',
  Z: '#ff7eb9',
  J: '#4a9eff',
  L: '#c17cff',
};
