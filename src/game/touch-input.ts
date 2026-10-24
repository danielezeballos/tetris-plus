import type { GameState } from './engine';
import { hardDrop, tryMove, tryRotate } from './engine';
import { getCellSize } from './renderer';

const NARROW_MAX_WIDTH_PX = 639;
const SWIPE_THRESHOLD_PX = 22;
const TAP_MAX_MOVE_PX = 14;
const TAP_MAX_MS = 320;

export function isNarrowViewport(): boolean {
  return window.matchMedia(`(max-width: ${NARROW_MAX_WIDTH_PX}px)`).matches;
}

/** Signed column steps for a horizontal drag distance (one step per cell width). */
export function horizontalDragColumns(deltaX: number, cellWidth: number): number {
  if (cellWidth <= 0) return 0;
  return Math.trunc(deltaX / cellWidth);
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
  let lockedAxis: 'horizontal' | 'vertical' | null = null;
  let appliedColumns = 0;
  let peakAdx = 0;
  let peakAdy = 0;

  function canPlay(): boolean {
    return isNarrowViewport() && getState().phase === 'playing';
  }

  function applyColumnDelta(state: GameState, targetColumns: number): void {
    while (appliedColumns < targetColumns) {
      tryMove(state, 1, 0);
      appliedColumns += 1;
    }
    while (appliedColumns > targetColumns) {
      tryMove(state, -1, 0);
      appliedColumns -= 1;
    }
  }

  function resetGesture(): void {
    tracking = false;
    activePointer = -1;
    lockedAxis = null;
    appliedColumns = 0;
    peakAdx = 0;
    peakAdy = 0;
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
      lockedAxis = null;
      appliedColumns = 0;
      peakAdx = 0;
      peakAdy = 0;
      startX = e.clientX;
      startY = e.clientY;
      startT = e.timeStamp;
      wellWrap.setPointerCapture(e.pointerId);
    },
    { passive: true },
  );

  wellWrap.addEventListener(
    'pointermove',
    (e) => {
      if (!tracking || e.pointerId !== activePointer || !canPlay()) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      peakAdx = Math.max(peakAdx, adx);
      peakAdy = Math.max(peakAdy, ady);

      if (!lockedAxis) {
        if (Math.max(adx, ady) < SWIPE_THRESHOLD_PX) return;
        lockedAxis = adx >= ady ? 'horizontal' : 'vertical';
      }

      if (lockedAxis !== 'horizontal') return;

      const target = horizontalDragColumns(dx, getCellSize());
      applyColumnDelta(getState(), target);
    },
    { passive: true },
  );

  const finish = (e: PointerEvent): void => {
    if (!tracking || e.pointerId !== activePointer) return;
    const state = getState();
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const dt = e.timeStamp - startT;
    const wasHorizontal = lockedAxis === 'horizontal';

    tracking = false;
    activePointer = -1;
    try {
      wellWrap.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    if (!canPlay()) {
      resetGesture();
      return;
    }

    if (
      peakAdx < TAP_MAX_MOVE_PX &&
      peakAdy < TAP_MAX_MOVE_PX &&
      dt < TAP_MAX_MS
    ) {
      tryRotate(state, 'cw');
      resetGesture();
      return;
    }

    if (wasHorizontal) {
      const target = horizontalDragColumns(dx, getCellSize());
      applyColumnDelta(state, target);
      resetGesture();
      return;
    }

    if (Math.max(adx, ady) < SWIPE_THRESHOLD_PX) {
      resetGesture();
      return;
    }

    if (ady >= adx) {
      if (dy > 0) tryMove(state, 0, 1);
      else hardDrop(state);
    } else {
      const target = horizontalDragColumns(dx, getCellSize());
      applyColumnDelta(state, target);
    }

    resetGesture();
  };

  wellWrap.addEventListener('pointerup', finish);
  wellWrap.addEventListener('pointercancel', resetGesture);
}
