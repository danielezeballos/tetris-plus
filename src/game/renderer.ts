import { COLS, HIDDEN_ROWS, PIECE_COLORS, VISIBLE_ROWS } from './constants';
import type { GameState } from './engine';
import { getGhostPiece } from './engine';
import type { Cell } from './board';
import { getCells, type ActivePiece } from './tetromino';
import type { PieceKind } from './constants';
import { isDarkTheme } from '../theme';

/** Playfield cell size (10×20 visible rows). */
export const CELL = 54.49;
/** Preview size tracks the prior layout so the stats column height stays fixed. */
const PREVIEW_CELL = 42;
export const PREVIEW_CANVAS_SIZE = 4 * PREVIEW_CELL;

function wellPalette() {
  const dark = isDarkTheme();
  return {
    fill: dark ? '#000000' : '#fafafa',
    grid: dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.11)',
    ghost: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
  };
}
const WELL_W = COLS * CELL;
const WELL_H = VISIBLE_ROWS * CELL;

export function wellDimensions(): { width: number; height: number; cell: number } {
  return { width: WELL_W, height: WELL_H, cell: CELL };
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: PieceKind | 'ghost',
  size: number,
): void {
  const pad = 2;
  const { ghost } = wellPalette();
  const color = kind === 'ghost' ? ghost : PIECE_COLORS[kind];
  ctx.fillStyle = color;
  ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
  if (kind !== 'ghost') {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x + pad, y + pad, size - pad * 2, 3);
  }
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: ActivePiece,
  offsetY: number,
  ghost = false,
): void {
  for (const [cx, cy] of getCells(piece)) {
    const row = cy - HIDDEN_ROWS;
    if (row < 0 || row >= VISIBLE_ROWS) continue;
    drawCell(
      ctx,
      cx * CELL,
      row * CELL + offsetY,
      ghost ? 'ghost' : piece.kind,
      CELL,
    );
  }
}

function drawBoard(ctx: CanvasRenderingContext2D, board: Cell[][]): void {
  for (let y = HIDDEN_ROWS; y < HIDDEN_ROWS + VISIBLE_ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = board[y][x];
      const row = y - HIDDEN_ROWS;
      if (cell) {
        drawCell(ctx, x * CELL, row * CELL, cell, CELL);
      }
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = wellPalette().grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, WELL_H);
    ctx.stroke();
  }
  for (let y = 0; y <= VISIBLE_ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(WELL_W, y * CELL);
    ctx.stroke();
  }
}

export function drawWell(
  canvas: HTMLCanvasElement,
  state: GameState,
): void {
  const ctx = canvas.getContext('2d')!;
  canvas.width = WELL_W;
  canvas.height = WELL_H;

  ctx.fillStyle = wellPalette().fill;
  ctx.fillRect(0, 0, WELL_W, WELL_H);

  drawGrid(ctx);
  drawBoard(ctx, state.board);

  const ghost = getGhostPiece(state);
  if (ghost && state.phase === 'playing') {
    drawPiece(ctx, ghost, 0, true);
  }
  if (state.active && state.phase !== 'start') {
    drawPiece(ctx, state.active, 0, false);
  }
}

export function drawPreview(
  canvas: HTMLCanvasElement,
  kind: PieceKind | null,
  label: string,
): void {
  const size = PREVIEW_CANVAS_SIZE;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  if (!kind) return;
  const piece = { kind, rotation: 0, x: 0, y: 0 };
  const cells = getCells(piece);
  const minX = Math.min(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  const cell = PREVIEW_CELL;
  const ox = (size - 4 * cell) / 2;
  const oy = (size - 4 * cell) / 2;
  for (const [cx, cy] of cells) {
    const px = ox + (cx - minX) * cell;
    const py = oy + (cy - minY) * cell;
    ctx.fillStyle = PIECE_COLORS[kind];
    ctx.fillRect(px + 2, py + 2, cell - 4, cell - 4);
  }
  canvas.setAttribute('aria-label', label);
}
