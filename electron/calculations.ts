import type { ActiveTimer, Task } from './types';

export function getTotalPlannedMinutes(tasks: Task[]): number {
  return tasks
    .filter((t) => t.type === 'temporal')
    .reduce((sum, t) => sum + Math.max(0, t.plannedMinutes), 0);
}

export function calculateTotalPercent(tasks: Task[]): number {
  return calculatePercentBreakdown(tasks).total;
}

export function calculatePercentBreakdown(tasks: Task[]): {
  temporal: number;
  fixed: number;
  total: number;
} {
  const totalPlanned = getTotalPlannedMinutes(tasks);
  let temporal = 0;
  let fixed = 0;
  for (const task of tasks) {
    if (task.type === 'temporal') {
      if (totalPlanned <= 0 || task.plannedMinutes <= 0) continue;
      const ratio = Math.max(0, task.actualMinutes) / task.plannedMinutes;
      const share = task.plannedMinutes / totalPlanned;
      temporal += ratio * share * 100;
    } else if (task.completed) {
      fixed += Math.max(0, task.weightPercent);
    }
  }
  temporal = Math.round(temporal * 10) / 10;
  fixed = Math.round(fixed * 10) / 10;
  return { temporal, fixed, total: Math.round((temporal + fixed) * 10) / 10 };
}

export function timerElapsedSeconds(timer: ActiveTimer, at = Date.now()): number {
  if (timer.pausedAt != null) {
    return (
      timer.pausedTotalSeconds ??
      Math.max(0, Math.floor(timer.baseActualMinutes * 60))
    );
  }
  const runSec = Math.max(0, Math.floor((at - timer.startedAt) / 1000));
  return Math.max(0, Math.floor(timer.baseActualMinutes * 60) + runSec);
}

export function timerElapsedMinutes(timer: ActiveTimer, at = Date.now()): number {
  return Math.floor(timerElapsedSeconds(timer, at) / 60);
}

export function applyActiveTimer(
  tasks: Task[],
  timer: ActiveTimer | null,
  at = Date.now(),
): Task[] {
  if (!timer) return tasks;
  const minutes = timerElapsedMinutes(timer, at);
  return tasks.map((t) => {
    if (t.type !== 'temporal' || t.id !== timer.taskId) return t;
    return {
      ...t,
      actualMinutes: minutes,
    };
  });
}
