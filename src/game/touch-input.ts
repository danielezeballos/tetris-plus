import type { GameState } from './engine';
import { hardDrop, tryMove, tryRotate } from './engine';

const NARROW_MAX_WIDTH_PX = 639;
const SWIPE_THRESHOLD_PX = 22;
const TAP_MAX_MOVE_PX = 14;
const TAP_MAX_MS = 320;

export function isNarrowViewport(): boolean {
  return window.matchMedia(`(max-width: ${NARROW_MAX_WIDTH_PX}px)`).matches;
}

export function bindTouchPlay(
  wellWrap: HTMLElement,
  getState: () => GameState,
): void {
  let startX = 0;
  let startY = 0;
  let startT = 0;
  let tracking = false;
  let activePointer = -1;

  function canPlay(): boolean {
    return isNarrowViewport() && getState().phase === 'playing';
  }

  wellWrap.addEventListener(
    'pointerdown',
    (e) => {
      if (!isNarrowViewport()) return;
      if (e.pointerType === 'mouse') return;
      if (!canPlay()) return;
      if (e.button !== 0) return;
      tracking = true;
      activePointer = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startT = e.timeStamp;
      wellWrap.setPointerCapture(e.pointerId);
    },
    { passive: true },
  );

  const finish = (e: PointerEvent): void => {
    if (!tracking || e.pointerId !== activePointer) return;
    tracking = false;
    activePointer = -1;
    try {
      wellWrap.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!canPlay()) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const dt = e.timeStamp - startT;
    const state = getState();

    if (
      adx < TAP_MAX_MOVE_PX &&
      ady < TAP_MAX_MOVE_PX &&
      dt < TAP_MAX_MS
    ) {
      tryRotate(state, 'cw');
      return;
    }

    if (Math.max(adx, ady) < SWIPE_THRESHOLD_PX) return;

    if (ady >= adx) {
      if (dy > 0) tryMove(state, 0, 1);
      else hardDrop(state);
    } else if (dx < 0) {
      tryMove(state, -1, 0);
    } else {
      tryMove(state, 1, 0);
    }
  };

  wellWrap.addEventListener('pointerup', finish);
  wellWrap.addEventListener('pointercancel', () => {
    tracking = false;
    activePointer = -1;
  });
}
