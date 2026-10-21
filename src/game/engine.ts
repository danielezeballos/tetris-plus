import { SevenBag } from './bag';
import {
  clearLines,
  collides,
  createBoard,
  ghostY,
  lockPiece,
  type Cell,
} from './board';
import {
  gravityMs,
  HARD_DROP_SCORE,
  LINE_SCORES,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  NEXT_QUEUE_SIZE,
  SOFT_DROP_SCORE,
} from './constants';
import { getWallKicks, targetRotation } from './srs';
import { spawnPiece, type ActivePiece } from './tetromino';
import { sounds } from './audio';

export type GamePhase = 'start' | 'playing' | 'paused' | 'gameover';

export interface GameState {
  phase: GamePhase;
  board: Cell[][];
  active: ActivePiece | null;
  bag: SevenBag;
  nextQueue: ReturnType<SevenBag['peek']>;
  hold: ActivePiece['kind'] | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  gravityAccumulator: number;
  lockTimer: number;
  lockResets: number;
  onGround: boolean;
}

export function createInitialState(): GameState {
  const bag = new SevenBag();
  return {
    phase: 'start',
    board: createBoard(),
    active: null,
    bag,
    nextQueue: bag.peek(NEXT_QUEUE_SIZE),
    hold: null,
    canHold: true,
    score: 0,
    level: 1,
    lines: 0,
    gravityAccumulator: 0,
    lockTimer: 0,
    lockResets: 0,
    onGround: false,
  };
}

function refreshQueue(state: GameState): void {
  state.nextQueue = state.bag.peek(NEXT_QUEUE_SIZE);
}

function spawnFromQueue(state: GameState): boolean {
  const kind = state.bag.next();
  refreshQueue(state);
  const piece = spawnPiece(kind);
  if (collides(state.board, piece)) {
    state.active = piece;
    return false;
  }
  state.active = piece;
  state.canHold = true;
  state.onGround = false;
  state.lockTimer = 0;
  state.lockResets = 0;
  return true;
}

export function startGame(state: GameState): void {
  state.phase = 'playing';
  state.board = createBoard();
  state.bag.reset();
  state.hold = null;
  state.score = 0;
  state.level = 1;
  state.lines = 0;
  state.gravityAccumulator = 0;
  refreshQueue(state);
  if (!spawnFromQueue(state)) {
    state.phase = 'gameover';
    sounds.gameOver();
  } else {
    sounds.start();
  }
}

export function togglePause(state: GameState): void {
  if (state.phase === 'playing') state.phase = 'paused';
  else if (state.phase === 'paused') state.phase = 'playing';
}

function applyLineClear(state: GameState, cleared: number): void {
  if (cleared === 0) return;
  const idx = Math.min(cleared, LINE_SCORES.length - 1);
  state.score += LINE_SCORES[idx] * state.level;
  state.lines += cleared;
  sounds.lineClear(cleared);
  const newLevel = Math.floor(state.lines / 10) + 1;
  if (newLevel > state.level) {
    state.level = newLevel;
    sounds.levelUp();
  }
}

function settlePiece(state: GameState): void {
  if (!state.active) return;
  lockPiece(state.board, state.active);
  sounds.lock();
  const cleared = clearLines(state.board);
  applyLineClear(state, cleared);
  state.active = null;
  state.onGround = false;
  if (!spawnFromQueue(state)) {
    state.phase = 'gameover';
    sounds.gameOver();
  }
}

function resetLock(state: GameState): void {
  if (state.lockResets < MAX_LOCK_RESETS) {
    state.lockTimer = 0;
    state.lockResets++;
  }
}

export function tryMove(state: GameState, dx: number, dy: number): boolean {
  if (state.phase !== 'playing' || !state.active) return false;
  if (collides(state.board, state.active, dx, dy)) return false;
  state.active.x += dx;
  state.active.y += dy;
  if (dx !== 0) sounds.move();
  if (dy > 0) {
    state.score += SOFT_DROP_SCORE;
    sounds.softDrop();
  }
  if (dx !== 0 || dy > 0) {
    state.onGround = collides(state.board, state.active, 0, 1);
  }
  if (state.onGround && (dx !== 0 || dy !== 0)) {
    resetLock(state);
  }
  return true;
}

export function tryRotate(
  state: GameState,
  dir: 'cw' | 'ccw' | '180',
): boolean {
  if (state.phase !== 'playing' || !state.active) return false;
  const piece = state.active;
  if (piece.kind === 'O') {
    if (state.onGround) resetLock(state);
    sounds.rotate();
    return true;
  }
  const fromRot = piece.rotation;
  const toRot = targetRotation(fromRot, dir);
  const kicks = getWallKicks(piece.kind, fromRot, dir);
  for (const [kx, ky] of kicks) {
    const trial = { ...piece, rotation: toRot, x: piece.x + kx, y: piece.y + ky };
    if (!collides(state.board, trial)) {
      state.active = trial;
      sounds.rotate();
      state.onGround = collides(state.board, trial, 0, 1);
      if (state.onGround) resetLock(state);
      return true;
    }
  }
  return false;
}

export function hardDrop(state: GameState): void {
  if (state.phase !== 'playing' || !state.active) return;
  const gy = ghostY(state.board, state.active);
  const dist = gy - state.active.y;
  state.active.y = gy;
  state.score += dist * HARD_DROP_SCORE;
  sounds.hardDrop();
  settlePiece(state);
}

export function holdPiece(state: GameState): void {
  if (state.phase !== 'playing' || !state.active || !state.canHold) return;
  const current = state.active.kind;
  sounds.hold();
  if (state.hold === null) {
    state.hold = current;
    state.canHold = false;
    if (!spawnFromQueue(state)) {
      state.phase = 'gameover';
      sounds.gameOver();
    }
  } else {
    const swap = state.hold;
    state.hold = current;
    state.canHold = false;
    const piece = spawnPiece(swap);
    if (collides(state.board, piece)) {
      state.phase = 'gameover';
      sounds.gameOver();
      return;
    }
    state.active = piece;
    state.onGround = collides(state.board, piece, 0, 1);
    state.lockTimer = 0;
    state.lockResets = 0;
  }
}

export function applyGravity(state: GameState, dtMs: number): void {
  if (state.phase !== 'playing' || !state.active) return;
  const interval = gravityMs(state.level);
  state.gravityAccumulator += dtMs;
  while (state.gravityAccumulator >= interval) {
    state.gravityAccumulator -= interval;
    if (!tryMove(state, 0, 1)) {
      state.onGround = true;
      break;
    }
  }
}

export function advanceLockDelay(state: GameState, dtMs: number): void {
  if (state.phase !== 'playing' || !state.active) return;
  const grounded = collides(state.board, state.active, 0, 1);
  if (grounded) {
    state.onGround = true;
    state.lockTimer += dtMs;
    if (state.lockTimer >= LOCK_DELAY_MS) {
      settlePiece(state);
    }
  } else {
    state.onGround = false;
    state.lockTimer = 0;
    state.lockResets = 0;
  }
}

export function updateGame(state: GameState, dtMs: number): void {
  applyGravity(state, dtMs);
  advanceLockDelay(state, dtMs);
}

export function getGhostPiece(state: GameState): ActivePiece | null {
  if (!state.active) return null;
  const gy = ghostY(state.board, state.active);
  return { ...state.active, y: gy };
}
