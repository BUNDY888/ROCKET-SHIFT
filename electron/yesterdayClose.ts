import type { PersistedData, PendingYesterdayClose } from './types';
import { todayKey } from './types';
import { dateKeyAddDays } from './dayClose';

const PAST_CLOSE_LOOKBACK_DAYS = 30;

function formatDayTitle(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function dismissedSet(data: PersistedData): Set<string> {
  const fromList = data.dismissedPastCloseDates ?? [];
  const legacy = data.dismissedYesterdayCloseDate;
  return new Set(legacy ? [...fromList, legacy] : fromList);
}

/** Unclosed past days with tasks, oldest first. */
export function listPendingPastDayCloses(data: PersistedData): PendingYesterdayClose[] {
  const dismissed = dismissedSet(data);
  const today = todayKey();
  const result: PendingYesterdayClose[] = [];

  for (let offset = PAST_CLOSE_LOOKBACK_DAYS; offset >= 1; offset -= 1) {
    const dateKey = dateKeyAddDays(today, -offset);
    if (dismissed.has(dateKey)) continue;

    const day = data.days[dateKey];
    if (day && day.tasks.length > 0 && !day.close) {
      result.push({
        date: dateKey,
        label: formatDayTitle(dateKey),
      });
    }
  }

  return result;
}

export function getPendingYesterdayClose(data: PersistedData): PendingYesterdayClose | null {
  return listPendingPastDayCloses(data)[0] ?? null;
}

export function dismissYesterdayClose(data: PersistedData, dateKey: string): PersistedData {
  const dismissed = dismissedSet(data);
  dismissed.add(dateKey);
  data.dismissedPastCloseDates = [...dismissed];
  return data;
}

export function dismissAllPendingPastCloses(data: PersistedData): PersistedData {
  const dismissed = dismissedSet(data);
  for (const pending of listPendingPastDayCloses(data)) {
    dismissed.add(pending.date);
  }
  data.dismissedPastCloseDates = [...dismissed];
  return data;
}
