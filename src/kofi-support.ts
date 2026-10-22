const KO_FI_EMBED_URL =
  'https://ko-fi.com/tetrisplus/?hidefeed=true&widget=true&embed=true';
const KO_FI_PAGE_URL = 'https://ko-fi.com/tetrisplus';

const DIALOG_ID = 'kofi-support-dialog';
/** Shift embed up to hide Ko-fi’s broken cover strip; profile starts at ~20px. */
const COVER_SHIFT_PX = 20;
/** Tip fields only (stop above the in-embed Tip / payment controls). */
const TIP_VIEW_HEIGHT = 424;
const TIP_IFRAME_HEIGHT = 520;

function setIframeHeight(iframe: HTMLIFrameElement, px: number): void {
  iframe.style.height = `${Math.round(px)}px`;
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

function openKofiTopLevel(): Window | null {
  return window.open(KO_FI_PAGE_URL, '_blank', 'noopener,noreferrer');
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
  panel.classList.remove('kofi-support-panel--constrained');
  panel.style.maxHeight = '';
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
    body.classList.remove('kofi-support-body--scroll');
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

  const iframe = document.createElement('iframe');
  iframe.className = 'kofi-support-iframe';
  iframe.title = 'Ko-fi — tetrisplus tip details';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('scrolling', 'no');
  setIframeHeight(iframe, TIP_IFRAME_HEIGHT);

  const wrap = document.createElement('div');
  wrap.className = 'kofi-support-embed-wrap';
  setTipViewport(wrap, iframe);
  wrap.append(iframe);

  const pay = document.createElement('div');
  pay.className = 'kofi-support-pay';

  const payHint = document.createElement('p');
  payHint.className = 'kofi-support-pay-hint';
  payHint.textContent =
    'PayPal and card checkout open Ko-fi in a new tab.';

  const payActions = document.createElement('div');
  payActions.className = 'kofi-support-pay-actions';

  const paypalBtn = document.createElement('button');
  paypalBtn.type = 'button';
  paypalBtn.className = 'theme-toggle kofi-support-pay-btn';
  paypalBtn.textContent = 'PayPal';

  const cardBtn = document.createElement('button');
  cardBtn.type = 'button';
  cardBtn.className = 'theme-toggle kofi-support-pay-btn';
  cardBtn.textContent = 'Credit / debit card';

  const powered = document.createElement('p');
  powered.className = 'kofi-support-powered label';
  powered.textContent = 'Powered by Ko-fi';

  paypalBtn.addEventListener('click', () => openKofiTopLevel());
  cardBtn.addEventListener('click', () => openKofiTopLevel());

  payActions.append(paypalBtn, cardBtn);
  pay.append(payHint, payActions, powered);

  const body = document.createElement('div');
  body.className = 'kofi-support-body';
  body.append(wrap, pay);

  head.append(title, closeBtn);
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
