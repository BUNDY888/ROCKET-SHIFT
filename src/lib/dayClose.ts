export const CLOSE_DAY_NOTE_MAX = 280;

export function normalizeCloseDayNote(raw: string | undefined): string {
  if (!raw) return '';
  return raw.trim().slice(0, CLOSE_DAY_NOTE_MAX);
}

/** Форматирование вложенного времени для UI */
export function formatInvestedDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  if (minutes === 0) return '0 мин';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

export function formatInvestedHoursDecimal(totalMinutes: number): string {
  const minutes = Math.max(0, totalMinutes);
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} ч`;
}

export function formatPercentDelta(delta: number | null): string | null {
  if (delta == null) return null;
  if (delta === 0) return 'как вчера';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}% к вчера`;
}

export function formatInvestedDelta(deltaMinutes: number | null): string | null {
  if (deltaMinutes == null) return null;
  if (deltaMinutes === 0) return 'столько же, что вчера';
  const sign = deltaMinutes > 0 ? '+' : '−';
  const abs = Math.abs(deltaMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const time = h > 0 ? (m > 0 ? `${h} ч ${m} мин` : `${h} ч`) : `${m} мин`;
  return `${sign}${time} к вчера`;
}
