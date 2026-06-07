import { randomUUID } from 'crypto';
import type {
  DayTemplate,
  Task,
  TaskTemplateItem,
  TemporalTask,
  FixedTask,
} from './types';

export function tasksToTemplateItems(tasks: Task[]): TaskTemplateItem[] {
  return tasks.map((t) => {
    if (t.type === 'temporal') {
      const {
        id: _id,
        actualMinutes: _a,
        factStartHour: _fs,
        factEndHour: _fe,
        ...rest
      } = t;
      return rest;
    }
    const { id: _id, completed: _c, completedHour: _h, ...rest } = t;
    return rest;
  });
}

export function templateItemsToTasks(items: TaskTemplateItem[]): Task[] {
  return items.map((t) => {
    if (t.type === 'temporal') {
      return {
        ...t,
        id: randomUUID(),
        actualMinutes: 0,
        factStartHour: null,
        factEndHour: null,
        macroGoalId: t.macroGoalId ?? null,
      } satisfies TemporalTask;
    }
    return {
      ...t,
      id: randomUUID(),
      completed: false,
      completedHour: null,
    } satisfies FixedTask;
  });
}

export function createDayTemplate(name: string, tasks: Task[]): DayTemplate {
  return {
    id: randomUUID(),
    name: name.trim() || 'Шаблон',
    tasks: tasksToTemplateItems(tasks),
    createdAt: new Date().toISOString(),
  };
}
