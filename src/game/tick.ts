import { advanceLockDelay, applyGravity, type GameState } from './engine';
import { processHorizontalDas } from './input';

/** One frame: gravity, then at most one horizontal DAS/ARR step, then lock delay. */
export function gameTick(state: GameState, dtMs: number): void {
  if (state.phase !== 'playing' || !state.active) return;
  applyGravity(state, dtMs);
  processHorizontalDas(state, dtMs);
  advanceLockDelay(state, dtMs);
}
