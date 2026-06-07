import type { Task, TemporalTask } from '../../electron/types';

export function getCurrentDecimalHour(at = new Date()): number {
  return at.getHours() + at.getMinutes() / 60 + at.getSeconds() / 3600;
}

export function isInTimeInterval(
  now: number,
  startHour: number,
  endHour: number,
): boolean {
  if (endHour > startHour) {
    return now >= startHour && now < endHour;
  }
  if (endHour < startHour) {
    return now >= startHour || now < endHour;
  }
  return false;
}

export function findCurrentTemporalTasks(
  tasks: Task[],
  at = new Date(),
): TemporalTask[] {
  const now = getCurrentDecimalHour(at);
  return tasks.filter(
    (t): t is TemporalTask =>
      t.type === 'temporal' &&
      isInTimeInterval(now, t.startHour, t.endHour),
  );
}

export function findCurrentTemporalTask(
  tasks: Task[],
  at = new Date(),
): TemporalTask | null {
  const found = findCurrentTemporalTasks(tasks, at);
  return found[0] ?? null;
}

export function needsProgressReminder(task: TemporalTask): boolean {
  if (task.plannedMinutes <= 0) return task.actualMinutes <= 0;
  return task.actualMinutes < task.plannedMinutes * 0.05;
}
