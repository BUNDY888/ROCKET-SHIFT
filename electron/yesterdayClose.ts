import type { PersistedData, PendingYesterdayClose } from './types';
import { todayKey } from './types';
import { dateKeyAddDays } from './dayClose';

function formatDayTitle(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function getPendingYesterdayClose(data: PersistedData): PendingYesterdayClose | null {
  const yesterday = dateKeyAddDays(todayKey(), -1);

  if (data.dismissedYesterdayCloseDate === yesterday) return null;

  const day = data.days[yesterday];
  if (!day || day.tasks.length === 0 || day.close) return null;

  return {
    date: yesterday,
    label: formatDayTitle(yesterday),
  };
}

export function dismissYesterdayClose(data: PersistedData): PersistedData {
  data.dismissedYesterdayCloseDate = dateKeyAddDays(todayKey(), -1);
  return data;
}
