import type { PersistedData, DayHistoryEntry } from './types';
import { todayKey } from './types';
import { dateKeyDaysAgo } from './dateKey';
import { calculateTotalPercent } from './calculations';
import { getInvestedMinutes } from './dayClose';

export type { DayHistoryEntry };
export { dateKeyDaysAgo } from './dateKey';

function formatDayLabel(dateKey: string, isToday: boolean): string {
  if (isToday) return 'Сегодня';
  const [y, m, day] = dateKey.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function buildHistorySummary(
  data: PersistedData,
  dayCount: number,
): DayHistoryEntry[] {
  const today = todayKey();
  const entries: DayHistoryEntry[] = [];

  for (let i = dayCount - 1; i >= 0; i--) {
    const date = dateKeyDaysAgo(i);
    const day = data.days[date];
    const isToday = date === today;
    const closed = Boolean(day?.close);
    entries.push({
      date,
      label: formatDayLabel(date, isToday),
      percent: closed
        ? day!.close!.percentAtClose
        : day
          ? calculateTotalPercent(day.tasks)
          : 0,
      taskCount: day?.tasks.length ?? 0,
      isToday,
      closed,
      mood: day?.close?.mood,
      investedMinutes: closed
        ? day!.close!.investedMinutes
        : day
          ? getInvestedMinutes(day.tasks)
          : 0,
      note: day?.close?.note?.trim() || undefined,
    });
  }

  return entries;
}

export function getDayByDate(
  data: PersistedData,
  date: string,
): import('./types').DayState | null {
  return data.days[date] ?? null;
}
