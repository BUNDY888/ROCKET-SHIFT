/** Десятичный час: 9.25 = 9:15 */
export function decimalHourToTimeValue(h: number): string {
  if (!Number.isFinite(h)) return '09:00';
  const normalized = ((h % 24) + 24) % 24;
  let hours = Math.floor(normalized);
  let minutes = Math.round((normalized - hours) * 60);
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }
  if (hours === 24) {
    hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function timeValueToDecimalHour(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  if (trimmed.includes(':')) {
    const [hPart, mPart] = trimmed.split(':');
    const hours = parseInt(hPart, 10) || 0;
    const minutes = parseInt(mPart, 10) || 0;
    return hours + minutes / 60;
  }

  const normalized = trimmed.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function formatTimeLabel(h: number): string {
  return decimalHourToTimeValue(h);
}
