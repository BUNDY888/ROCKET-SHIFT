import { useAppState } from '../hooks/useAppState';
import { useTheme } from '../hooks/useTheme';

export function ThemeApplier() {
  const { state } = useAppState();
  useTheme(state?.settings.theme ?? 'light');
  return null;
}
