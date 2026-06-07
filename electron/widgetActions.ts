import type { PersistedData, Task, TemporalTask } from './types';
import { getTodayState, updateDay } from './store';
import { findCurrentTemporalTasks } from './currentTask';

export function currentHourDecimal(at = new Date()): number {
  return at.getHours() + at.getMinutes() / 60;
}

export function findFactTargetTask(tasks: Task[]): TemporalTask | null {
  const current = findCurrentTemporalTasks(tasks);
  if (current[0]) return current[0];

  const incomplete = tasks.find(
    (t): t is TemporalTask =>
      t.type === 'temporal' &&
      t.plannedMinutes > 0 &&
      t.actualMinutes < t.plannedMinutes,
  );
  return incomplete ?? null;
}

export function addFactMinutes(
  persisted: PersistedData,
  minutes: number,
  preferredTaskId?: string | null,
): PersistedData {
  const day = getTodayState(persisted);
  let targetId = preferredTaskId ?? null;

  if (!targetId) {
    targetId = findFactTargetTask(day.tasks)?.id ?? null;
  }

  if (!targetId) return persisted;

  day.tasks = day.tasks.map((t) => {
    if (t.type === 'temporal' && t.id === targetId) {
      return { ...t, actualMinutes: t.actualMinutes + minutes };
    }
    return t;
  });

  return updateDay(persisted, day);
}

export function completeNextFixed(persisted: PersistedData): PersistedData {
  const day = getTodayState(persisted);
  const next = day.tasks.find((t) => t.type === 'fixed' && !t.completed);
  if (!next || next.type !== 'fixed') return persisted;

  const hour = Math.floor(currentHourDecimal());
  day.tasks = day.tasks.map((t) => {
    if (t.id === next.id && t.type === 'fixed') {
      return { ...t, completed: true, completedHour: hour };
    }
    return t;
  });

  return updateDay(persisted, day);
}
