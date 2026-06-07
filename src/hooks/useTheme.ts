import { useEffect } from 'react';
import type { AppTheme } from '../../electron/types';

function isDarkTheme(theme: AppTheme): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useTheme(theme: AppTheme = 'light') {
  useEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute(
        'data-theme',
        isDarkTheme(theme) ? 'dark' : 'light',
      );
    };

    apply();

    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
