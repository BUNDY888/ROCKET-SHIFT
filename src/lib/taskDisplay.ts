import type { FixedTask, Task, TemporalTask } from '../../electron/types';
import { getCurrentDecimalHour, isInTimeInterval } from './currentTask';

export type PlanFactMatch = 'none' | 'under' | 'match' | 'over';

export function isTemporalTaskDone(task: TemporalTask): boolean {
  if (task.plannedMinutes <= 0) return task.actualMinutes > 0;
  return task.actualMinutes >= task.plannedMinutes;
}

export function getTemporalPlanFactMatch(task: TemporalTask): PlanFactMatch {
  if (!isTemporalTaskDone(task)) return 'none';
  if (task.plannedMinutes <= 0) return 'match';

  const diff = Math.abs(task.actualMinutes - task.plannedMinutes);
  const ratio = task.actualMinutes / task.plannedMinutes;
  if (diff <= 5 || (ratio >= 0.9 && ratio <= 1.1)) return 'match';
  if (task.actualMinutes < task.plannedMinutes) return 'under';
  return 'over';
}

function temporalTimeRank(task: TemporalTask, now: number): number {
  if (isInTimeInterval(now, task.startHour, task.endHour)) {
    return 0;
  }

  if (task.endHour > task.startHour) {
    if (now < task.startHour) return 10 + (task.startHour - now);
    if (now >= task.endHour) return 2000 + (now - task.endHour);
    return 5;
  }

  if (now < task.startHour) return 10 + (task.startHour - now);
  return 2000 + (now - task.endHour);
}

function fixedTimeRank(task: FixedTask, now: number): number {
  const hour = task.completedHour;

  if (hour != null) {
    if (task.completed) {
      return 1500 + hour;
    }
    if (hour >= now) {
      return 10 + (hour - now);
    }
    return 500 + (now - hour);
  }

  if (task.completed) return 1600;
  return 1250;
}

function taskDisplayRank(task: Task, now: number): number {
  if (task.type === 'temporal') return temporalTimeRank(task, now);
  return fixedTimeRank(task, now);
}

/** Ближайшие по времени сверху; при равном ранге — исходный порядок. */
export function sortTasksForDisplay(tasks: Task[], now = getCurrentDecimalHour()): Task[] {
  return tasks
    .map((task, index) => ({ task, index, rank: taskDisplayRank(task, now) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.task);
}

export function getTaskCardClassName(task: Task, now = getCurrentDecimalHour()): string {
  const parts = ['task-card'];

  if (task.type === 'temporal') {
    if (isInTimeInterval(now, task.startHour, task.endHour)) {
      parts.push('task-card-active');
    }
    const match = getTemporalPlanFactMatch(task);
    if (match !== 'none') {
      parts.push(`task-card-done-${match}`);
    }
    return parts.join(' ');
  }

  if (task.completed) {
    parts.push('task-card-done-match');
  }
  return parts.join(' ');
}

export function getPlanFactMatchLabel(match: PlanFactMatch): string {
  switch (match) {
    case 'match':
      return 'План ≈ факт';
    case 'under':
      return 'Факт ниже плана';
    case 'over':
      return 'Факт выше плана';
    default:
      return '';
  }
}
