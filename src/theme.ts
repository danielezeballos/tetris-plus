const STORAGE_KEY = 'stackfall-theme';

export type Theme = 'light' | 'dark';

export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    /* ignore */
  }
  return 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function isDarkTheme(): boolean {
  return document.documentElement.dataset.theme === 'dark';
}

export function initTheme(): Theme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

export function toggleTheme(): Theme {
  const next: Theme = isDarkTheme() ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function themeToggleLabel(theme: Theme): string {
  return theme === 'dark' ? 'Light mode' : 'Dark mode';
}
