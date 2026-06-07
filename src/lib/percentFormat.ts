/** Целое значение без дробной части (с учётом погрешности float). */
export function isWholePercent(percent: number): boolean {
  return Math.abs(percent - Math.round(percent)) < 0.001;
}

/** Целая часть без десятых — для плитки виджета (29.7 → 29). */
export function formatPercentForWidget(percent: number): string {
  return String(Math.floor(Math.max(0, percent)));
}

/** Точный % для основного окна: 42 или 29.3 */
export function formatPercentDisplay(percent: number): string {
  const rounded = Math.round(percent * 10) / 10;
  if (isWholePercent(rounded)) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(1);
}
