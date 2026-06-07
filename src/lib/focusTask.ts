import type { ActiveTimer, Task, TemporalTask } from '../../electron/types';
import { findCurrentTemporalTask } from './currentTask';

export function resolveFocusTask(
  tasks: Task[],
  activeTimer: ActiveTimer | null,
): TemporalTask | null {
  if (activeTimer) {
    const timed = tasks.find((t) => t.id === activeTimer.taskId);
    if (timed?.type === 'temporal') return timed;
  }

  const current = findCurrentTemporalTask(tasks);
  if (current) return current;

  const incomplete = tasks.find(
    (t): t is TemporalTask =>
      t.type === 'temporal' &&
      t.plannedMinutes > 0 &&
      t.actualMinutes < t.plannedMinutes,
  );
  if (incomplete) return incomplete;

  return tasks.find((t): t is TemporalTask => t.type === 'temporal') ?? null;
}

export function getTimerElapsedSeconds(activeTimer: ActiveTimer | null): number {
  if (!activeTimer) return 0;
  return Math.max(0, Math.floor((Date.now() - activeTimer.startedAt) / 1000));
}

export function formatTimerClock(totalSeconds: number): string {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
}
