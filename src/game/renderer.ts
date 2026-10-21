import { COLS, HIDDEN_ROWS, VISIBLE_ROWS, type PieceKind } from './constants';
import { getPieceColor } from '../piece-colors';
import type { GameState } from './engine';
import { getGhostPiece } from './engine';
import type { Cell } from './board';
import { getCells, type ActivePiece } from './tetromino';
import { isDarkTheme } from '../theme';

let cellSize = 28;
let previewCell = 22;

function maxPreviewCellForWell(wellCell: number): number {
  const reserved = 158;
  const gaps = 44;
  const available = 20 * wellCell - reserved - gaps;
  return Math.max(4, Math.floor(available / 20));
}

export function setPlayfieldScale(wellCell: number): void {
  cellSize = wellCell;
  const ideal = Math.max(4, Math.round((wellCell * 22) / 28));
  previewCell = Math.min(ideal, maxPreviewCellForWell(wellCell));
}

export function getCellSize(): number {
  return cellSize;
}

export function getPreviewCanvasSize(): number {
  return 4 * previewCell;
}

function wellPalette() {
  const dark = isDarkTheme();
  return {
    fill: dark ? '#000000' : '#fafafa',
    grid: dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.11)',
    ghost: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
  };
}

export function wellDimensions(): {
  width: number;
  height: number;
  cell: number;
} {
  return {
    width: COLS * cellSize,
    height: VISIBLE_ROWS * cellSize,
    cell: cellSize,
  };
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
  const color = kind === 'ghost' ? ghost : getPieceColor(kind);
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
      cx * cellSize,
      row * cellSize + offsetY,
      ghost ? 'ghost' : piece.kind,
      cellSize,
    );
  }
}

function drawBoard(ctx: CanvasRenderingContext2D, board: Cell[][]): void {
  for (let y = HIDDEN_ROWS; y < HIDDEN_ROWS + VISIBLE_ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = board[y][x];
      const row = y - HIDDEN_ROWS;
      if (cell) {
        drawCell(ctx, x * cellSize, row * cellSize, cell, cellSize);
      }
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  const wellW = COLS * cellSize;
  const wellH = VISIBLE_ROWS * cellSize;
  ctx.strokeStyle = wellPalette().grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, wellH);
    ctx.stroke();
  }
  for (let y = 0; y <= VISIBLE_ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(wellW, y * cellSize);
    ctx.stroke();
  }
}

export function drawWell(
  canvas: HTMLCanvasElement,
  state: GameState,
): void {
  const wellW = COLS * cellSize;
  const wellH = VISIBLE_ROWS * cellSize;
  const ctx = canvas.getContext('2d')!;
  canvas.width = wellW;
  canvas.height = wellH;
  canvas.style.width = `${wellW}px`;
  canvas.style.height = `${wellH}px`;

  ctx.fillStyle = wellPalette().fill;
  ctx.fillRect(0, 0, wellW, wellH);

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
  const size = 4 * previewCell;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  if (!kind) return;
  const piece = { kind, rotation: 0, x: 0, y: 0 };
  const cells = getCells(piece);
  const minX = Math.min(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  const cell = previewCell;
  const ox = (size - 4 * cell) / 2;
  const oy = (size - 4 * cell) / 2;
  for (const [cx, cy] of cells) {
    const px = ox + (cx - minX) * cell;
    const py = oy + (cy - minY) * cell;
    ctx.fillStyle = getPieceColor(kind);
    ctx.fillRect(px + 2, py + 2, cell - 4, cell - 4);
  }
  canvas.setAttribute('aria-label', label);
}
