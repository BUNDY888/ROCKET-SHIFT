import type { DayHistoryEntry } from '../../electron/types';

export type { DayHistoryEntry };

export function averagePercent(entries: DayHistoryEntry[]): number {
  const withTasks = entries.filter((e) => e.taskCount > 0);
  if (withTasks.length === 0) return 0;
  const sum = withTasks.reduce((s, e) => s + e.percent, 0);
  return Math.round((sum / withTasks.length) * 10) / 10;
}
