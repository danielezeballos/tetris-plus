const KO_FI_EMBED_URL =
  'https://ko-fi.com/tetrisplus/?hidefeed=true&widget=true&embed=true';

const DIALOG_ID = 'kofi-support-dialog';

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
  title.textContent = 'Support';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'theme-toggle kofi-support-close';
  closeBtn.textContent = 'Close';

  const iframe = document.createElement('iframe');
  iframe.className = 'kofi-support-iframe';
  iframe.title = 'Ko-fi — tetrisplus';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allow', 'payment');

  head.append(title, closeBtn);
  panel.append(head, iframe);
  root.append(backdrop, panel);
  document.body.append(root);

  const close = () => hideKofiSupportDialog();
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
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
  root.classList.remove('hidden');
  document.body.classList.add('kofi-support-open');
}

export function bindKofiSupport(button: HTMLButtonElement): void {
  button.addEventListener('click', () => showKofiSupportDialog());
}
