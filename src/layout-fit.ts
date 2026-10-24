import {
  capPreviewCell,
  getPreviewCanvasSize,
  setPlayfieldScale,
} from './game/renderer';

function appRect(): DOMRect | null {
  return document.getElementById('app')?.getBoundingClientRect() ?? null;
}

function layoutGapPx(): number {
  const layout = document.querySelector('.layout');
  if (!layout) return 0;
  const s = getComputedStyle(layout);
  const gap = parseFloat(s.columnGap || s.gap);
  return Number.isFinite(gap) ? gap : 0;
}

function capPreviewForAppWidth(wellCell: number): void {
  const rect = appRect();
  if (!rect) return;
  const gap = layoutGapPx();
  const wellW = 10 * wellCell;
  const sideBudget = (rect.width - wellW - 2 * gap) / 2;
  capPreviewCell(Math.max(4, Math.floor(sideBudget / 4)));
}

function columnsInView(): boolean {
  const rect = appRect();
  if (!rect) return false;
  const selectors = ['.panel-left', '.well-wrap', '.panel-right'];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) return false;
    if (r.left < rect.left - 0.5 || r.right > rect.right + 0.5) {
      return false;
    }
    if (r.top < rect.top - 0.5 || r.bottom > rect.bottom + 0.5) {
      return false;
    }
  }
  return true;
}

function pageOverflows(): boolean {
  const app = document.getElementById('app');
  const foot = document.querySelector('.page-foot');
  const well = document.getElementById('well');
  if (!app || !foot || !well) return true;
  const appRect = app.getBoundingClientRect();
  const bottom = Math.max(
    well.getBoundingClientRect().bottom,
    foot.getBoundingClientRect().bottom,
  );
  if (bottom > appRect.bottom + 0.5) {
    return true;
  }
  if (!columnsInView()) {
    return true;
  }
  const footRect = foot.getBoundingClientRect();
  if (
    footRect.left < appRect.left - 0.5 ||
    footRect.right > appRect.right + 0.5
  ) {
    return true;
  }
  const doc = document.documentElement;
  return (
    doc.scrollHeight > window.innerHeight + 0.5 ||
    doc.scrollWidth > window.innerWidth + 0.5
  );
}

function footerClearOfGame(): boolean {
  const foot = document.querySelector('.page-foot');
  const well = document.getElementById('well');
  const panel = document.querySelector('.panel-right');
  if (!foot || !well || !panel) return false;
  const footTop = foot.getBoundingClientRect().top;
  const gameBottom = Math.max(
    well.getBoundingClientRect().bottom,
    panel.getBoundingClientRect().bottom,
  );
  return footTop >= gameBottom - 0.5;
}

function isNarrowViewport(): boolean {
  return window.matchMedia('(max-width: 639px)').matches;
}

export function syncPanelHeights(): void {
  const well = document.getElementById('well');
  const panel = document.querySelector<HTMLElement>('.panel-right');
  if (!well || !panel) return;
  if (isNarrowViewport()) {
    panel.style.height = '';
    return;
  }
  panel.style.height = `${well.offsetHeight}px`;
}

function panelContentFits(): boolean {
  const panel = document.querySelector<HTMLElement>('.panel-right');
  const next = panel?.querySelector<HTMLElement>('.block:not(.stats-block)');
  const stats = panel?.querySelector<HTMLElement>('.stats-block');
  if (!panel || !next || !stats) return true;
  const needed = next.offsetHeight + stats.offsetHeight;
  return needed <= panel.clientHeight + 1;
}

function nextQueueFullyVisible(): boolean {
  const panel = document.querySelector('.panel-right');
  const rect = appRect();
  if (!panel || !rect) return false;
  const canvases = panel.querySelectorAll('.next-piece');
  for (const c of canvases) {
    const r = c.getBoundingClientRect();
    if (r.right > rect.right + 0.5 || r.left < rect.left - 0.5) {
      return false;
    }
  }
  const stats = panel.querySelector('.stats-block');
  if (stats) {
    const r = stats.getBoundingClientRect();
    if (r.right > rect.right + 0.5 || r.left < rect.left - 0.5) {
      return false;
    }
  }
  return true;
}

function holdFullyVisible(): boolean {
  const hold = document.getElementById('hold-canvas');
  const rect = appRect();
  if (!hold || !rect) return false;
  const r = hold.getBoundingClientRect();
  return r.left >= rect.left - 0.5 && r.right <= rect.right + 0.5;
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
  capPreviewForAppWidth(cell);
  resizePreviewCanvases();
  onApply();
  syncPanelHeights();
  return (
    !pageOverflows() &&
    panelContentFits() &&
    footerClearOfGame() &&
    columnsInView() &&
    nextQueueFullyVisible() &&
    holdFullyVisible()
  );
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
  capPreviewForAppWidth(best);
  resizePreviewCanvases();
  onApply();
  syncPanelHeights();
  return best;
}
