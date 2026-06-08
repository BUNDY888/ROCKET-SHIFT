import type { RecurringTaskDefinition, TemporalTask } from './types';

export const MACRO_GOAL_OPT_OUT = 'none' as const;

/** Цель задачи: явная привязка в карточке или из шаблона повторения. */
export function resolveTaskMacroGoalId(
  task: TemporalTask,
  recurringDefs: RecurringTaskDefinition[] | undefined,
): string | null {
  if (task.macroGoalId === MACRO_GOAL_OPT_OUT) return null;
  if (task.macroGoalId) return task.macroGoalId;

  if (task.recurringId && recurringDefs?.length) {
    const def = recurringDefs.find((d) => d.id === task.recurringId);
    if (def?.item.type === 'temporal') {
      const fromTemplate = def.item.macroGoalId ?? null;
      if (fromTemplate === MACRO_GOAL_OPT_OUT) return null;
      if (fromTemplate) return fromTemplate;
    }
  }

  return null;
}

export function taskCountsTowardMacroGoal(
  task: TemporalTask,
  goalId: string,
  recurringDefs: RecurringTaskDefinition[] | undefined,
): boolean {
  return resolveTaskMacroGoalId(task, recurringDefs) === goalId;
}
