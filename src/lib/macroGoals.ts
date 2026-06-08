import type { MacroGoal, RecurringTaskDefinition, TemporalTask } from '../../electron/types';
import {
  MACRO_GOAL_OPT_OUT,
  resolveTaskMacroGoalId,
} from '../../electron/taskMacroGoal';

export const MAX_MACRO_GOALS = 3;

export { MACRO_GOAL_OPT_OUT };

export function taskMatchesMacroGoal(
  task: TemporalTask,
  goal: MacroGoal,
  recurringTasks?: RecurringTaskDefinition[],
): boolean {
  return resolveTaskMacroGoalId(task, recurringTasks) === goal.id;
}

export function formatMacroGoalHours(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (min === 0) return `${h} ч`;
  return `${h} ч ${min} мин`;
}

export function macroGoalProgressPercent(goal: MacroGoal): number {
  if (goal.targetMinutes <= 0) return 0;
  return Math.min(
    100,
    Math.round((goal.accumulatedMinutes / goal.targetMinutes) * 1000) / 10,
  );
}

export function macroGoalProgressLine(goal: MacroGoal): string {
  const pct = macroGoalProgressPercent(goal);
  return `${formatMacroGoalHours(goal.accumulatedMinutes)} / ${formatMacroGoalHours(goal.targetMinutes)} (${pct}%)`;
}

export function macroGoalEtaWeeks(goal: MacroGoal): string | null {
  if (!goal.weeklyPaceMinutes || goal.weeklyPaceMinutes <= 0) return null;
  const remaining = Math.max(0, goal.targetMinutes - goal.accumulatedMinutes);
  if (remaining <= 0) return null;
  const weeks = remaining / goal.weeklyPaceMinutes;
  if (weeks < 1) return 'меньше недели';
  return `~${Math.ceil(weeks)} нед. при ${formatMacroGoalHours(goal.weeklyPaceMinutes)}/нед`;
}

export function macroGoalLinkHint(goal: MacroGoal): string {
  const prior = (goal.priorMinutes ?? 0) > 0 ? ' + внесённый вручную старт' : '';
  return `Факт по задачам с выбранной целью в карточке (повторы — из шаблона)${prior}`;
}

export function macroGoalPriorHint(goal: MacroGoal): string | null {
  const prior = goal.priorMinutes ?? 0;
  const fromTasks = Math.max(0, goal.accumulatedMinutes - prior);
  if (prior > 0 && fromTasks > 0) {
    return `Из них ${formatMacroGoalHours(prior)} до приложения, ${formatMacroGoalHours(fromTasks)} из задач`;
  }
  if (prior > 0) {
    return `${formatMacroGoalHours(prior)} внесено до приложения`;
  }
  if (fromTasks > 0) {
    return `${formatMacroGoalHours(fromTasks)} из задач в приложении`;
  }
  return null;
}

export function resolveTaskMacroGoal(
  task: TemporalTask,
  goals: MacroGoal[],
  recurringTasks?: RecurringTaskDefinition[],
): MacroGoal | null {
  const goalId = resolveTaskMacroGoalId(task, recurringTasks);
  if (!goalId) return null;
  return goals.find((g) => g.id === goalId) ?? null;
}
