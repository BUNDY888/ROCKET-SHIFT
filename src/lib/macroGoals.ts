import type { MacroGoal, TemporalTask } from '../../electron/types';

export const MAX_MACRO_GOALS = 3;

export const MACRO_GOAL_OPT_OUT = 'none' as const;

export function taskMatchesMacroGoal(task: TemporalTask, goal: MacroGoal): boolean {
  if (task.macroGoalId === MACRO_GOAL_OPT_OUT) return false;
  if (task.macroGoalId === goal.id) return true;
  if (task.macroGoalId) return false;
  const tag = goal.linkTag.trim().toLowerCase();
  if (!tag) return false;
  return task.name.trim().toLowerCase().includes(tag);
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
  if (goal.linkTag.trim()) {
    return `Факт по задачам с «${goal.linkTag}» в названии, с даты создания цели${prior}`;
  }
  return `Факт по привязанным задачам, с даты создания цели${prior}`;
}

export function macroGoalPriorHint(goal: MacroGoal): string | null {
  const prior = goal.priorMinutes ?? 0;
  if (prior <= 0) return null;
  const tracked = Math.max(0, goal.accumulatedMinutes - prior);
  if (tracked > 0) {
    return `Из них ${formatMacroGoalHours(prior)} до приложения, ${formatMacroGoalHours(tracked)} из задач`;
  }
  return `${formatMacroGoalHours(prior)} внесено до приложения`;
}

export function resolveTaskMacroGoal(
  task: TemporalTask,
  goals: MacroGoal[],
): MacroGoal | null {
  if (task.macroGoalId === MACRO_GOAL_OPT_OUT) return null;
  if (task.macroGoalId) {
    return goals.find((g) => g.id === task.macroGoalId) ?? null;
  }
  return goals.find((g) => taskMatchesMacroGoal(task, g)) ?? null;
}
