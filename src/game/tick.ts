import {
  advanceLineClear,
  advanceLockDelay,
  applyGravity,
  type GameState,
} from './engine';
import { processHorizontalDas } from './input';

/** One frame: line-clear anim, else gravity, horizontal DAS/ARR, lock delay. */
export function gameTick(state: GameState, dtMs: number): void {
  if (state.phase !== 'playing') return;
  if (state.lineClear) {
    advanceLineClear(state, dtMs);
    return;
  }
  if (!state.active) return;
  applyGravity(state, dtMs);
  processHorizontalDas(state, dtMs);
  advanceLockDelay(state, dtMs);
}
