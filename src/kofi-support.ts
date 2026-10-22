const KO_FI_PAGE = 'tetrisplus';
const KO_FI_HOST_ID = 'kofi-overlay-host';
const SCRIPT_URL = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';

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

function hideKofiFloatingChip(): void {
  const offScreen = (el: HTMLElement) => {
    el.style.setProperty('position', 'fixed', 'important');
    el.style.setProperty('left', '-10000px', 'important');
    el.style.setProperty('bottom', 'auto', 'important');
    el.style.setProperty('width', '1px', 'important');
    el.style.setProperty('height', '1px', 'important');
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
    el.style.setProperty('clip', 'rect(0, 0, 0, 0)', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
  };
  document
    .querySelectorAll<HTMLElement>(
      '.floatingchat-container-wrap, .floatingchat-container-wrap-mobi, iframe.floatingchat-container, iframe.floatingchat-container-mobi',
    )
    .forEach(offScreen);
  const iframe = document.querySelector<HTMLIFrameElement>(
    'iframe.floatingchat-container',
  );
  const doc = iframe?.contentDocument ?? iframe?.contentWindow?.document ?? null;
  doc?.querySelectorAll<HTMLElement>('.floatingchat-donate-button').forEach((el) => {
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('width', '1px', 'important');
    el.style.setProperty('height', '1px', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
  });
}

function ensureChipHidden(): void {
  hideKofiFloatingChip();
  if (chipObserver) return;
  chipObserver = new MutationObserver(() => hideKofiFloatingChip());
  chipObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });
}

function initKofiDraw(): void {
  window.kofiWidgetOverlay?.draw(KO_FI_PAGE, kofiConfig(), KO_FI_HOST_ID);
  ensureChipHidden();
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
    if (existing) {
      const done = () => {
        initKofiDraw();
        kofiReady = true;
        resolve();
      };
      if (window.kofiWidgetOverlay) done();
      else {
        existing.addEventListener('load', done);
        existing.addEventListener('error', () => reject(new Error('kofi script failed')));
      }
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      initKofiDraw();
      kofiReady = true;
      resolve();
    };
    script.onerror = () => reject(new Error('kofi script failed'));
    document.body.appendChild(script);
  });
}

function openKofiTipPanel(): void {
  const iframe = document.querySelector<HTMLIFrameElement>(
    'iframe.floatingchat-container',
  );
  const doc = iframe?.contentDocument ?? iframe?.contentWindow?.document ?? null;
  const trigger = doc?.querySelector<HTMLElement>('.floatingchat-donate-button');
  trigger?.click();
  window.setTimeout(hideKofiFloatingChip, 0);
  window.setTimeout(hideKofiFloatingChip, 400);
}

export function bindKofiSupport(button: HTMLButtonElement): void {
  ensureChipHidden();
  void loadKofiOverlay();
  button.addEventListener('click', () => {
    void loadKofiOverlay().then(() => openKofiTipPanel());
  });
}
