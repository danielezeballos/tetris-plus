const STORAGE_KEY = 'stackfall-muted';

function getStoredMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function applyMuted(muted: boolean): void {
  document.documentElement.dataset.muted = muted ? 'true' : 'false';
  try {
    localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

export function isMuted(): boolean {
  return document.documentElement.dataset.muted === 'true';
}

export function initSound(): boolean {
  const muted = getStoredMuted();
  applyMuted(muted);
  return muted;
}

export function toggleMute(): boolean {
  const next = !isMuted();
  applyMuted(next);
  return next;
}

export function muteToggleLabel(muted: boolean): string {
  return muted ? 'Unmute' : 'Mute';
}
