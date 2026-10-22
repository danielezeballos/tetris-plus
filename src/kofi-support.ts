const KO_FI_PAGE = 'danielzeballos';
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

function loadKofiOverlay(): Promise<void> {
  if (kofiReady) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (window.kofiWidgetOverlay) {
      kofiReady = true;
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => {
        kofiReady = true;
        resolve();
      });
      existing.addEventListener('error', () => reject(new Error('kofi script failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      window.kofiWidgetOverlay?.draw(KO_FI_PAGE, {
        type: 'floating-chat',
        'floating-chat.donateButton.text': 'Support',
        'floating-chat.donateButton.background-color': '#1a1a1a',
        'floating-chat.donateButton.text-color': '#ffffff',
      });
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
  if (trigger) {
    trigger.click();
    return;
  }
  document
    .querySelector<HTMLElement>('.floatingchat-donate-button')
    ?.click();
}

export function bindKofiSupport(button: HTMLButtonElement): void {
  void loadKofiOverlay();
  button.addEventListener('click', () => {
    void loadKofiOverlay().then(() => openKofiTipPanel());
  });
}
