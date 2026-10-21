import { PIECE_KINDS, type PieceKind } from './game/constants';
import {
  getAllPieceColors,
  resetPieceColors,
  setPieceColor,
} from './piece-colors';

export function bindCustomizePanel(onColorsChange: () => void): void {
  const panel = document.querySelector<HTMLDivElement>('#customize-panel')!;
  const openBtn = document.querySelector<HTMLButtonElement>('#customize-toggle')!;
  const closeBtn = document.querySelector<HTMLButtonElement>('#customize-close')!;
  const resetBtn = document.querySelector<HTMLButtonElement>('#customize-reset')!;
  const rows = document.querySelector<HTMLDivElement>('#customize-rows')!;

  const inputs = new Map<PieceKind, HTMLInputElement>();

  for (const kind of PIECE_KINDS) {
    const row = document.createElement('div');
    row.className = 'customize-row';
    const label = document.createElement('span');
    label.className = 'customize-piece-label';
    label.textContent = kind;
    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'customize-color-input';
    input.value = getAllPieceColors()[kind];
    input.setAttribute('aria-label', `${kind} piece color`);
    input.addEventListener('input', () => {
      setPieceColor(kind, input.value);
      onColorsChange();
    });
    row.append(label, input);
    rows.appendChild(row);
    inputs.set(kind, input);
  }

  const syncInputs = (): void => {
    const all = getAllPieceColors();
    for (const kind of PIECE_KINDS) {
      inputs.get(kind)!.value = all[kind];
    }
  };

  const setOpen = (open: boolean): void => {
    panel.classList.toggle('hidden', !open);
    openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  openBtn.addEventListener('click', () => {
    syncInputs();
    setOpen(true);
  });
  closeBtn.addEventListener('click', () => setOpen(false));
  resetBtn.addEventListener('click', () => {
    resetPieceColors();
    syncInputs();
    onColorsChange();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
      setOpen(false);
    }
  });
}
