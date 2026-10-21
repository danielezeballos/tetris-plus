import type { PieceKind } from './constants';

type Kick = [number, number];

const JLSTZ_CW: Record<number, Kick[]> = {
  0: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  1: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  2: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  3: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
};

const I_CW: Record<number, Kick[]> = {
  0: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  1: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  2: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  3: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
};

/** SRS+ style 180° kicks (JLSTZ). */
const JLSTZ_180: Record<number, Kick[]> = {
  0: [[0, 0], [0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0], [0, -1]],
  1: [[0, 0], [1, 0], [1, -1], [-1, -1], [0, -1], [0, 1], [-1, 0]],
  2: [[0, 0], [0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1]],
  3: [[0, 0], [-1, 0], [-1, 1], [1, 1], [0, 1], [0, -1], [1, 0]],
};

const I_180: Record<number, Kick[]> = {
  0: [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-2, 0], [2, 0]],
  1: [[0, 0], [-1, 0], [1, 0], [0, 1], [0, -1], [0, 2], [0, -2]],
  2: [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0], [2, 0], [-2, 0]],
  3: [[0, 0], [1, 0], [-1, 0], [0, -1], [0, 1], [0, -2], [0, 2]],
};

function invertKicks(kicks: Kick[]): Kick[] {
  return kicks.map(([x, y]) => [-x, -y] as Kick);
}

export function getWallKicks(
  kind: PieceKind,
  fromRot: number,
  dir: 'cw' | 'ccw' | '180',
): Kick[] {
  const from = ((fromRot % 4) + 4) % 4;

  if (dir === '180') {
    const table = kind === 'I' ? I_180 : JLSTZ_180;
    return table[from];
  }

  const cwTable = kind === 'I' ? I_CW : JLSTZ_CW;
  if (dir === 'cw') {
    return cwTable[from];
  }
  const to = (from + 3) % 4;
  const forward = cwTable[to];
  return invertKicks(forward);
}

export function targetRotation(
  fromRot: number,
  dir: 'cw' | 'ccw' | '180',
): number {
  const from = ((fromRot % 4) + 4) % 4;
  if (dir === 'cw') return (from + 1) % 4;
  if (dir === 'ccw') return (from + 3) % 4;
  return (from + 2) % 4;
}
