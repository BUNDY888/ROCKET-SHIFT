/** Calendar date keys (YYYY-MM-DD) in local timezone — never use toISOString() for day keys. */

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return formatDateKey(new Date());
}

export function dateKeyAddDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return formatDateKey(dt);
}

export function dateKeyDaysAgo(daysAgo: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - daysAgo);
  return formatDateKey(d);
}
