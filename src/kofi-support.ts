const KO_FI_EMBED_URL =
  'https://ko-fi.com/tetrisplus/?hidefeed=true&widget=true&embed=true';

const DIALOG_ID = 'kofi-support-dialog';
/** Shift embed up to hide Ko-fi’s broken cover strip; profile starts at ~20px. */
const COVER_SHIFT_PX = 20;
/** Visible window: profile through “Powered by Ko-fi” (~560px in embed coords). */
const TIP_VIEW_HEIGHT = 552;
const TIP_IFRAME_HEIGHT = 700;
const PAYMENT_IFRAME_MAX = 980;

let resizeListenerBound = false;

function isKofiOrigin(origin: string): boolean {
  try {
    return new URL(origin).hostname === 'ko-fi.com' || origin.endsWith('.ko-fi.com');
  } catch {
    return false;
  }
}

function parseEmbedHeight(data: unknown): number | null {
  if (typeof data === 'number' && data > 0) return data;
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  for (const key of ['height', 'h', 'frameHeight', 'frame_height']) {
    const v = o[key];
    if (typeof v === 'number' && v > 0) return v;
  }
  return null;
}

function setIframeHeight(iframe: HTMLIFrameElement, px: number): void {
  const h = Math.round(px);
  iframe.style.height = `${h}px`;
}

function setTipViewport(
  wrap: HTMLElement,
  iframe: HTMLIFrameElement,
): void {
  wrap.style.height = `${TIP_VIEW_HEIGHT}px`;
  wrap.style.maxHeight = '';
  wrap.style.overflowY = 'hidden';
  iframe.style.marginTop = `-${COVER_SHIFT_PX}px`;
  setIframeHeight(iframe, TIP_IFRAME_HEIGHT);
}

function resetTipStepLayout(root: HTMLElement): void {
  const iframe = root.querySelector<HTMLIFrameElement>('.kofi-support-iframe');
  const wrap = root.querySelector<HTMLElement>('.kofi-support-embed-wrap');
  const body = root.querySelector<HTMLElement>('.kofi-support-body');
  const panel = root.querySelector<HTMLElement>('.kofi-support-panel');
  if (!iframe || !wrap || !body || !panel) return;
  setTipViewport(wrap, iframe);
  body.scrollTop = 0;
  wrap.scrollTop = 0;
  body.classList.remove('kofi-support-body--scroll');
  panel.classList.remove('kofi-support-panel--tall');
  syncPanelViewport(panel, body);
}

function syncPanelViewport(panel: HTMLElement, body: HTMLElement): void {
  const cap = Math.max(280, window.innerHeight - 20);
  const natural = panel.getBoundingClientRect().height;
  if (natural > cap) {
    panel.classList.add('kofi-support-panel--constrained');
    panel.style.maxHeight = `${cap}px`;
    body.classList.add('kofi-support-body--scroll');
  } else {
    panel.classList.remove('kofi-support-panel--constrained');
    panel.style.maxHeight = '';
    if (!panel.classList.contains('kofi-support-panel--tall')) {
      body.classList.remove('kofi-support-body--scroll');
    }
  }
}

function bindKofiResizeMessages(root: HTMLDivElement): void {
  if (resizeListenerBound) return;
  resizeListenerBound = true;
  window.addEventListener('message', (event) => {
    if (!isKofiOrigin(event.origin)) return;
    const next = parseEmbedHeight(event.data);
    if (!next || next <= TIP_IFRAME_HEIGHT + 32) return;
    const dialog = document.getElementById(DIALOG_ID);
    if (!dialog || dialog.classList.contains('hidden')) return;
    const iframe = dialog.querySelector<HTMLIFrameElement>('.kofi-support-iframe');
    const body = dialog.querySelector<HTMLElement>('.kofi-support-body');
    const panel = dialog.querySelector<HTMLElement>('.kofi-support-panel');
    const wrap = dialog.querySelector<HTMLElement>('.kofi-support-embed-wrap');
    if (!iframe || !wrap || !body || !panel) return;
    const tall = Math.min(next + 20, PAYMENT_IFRAME_MAX);
    setIframeHeight(iframe, tall);
    iframe.style.marginTop = '0';
    wrap.style.height = `${Math.min(tall, PAYMENT_IFRAME_MAX)}px`;
    wrap.style.maxHeight = 'min(72dvh, 720px)';
    wrap.style.overflowY = 'auto';
    panel.classList.add('kofi-support-panel--tall');
    body.classList.add('kofi-support-body--scroll');
    syncPanelViewport(panel, body);
  });
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

  const iframe = document.createElement('iframe');
  iframe.className = 'kofi-support-iframe';
  iframe.title = 'Ko-fi — tetrisplus';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allow', 'payment');
  iframe.setAttribute('scrolling', 'auto');
  setIframeHeight(iframe, TIP_IFRAME_HEIGHT);

  const body = document.createElement('div');
  body.className = 'kofi-support-body';

  const wrap = document.createElement('div');
  wrap.className = 'kofi-support-embed-wrap';
  setTipViewport(wrap, iframe);
  wrap.append(iframe);

  head.append(title, closeBtn);
  body.append(wrap);
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

  bindKofiResizeMessages(root);
  window.addEventListener('resize', () => {
    if (root.classList.contains('hidden')) return;
    const b = root.querySelector<HTMLElement>('.kofi-support-body');
    const p = root.querySelector<HTMLElement>('.kofi-support-panel');
    if (b && p) syncPanelViewport(p, b);
  });

  return root;
}

function hideKofiSupportDialog(): void {
  const root = document.getElementById(DIALOG_ID);
  if (!root) return;
  root.classList.add('hidden');
  document.body.classList.remove('kofi-support-open');
}

function showKofiSupportDialog(): void {
  const root = getDialog();
  const iframe = root.querySelector<HTMLIFrameElement>('.kofi-support-iframe');
  if (iframe && !iframe.src) {
    iframe.src = KO_FI_EMBED_URL;
  }
  resetTipStepLayout(root);
  root.classList.remove('hidden');
  document.body.classList.add('kofi-support-open');
  window.requestAnimationFrame(() => resetTipStepLayout(root));
}

export function bindKofiSupport(button: HTMLButtonElement): void {
  button.addEventListener('click', () => showKofiSupportDialog());
}
