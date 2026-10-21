import {
  advanceLockDelay,
  applyGravity,
  tryMove,
  type GameState,
} from './engine';
import { getDasHeld, processHorizontalDas } from './input';

/** One frame: horizontal DAS, gravity, held-direction nudge, then lock delay. */
export function gameTick(state: GameState, dtMs: number): void {
  if (state.phase !== 'playing' || !state.active) return;
  processHorizontalDas(state, dtMs);
  applyGravity(state, dtMs);
  const held = getDasHeld();
  if (held.left) tryMove(state, -1, 0);
  else if (held.right) tryMove(state, 1, 0);
  advanceLockDelay(state, dtMs);
}
