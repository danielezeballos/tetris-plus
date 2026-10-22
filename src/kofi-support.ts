const KO_FI_PAGE = 'tetrisplus';
const KO_FI_HOST_ID = 'kofi-overlay-host';
const SCRIPT_URL = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';

const DIALOG_ID = 'kofi-support-dialog';

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (
        pageId: string,
        config: Record<string, string>,
        containerId?: string | null,
      ) => void;
    };
  }
}

let kofiReady = false;
let chipObserver: MutationObserver | null = null;

function kofiConfig(): Record<string, string> {
  return {
    type: 'floating-chat',
    'floating-chat.donateButton.text': 'Support',
    'floating-chat.donateButton.background-color': '#1a1a1a',
    'floating-chat.donateButton.text-color': '#ffffff',
  };
}

function hideFloatingChip(): void {
  const selectors =
    '.floatingchat-container-wrap, .floatingchat-container-wrap-mobi, iframe.floatingchat-container, iframe.floatingchat-container-mobi';
  document.querySelectorAll<HTMLElement>(selectors).forEach((el) => {
    el.style.setProperty('position', 'absolute', 'important');
    el.style.setProperty('left', '-10000px', 'important');
    el.style.setProperty('width', '1px', 'important');
    el.style.setProperty('height', '1px', 'important');
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
  });
}

function ensureChipHidden(): void {
  hideFloatingChip();
  if (chipObserver) return;
  chipObserver = new MutationObserver(() => hideFloatingChip());
  chipObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });
}

function stylePopupInPanel(): void {
  const popup = document.querySelector<HTMLElement>(
    `#${KO_FI_HOST_ID} .floating-chat-kofi-popup-iframe`,
  );
  if (!popup) return;
  popup.style.setProperty('position', 'relative', 'important');
  popup.style.setProperty('left', 'auto', 'important');
  popup.style.setProperty('bottom', 'auto', 'important');
  popup.style.setProperty('top', 'auto', 'important');
  popup.style.setProperty('width', '100%', 'important');
  popup.style.setProperty('max-width', '27.5rem', 'important');
  popup.style.setProperty('margin', '0 auto', 'important');
  popup.style.setProperty(
    'height',
    'min(72dvh, 690px)',
    'important',
  );
  popup.style.setProperty('opacity', '1', 'important');
  popup.style.setProperty('z-index', '1', 'important');
}

function initKofiDraw(): void {
  window.kofiWidgetOverlay?.draw(KO_FI_PAGE, kofiConfig(), KO_FI_HOST_ID);
  ensureChipHidden();
  stylePopupInPanel();
}

function loadKofiOverlay(): Promise<void> {
  if (kofiReady) return Promise.resolve();
  ensureChipHidden();
  return new Promise((resolve, reject) => {
    if (window.kofiWidgetOverlay) {
      initKofiDraw();
      kofiReady = true;
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    const finish = () => {
      initKofiDraw();
      kofiReady = true;
      resolve();
    };
    if (existing) {
      if (window.kofiWidgetOverlay) finish();
      else {
        existing.addEventListener('load', finish);
        existing.addEventListener('error', () => reject(new Error('kofi script failed')));
      }
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = finish;
    script.onerror = () => reject(new Error('kofi script failed'));
    document.body.appendChild(script);
  });
}

function openKofiPopup(): void {
  const iframe = document.querySelector<HTMLIFrameElement>(
    'iframe.floatingchat-container',
  );
  const doc = iframe?.contentDocument ?? iframe?.contentWindow?.document ?? null;
  const donate = doc?.querySelector<HTMLElement>('.floatingchat-donate-button');
  donate?.click();
  window.setTimeout(() => {
    hideFloatingChip();
    stylePopupInPanel();
  }, 50);
  window.setTimeout(stylePopupInPanel, 400);
  window.setTimeout(stylePopupInPanel, 1200);
}

function closeKofiPopup(): void {
  const closer = document.querySelector<HTMLElement>(
    `#${KO_FI_HOST_ID} .floating-chat-kofi-popup-iframe-closer`,
  );
  closer?.click();
  const popup = document.querySelector<HTMLElement>(
    `#${KO_FI_HOST_ID} .floating-chat-kofi-popup-iframe`,
  );
  if (popup) {
    popup.style.height = '0';
    popup.style.width = '0';
    popup.style.opacity = '0';
  }
}

function getDialog(): HTMLDivElement {
  let root = document.getElementById(DIALOG_ID) as HTMLDivElement | null;
  if (root) return root;

  root = document.createElement('div');
  root.id = DIALOG_ID;
  root.className = 'kofi-support-dialog hidden';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Support tetrisplus on Ko-fi');

  const backdrop = document.createElement('div');
  backdrop.className = 'kofi-support-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');

  const panel = document.createElement('div');
  panel.className = 'kofi-support-panel';

  const head = document.createElement('div');
  head.className = 'kofi-support-head';

  const title = document.createElement('span');
  title.className = 'label';
  title.textContent = 'SUPPORT';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'theme-toggle kofi-support-close';
  closeBtn.textContent = 'Close';

  const body = document.createElement('div');
  body.className = 'kofi-support-body';

  const host = document.createElement('div');
  host.id = KO_FI_HOST_ID;
  host.className = 'kofi-overlay-host';
  host.setAttribute('aria-hidden', 'true');

  head.append(title, closeBtn);
  body.append(host);
  panel.append(head, body);
  root.append(backdrop, panel);
  document.body.append(root);

  const close = () => hideKofiSupportDialog();
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  return root;
}

function hideKofiSupportDialog(): void {
  const root = document.getElementById(DIALOG_ID);
  if (!root) return;
  closeKofiPopup();
  root.classList.add('hidden');
  document.body.classList.remove('kofi-support-open');
}

function showKofiSupportDialog(): void {
  const root = getDialog();
  root.classList.remove('hidden');
  document.body.classList.add('kofi-support-open');
  void loadKofiOverlay().then(() => {
    openKofiPopup();
  });
}

export function bindKofiSupport(button: HTMLButtonElement): void {
  ensureChipHidden();
  void loadKofiOverlay();
  button.addEventListener('click', () => showKofiSupportDialog());
}
