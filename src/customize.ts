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
  let colorPickerGraceUntil = 0;

  const isOpen = (): boolean => !panel.classList.contains('hidden');

  const colorPickerEngaged = (): boolean => {
    const active = document.activeElement;
    if (
      active instanceof HTMLInputElement &&
      active.type === 'color' &&
      panel.contains(active)
    ) {
      return true;
    }
    return Date.now() < colorPickerGraceUntil;
  };

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
    input.addEventListener('focus', () => {
      colorPickerGraceUntil = Date.now() + 800;
    });
    input.addEventListener('blur', () => {
      colorPickerGraceUntil = Date.now() + 800;
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
    if (isOpen()) {
      setOpen(false);
      return;
    }
    syncInputs();
    setOpen(true);
  });
  closeBtn.addEventListener('click', () => setOpen(false));
  resetBtn.addEventListener('click', () => {
    resetPieceColors();
    syncInputs();
    onColorsChange();
  });

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!isOpen()) return;
      if (colorPickerEngaged()) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (panel.contains(t) || openBtn.contains(t)) return;
      setOpen(false);
    },
    true,
  );

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
    }
  });
}
