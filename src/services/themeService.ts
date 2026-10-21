export type AppTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'stca_theme';

/**
 * Retrieves the stored theme from localStorage, or falls back to system preference / dark.
 */
export function getStoredTheme(): AppTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Check system preference if no user preference is stored
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch (e) {
    console.error('Error reading theme from localStorage:', e);
  }
  return 'dark'; // Default theme
}

/**
 * Persists theme preference to localStorage and updates DOM classes.
 */
export function saveTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
  } catch (e) {
    console.error('Error saving theme to localStorage:', e);
  }
}

/**
 * Applies the given theme to document.documentElement (root).
 */
export function applyTheme(theme: AppTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  }
}

/**
 * Toggles the current theme between dark and light, saves it, and applies it.
 */
export function toggleTheme(): AppTheme {
  const current = getStoredTheme();
  const next: AppTheme = current === 'dark' ? 'light' : 'dark';
  saveTheme(next);
  return next;
}

/**
 * Initializes theme on application boot.
 */
export function initTheme(): AppTheme {
  const current = getStoredTheme();
  applyTheme(current);
  return current;
}
