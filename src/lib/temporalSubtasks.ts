import type { TemporalSubtask } from '../../electron/types';

export function createTemporalSubtask(text = ''): TemporalSubtask {
  return {
    id: crypto.randomUUID(),
    text,
    completed: false,
  };
}

export function formatSubtaskProgress(subtasks: TemporalSubtask[] | undefined): string | null {
  if (!subtasks?.length) return null;
  const done = subtasks.filter((item) => item.completed).length;
  return `${done}/${subtasks.length}`;
}
