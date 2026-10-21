import { PIECE_KINDS, type PieceKind } from './game/constants';

const STORAGE_KEY = 'stackfall-piece-colors';

export const DEFAULT_PIECE_COLORS: Record<PieceKind, string> = {
  I: '#e85d75',
  O: '#f4b860',
  T: '#9b6dff',
  S: '#5ec98a',
  Z: '#ff7eb9',
  J: '#4a9eff',
  L: '#c17cff',
};

let colors: Record<PieceKind, string> = { ...DEFAULT_PIECE_COLORS };

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function loadStored(): Record<PieceKind, string> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    const next = { ...DEFAULT_PIECE_COLORS };
    for (const kind of PIECE_KINDS) {
      const v = parsed[kind];
      if (v && isHexColor(v)) next[kind] = v;
    }
    return next;
  } catch {
    return null;
  }
}

function saveColors(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch {
    /* ignore */
  }
}

export function initPieceColors(): void {
  const stored = loadStored();
  colors = stored ?? { ...DEFAULT_PIECE_COLORS };
}

export function getPieceColor(kind: PieceKind): string {
  return colors[kind];
}

export function setPieceColor(kind: PieceKind, hex: string): void {
  if (!isHexColor(hex)) return;
  colors[kind] = hex;
  saveColors();
}

export function resetPieceColors(): void {
  colors = { ...DEFAULT_PIECE_COLORS };
  saveColors();
}

export function getAllPieceColors(): Record<PieceKind, string> {
  return { ...colors };
}
