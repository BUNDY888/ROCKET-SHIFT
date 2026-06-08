import { randomUUID } from 'crypto';
import type {
  DayState,
  PersistedData,
  RecurrencePattern,
  RecurringTaskDefinition,
  Task,
  TaskTemplateItem,
} from './types';
import { todayKey } from './types';
import { tasksToTemplateItems, templateItemsToTasks } from './dayTemplates';
import { saveData } from './store';
import { MACRO_GOAL_OPT_OUT } from './taskMacroGoal';

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** ISO weekday: 1 = пн … 7 = вс */
export function isoWeekdayFromDateKey(dateKey: string): number {
  const day = parseDateKey(dateKey).getDay();
  return day === 0 ? 7 : day;
}

export function matchesRecurrence(
  pattern: RecurrencePattern,
  weekday: number,
  dateKey: string,
): boolean {
  const iso = isoWeekdayFromDateKey(dateKey);
  switch (pattern) {
    case 'daily':
      return true;
    case 'weekdays':
      return iso >= 1 && iso <= 5;
    case 'weekly':
      return iso === weekday;
    default:
      return false;
  }
}

/**
 * Защита от "склеенных" задач: в одном дне один recurringId должен
 * принадлежать только одной задаче. Если встречаем дубликат, отвязываем
 * повтор у последующих задач, чтобы они редактировались независимо.
 */
export function ensureUniqueRecurringIdsInDay(day: DayState): DayState {
  const used = new Set<string>();
  let changed = false;
  const tasks = day.tasks.map((task) => {
    const recurringId = task.recurringId;
    if (!recurringId) return task;
    if (!used.has(recurringId)) {
      used.add(recurringId);
      return task;
    }
    changed = true;
    const next = { ...task };
    delete next.recurringId;
    return next;
  });
  return changed ? { ...day, tasks } : day;
}

function taskToTemplateItem(task: Task): TaskTemplateItem {
  return tasksToTemplateItems([task])[0];
}

function spawnTaskFromDefinition(def: RecurringTaskDefinition): Task {
  return templateItemsToTasks([def.item])[0];
}

export function ensureRecurringTasksForDay(
  data: PersistedData,
  dateKey: string,
): PersistedData {
  if (dateKey !== todayKey()) return data;

  const day = data.days[dateKey] ?? { date: dateKey, tasks: [] };
  const existingIds = new Set(
    day.tasks.map((t) => t.recurringId).filter(Boolean) as string[],
  );
  const skipped = new Set(day.skippedRecurring ?? []);
  const toAdd: Task[] = [];

  for (const def of data.recurringTasks ?? []) {
    if (!def.enabled) continue;
    if (existingIds.has(def.id)) continue;
    if (skipped.has(def.id)) continue;
    if (!matchesRecurrence(def.pattern, def.weekday, dateKey)) continue;
    const spawned = spawnTaskFromDefinition(def);
    spawned.recurringId = def.id;
    toAdd.push(spawned);
  }

  if (toAdd.length === 0) return data;

  day.tasks = [...day.tasks, ...toAdd];
  data.days[dateKey] = day;
  saveData(data);
  return data;
}

/** Если в шаблоне цели нет, но в одном из дней серии выбрана — подтянуть в шаблон и раздать всем. */
export function reconcileRecurringMacroGoals(data: PersistedData): PersistedData {
  for (const def of data.recurringTasks ?? []) {
    if (def.item.type !== 'temporal') continue;
    if (def.item.macroGoalId) {
      data = propagateMacroGoalFromRecurringDefinition(data, def.id);
      continue;
    }
    let promoted: string | null | undefined;
    for (const day of Object.values(data.days)) {
      const hit = day.tasks.find(
        (t) =>
          t.type === 'temporal' &&
          t.recurringId === def.id &&
          t.macroGoalId &&
          t.macroGoalId !== MACRO_GOAL_OPT_OUT,
      );
      if (hit?.type === 'temporal') {
        promoted = hit.macroGoalId;
        break;
      }
    }
    if (!promoted) continue;
    data.recurringTasks = (data.recurringTasks ?? []).map((d) =>
      d.id === def.id && d.item.type === 'temporal'
        ? { ...d, item: { ...d.item, macroGoalId: promoted } }
        : d,
    );
    data = propagateMacroGoalFromRecurringDefinition(data, def.id);
  }
  return data;
}

export function propagateMacroGoalFromRecurringDefinition(
  data: PersistedData,
  recurringId: string,
): PersistedData {
  const def = (data.recurringTasks ?? []).find((d) => d.id === recurringId);
  if (!def || def.item.type !== 'temporal') return data;

  const goalId = def.item.macroGoalId ?? null;
  let changed = false;

  for (const day of Object.values(data.days)) {
    day.tasks = day.tasks.map((t) => {
      if (t.type !== 'temporal' || t.recurringId !== recurringId) return t;
      if (t.macroGoalId === MACRO_GOAL_OPT_OUT) return t;
      if ((t.macroGoalId ?? null) === goalId) return t;
      changed = true;
      return { ...t, macroGoalId: goalId };
    });
  }

  if (changed) saveData(data);
  return data;
}

export function syncRecurringTemplatesFromDay(
  data: PersistedData,
  day: DayState,
): PersistedData {
  const defs = data.recurringTasks ?? [];
  if (defs.length === 0) return data;

  let changed = false;
  const updatedRecurringIds: string[] = [];
  const nextDefs = defs.map((def) => {
    const task = day.tasks.find((t) => t.recurringId === def.id);
    if (!task) return def;
    const item = taskToTemplateItem(task);
    changed = true;
    updatedRecurringIds.push(def.id);
    return { ...def, item };
  });

  if (!changed) return data;
  data.recurringTasks = nextDefs;
  saveData(data);
  for (const recurringId of updatedRecurringIds) {
    data = propagateMacroGoalFromRecurringDefinition(data, recurringId);
  }
  return data;
}

export function setTaskRecurrence(
  data: PersistedData,
  day: DayState,
  taskId: string,
  pattern: RecurrencePattern | null,
): PersistedData {
  const taskIndex = day.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex < 0) return data;

  const task = day.tasks[taskIndex];
  const defs = [...(data.recurringTasks ?? [])];

  if (!pattern) {
    if (task.recurringId) {
      data.recurringTasks = defs.filter((d) => d.id !== task.recurringId);
      const nextTask = { ...task };
      delete nextTask.recurringId;
      day.tasks = day.tasks.map((t, i) => (i === taskIndex ? nextTask : t));
      data.days[day.date] = day;
    }
    saveData(data);
    return data;
  }

  const item = taskToTemplateItem(task);
  const weekday = isoWeekdayFromDateKey(day.date);

  if (task.recurringId) {
    data.recurringTasks = defs.map((def) =>
      def.id === task.recurringId
        ? { ...def, enabled: true, pattern, weekday, item }
        : def,
    );
  } else {
    const id = randomUUID();
    const def: RecurringTaskDefinition = {
      id,
      enabled: true,
      pattern,
      weekday,
      item,
      createdAt: new Date().toISOString(),
    };
    data.recurringTasks = [...defs, def];
    day.tasks = day.tasks.map((t, i) =>
      i === taskIndex ? { ...t, recurringId: id } : t,
    );
    data.days[day.date] = day;
  }

  saveData(data);
  return data;
}

export function removeRecurringIfOrphaned(
  data: PersistedData,
  removedRecurringId: string | undefined,
): PersistedData {
  if (!removedRecurringId) return data;

  const stillUsed = Object.values(data.days).some((day) =>
    day.tasks.some((t) => t.recurringId === removedRecurringId),
  );
  if (stillUsed) return data;

  data.recurringTasks = (data.recurringTasks ?? []).filter(
    (d) => d.id !== removedRecurringId,
  );
  saveData(data);
  return data;
}

export function markRecurringSkippedForDay(
  data: PersistedData,
  dateKey: string,
  recurringId: string,
): PersistedData {
  const day = data.days[dateKey] ?? { date: dateKey, tasks: [] };
  const skipped = new Set(day.skippedRecurring ?? []);
  skipped.add(recurringId);
  day.skippedRecurring = [...skipped];
  data.days[dateKey] = day;
  saveData(data);
  return data;
}

export function deleteRecurringDefinition(
  data: PersistedData,
  recurringId: string,
): PersistedData {
  data.recurringTasks = (data.recurringTasks ?? []).filter((d) => d.id !== recurringId);

  for (const [date, day] of Object.entries(data.days)) {
    const nextTasks = day.tasks.map((t) => {
      if (t.recurringId !== recurringId) return t;
      const next = { ...t };
      delete next.recurringId;
      return next;
    });
    if (nextTasks.some((t, i) => t !== day.tasks[i])) {
      data.days[date] = { ...day, tasks: nextTasks };
    }
  }

  saveData(data);
  return data;
}

export function setRecurringEnabled(
  data: PersistedData,
  recurringId: string,
  enabled: boolean,
): PersistedData {
  data.recurringTasks = (data.recurringTasks ?? []).map((def) =>
    def.id === recurringId ? { ...def, enabled } : def,
  );
  saveData(data);
  return data;
}

export function getTaskRecurrencePattern(
  task: Task,
  defs: RecurringTaskDefinition[],
): RecurrencePattern | null {
  if (!task.recurringId) return null;
  const def = defs.find((d) => d.id === task.recurringId);
  if (!def?.enabled) return null;
  return def.pattern;
}
