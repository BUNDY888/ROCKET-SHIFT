export type DurationInputUnit = 'min' | 'h';

/** Подсказка для поля в режиме «ч». */
export const HOURS_INPUT_HINT = '1.44 = 1 ч 44 мин (не десятичные доли часа)';

function parsePlainNumber(raw: string): number {
  const normalized = raw.trim().replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

/** «1.44» / «1,60» → минуты: часы + минуты после точки, не 1,5 = 1,5 ч. */
export function parseHoursMinutesString(raw: string): number {
  const normalized = raw.trim().replace(',', '.');
  if (!normalized) return 0;

  const dot = normalized.indexOf('.');
  if (dot === -1) {
    const hours = parseInt(normalized, 10);
    return (Number.isFinite(hours) ? Math.max(0, hours) : 0) * 60;
  }

  const hours = Math.max(0, parseInt(normalized.slice(0, dot), 10) || 0);
  const minPart = normalized.slice(dot + 1);
  let mins = minPart === '' ? 0 : parseInt(minPart, 10) || 0;
  if (mins < 0) mins = 0;

  let totalHours = hours;
  if (mins >= 60) {
    totalHours += Math.floor(mins / 60);
    mins = mins % 60;
  }
  return totalHours * 60 + mins;
}

/** Промежуточный ввод в режиме «ч» (например «2.» или «2.3» перед «2.30»). */
export function isPartialHoursDurationInput(raw: string): boolean {
  const normalized = raw.trim().replace(',', '.');
  if (!normalized) return false;
  if (normalized.endsWith('.')) return true;
  const dot = normalized.indexOf('.');
  if (dot === -1) return false;
  const minPart = normalized.slice(dot + 1);
  return minPart.length > 0 && minPart.length < 2;
}

export function sanitizeDurationDraft(raw: string, unit: DurationInputUnit): string {
  if (unit === 'min') {
    return raw.replace(/[^\d.,]/g, '').replace(',', '.');
  }
  let s = raw.replace(/[^\d.,]/g, '').replace(',', '.');
  const dot = s.indexOf('.');
  if (dot !== -1) {
    s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
  }
  return s;
}

export function formatMinutesAsHoursInput(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (min === 0) return String(h);
  return `${h}.${min.toString().padStart(2, '0')}`;
}

export function minutesToInputValue(minutes: number, unit: DurationInputUnit): string | number {
  if (unit === 'h') {
    return formatMinutesAsHoursInput(minutes);
  }
  return Math.max(0, Math.round(minutes));
}

export function inputValueToMinutes(value: string | number, unit: DurationInputUnit): number {
  if (unit === 'h') {
    if (typeof value === 'string') return parseHoursMinutesString(value);
    return parseHoursMinutesString(String(value));
  }
  const safe =
    typeof value === 'string' ? parsePlainNumber(value) : Number.isFinite(value) ? value : 0;
  return Math.round(Math.max(0, safe));
}

export function defaultDurationUnit(minutes: number): DurationInputUnit {
  if (minutes >= 60 && minutes % 60 === 0) return 'h';
  if (minutes > 0 && minutes % 15 === 0 && minutes >= 30) return 'h';
  return 'min';
}

export function formatDurationMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m === 0) return '0 мин';
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours === 0) return `${mins} мин`;
  if (mins === 0) return `${hours} ч`;
  return `${hours} ч ${mins} мин`;
}
