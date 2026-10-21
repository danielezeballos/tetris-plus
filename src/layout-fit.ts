import { setPlayfieldScale, getPreviewCanvasSize } from './game/renderer';

function pageOverflows(): boolean {
  const app = document.getElementById('app');
  const layout = document.querySelector('.layout');
  const foot = document.querySelector('.page-foot');
  const well = document.getElementById('well');
  if (!app || !layout || !foot || !well) return true;
  const appRect = app.getBoundingClientRect();
  const bottom = Math.max(
    layout.getBoundingClientRect().bottom,
    foot.getBoundingClientRect().bottom,
    well.getBoundingClientRect().bottom,
  );
  const right = Math.max(
    layout.getBoundingClientRect().right,
    foot.getBoundingClientRect().right,
  );
  const left = Math.min(layout.getBoundingClientRect().left);
  return (
    bottom > appRect.bottom + 0.5 ||
    right > appRect.right + 0.5 ||
    left < appRect.left - 0.5
  );
}

export function syncPanelHeights(): void {
  const well = document.getElementById('well');
  const panel = document.querySelector<HTMLElement>('.panel-right');
  if (well && panel) {
    panel.style.height = `${well.offsetHeight}px`;
  }
}

function panelContentFits(): boolean {
  const panel = document.querySelector<HTMLElement>('.panel-right');
  const next = panel?.querySelector<HTMLElement>('.block:not(.stats-block)');
  const stats = panel?.querySelector<HTMLElement>('.stats-block');
  if (!panel || !next || !stats) return true;
  const needed = next.offsetHeight + stats.offsetHeight;
  return needed <= panel.clientHeight + 1;
}

function applyCanvasSize(canvas: HTMLCanvasElement, size: number): void {
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
}

export function resizePreviewCanvases(): void {
  const size = getPreviewCanvasSize();
  const hold = document.getElementById('hold-canvas') as HTMLCanvasElement | null;
  if (hold) {
    applyCanvasSize(hold, size);
  }
  document.querySelectorAll<HTMLCanvasElement>('.next-piece').forEach((c) => {
    applyCanvasSize(c, size);
  });
}

function tryCell(cell: number, onApply: () => void): boolean {
  setPlayfieldScale(cell);
  resizePreviewCanvases();
  onApply();
  syncPanelHeights();
  return !pageOverflows() && panelContentFits();
}

/** Largest playfield cell size that fits the viewport with LINES at the well bottom. */
export function computeFitCellSize(onApply: () => void): number {
  let lo = 8;
  let hi = 80;
  let best = 8;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (tryCell(mid, onApply)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (!tryCell(best, onApply)) {
    for (let c = best; c >= 8; c--) {
      if (tryCell(c, onApply)) {
        best = c;
        break;
      }
    }
  }

  setPlayfieldScale(best);
  resizePreviewCanvases();
  onApply();
  syncPanelHeights();
  return best;
}
