import { dateKeyAddDays } from './dayClose';
import { tasksToTemplateItems, templateItemsToTasks } from './dayTemplates';
import { getTodayState, updateDay } from './store';
import type { DayTemplate, PersistedData, TaskTemplateItem } from './types';
import { todayKey } from './types';

export interface MorningStartInfo {
  yesterdayTaskCount: number;
  yesterdayLabel: string;
}

function formatDayTitle(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function stripRecurringId(item: TaskTemplateItem): TaskTemplateItem {
  if (item.type === 'temporal') {
    const { recurringId: _r, ...rest } = item;
    return rest;
  }
  const { recurringId: _r, ...rest } = item;
  return rest;
}

export function buildMorningStartInfo(data: PersistedData): MorningStartInfo {
  const yesterdayKey = dateKeyAddDays(todayKey(), -1);
  const yesterday = data.days[yesterdayKey];
  return {
    yesterdayTaskCount: yesterday?.tasks.length ?? 0,
    yesterdayLabel: formatDayTitle(yesterdayKey),
  };
}

export function resolveMorningTemplate(
  templates: DayTemplate[],
  defaultTemplateId: string | null,
): DayTemplate | null {
  if (defaultTemplateId) {
    const chosen = templates.find((t) => t.id === defaultTemplateId);
    if (chosen) return chosen;
  }
  if (templates.length === 1) return templates[0];
  return null;
}

export function copyYesterdayPlanToToday(data: PersistedData): PersistedData {
  const yesterdayKey = dateKeyAddDays(todayKey(), -1);
  const yesterday = data.days[yesterdayKey];
  if (!yesterday || yesterday.tasks.length === 0) return data;

  const items = tasksToTemplateItems(yesterday.tasks).map(stripRecurringId);
  const day = getTodayState(data);
  day.tasks = templateItemsToTasks(items);
  if (day.close) delete day.close;
  return updateDay(data, day);
}
