import { randomUUID } from 'crypto';
import type { MacroGoal, MacroGoalCompletion, PersistedData, Task, TemporalTask } from './types';
import { applyActiveTimer } from './calculations';
import { saveData } from './store';
import { todayKey } from './types';

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

function goalCountingStartDate(goal: MacroGoal): string {
  return goal.createdAt.slice(0, 10);
}

function minutesFromTasks(
  tasks: Task[],
  goals: MacroGoal[],
  dayDate: string,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const goal of goals) totals.set(goal.id, 0);

  for (const task of tasks) {
    if (task.type !== 'temporal') continue;
    const actual = Math.max(0, task.actualMinutes);
    if (actual <= 0) continue;
    for (const goal of goals) {
      if (dayDate < goalCountingStartDate(goal)) continue;
      if (!taskMatchesMacroGoal(task, goal)) continue;
      totals.set(goal.id, (totals.get(goal.id) ?? 0) + actual);
    }
  }
  return totals;
}

export function recalculateMacroGoalTotals(data: PersistedData): Map<string, number> {
  const goals = data.macroGoals ?? [];
  if (goals.length === 0) return new Map();

  const totals = new Map<string, number>();
  for (const goal of goals) totals.set(goal.id, 0);

  const today = todayKey();
  for (const [date, day] of Object.entries(data.days)) {
    let tasks = day.tasks;
    if (date === today && data.activeTimer) {
      tasks = applyActiveTimer(tasks, data.activeTimer);
    }
    for (const [goalId, minutes] of minutesFromTasks(tasks, goals, date)) {
      totals.set(goalId, (totals.get(goalId) ?? 0) + minutes);
    }
  }

  return totals;
}

export function syncMacroGoals(
  data: PersistedData,
  announceNew = false,
): { data: PersistedData; newlyCompleted: MacroGoalCompletion[] } {
  const goals = data.macroGoals ?? [];
  if (goals.length === 0) {
    return { data, newlyCompleted: [] };
  }

  const totals = recalculateMacroGoalTotals(data);
  const newlyCompleted: MacroGoalCompletion[] = [];
  const now = new Date().toISOString();

  data.macroGoals = goals.map((goal) => {
    const fromTasks = totals.get(goal.id) ?? 0;
    const prior = Math.max(0, goal.priorMinutes ?? 0);
    const accumulatedMinutes = prior + fromTasks;
    const reached =
      goal.targetMinutes > 0 && accumulatedMinutes >= goal.targetMinutes;
    let completedAt = goal.completedAt ?? null;

    if (reached && !completedAt) {
      completedAt = now;
      if (announceNew) {
        newlyCompleted.push({
          goalId: goal.id,
          name: goal.name,
          milestoneLabel: goal.milestoneLabel,
          completedAt: now,
        });
      }
    }

    return { ...goal, accumulatedMinutes, completedAt };
  });

  return { data, newlyCompleted };
}

export function persistMacroGoals(data: PersistedData, announceNew = false) {
  const synced = syncMacroGoals(data, announceNew);
  saveData(synced.data);
  return synced;
}

export interface MacroGoalInput {
  name: string;
  emoji?: string;
  linkTag: string;
  targetHours: number;
  /** Уже сделано до приложения (часы). */
  priorHours?: number;
  weeklyPaceHours?: number | null;
  milestoneLabel: string;
}

function clampGoalInput(input: MacroGoalInput): Omit<MacroGoal, 'id' | 'createdAt' | 'accumulatedMinutes' | 'completedAt'> {
  const targetHours = Math.min(10000, Math.max(1, input.targetHours));
  const priorHours = Math.min(10000, Math.max(0, input.priorHours ?? 0));
  const weekly =
    input.weeklyPaceHours != null && input.weeklyPaceHours > 0
      ? Math.min(168, Math.max(0.5, input.weeklyPaceHours))
      : null;
  return {
    name: input.name.trim() || 'Цель',
    emoji: input.emoji?.trim() || '🎯',
    linkTag: input.linkTag.trim(),
    targetMinutes: Math.round(targetHours * 60),
    priorMinutes: Math.round(priorHours * 60),
    weeklyPaceMinutes: weekly != null ? Math.round(weekly * 60) : null,
    milestoneLabel: input.milestoneLabel.trim() || 'Цель достигнута',
  };
}

export function createMacroGoal(data: PersistedData, input: MacroGoalInput): PersistedData {
  const goals = data.macroGoals ?? [];
  if (goals.length >= MAX_MACRO_GOALS) return data;

  const goal: MacroGoal = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    accumulatedMinutes: 0,
    priorMinutes: 0,
    completedAt: null,
    ...clampGoalInput(input),
  };
  data.macroGoals = [...goals, goal];
  return data;
}

export function updateMacroGoal(
  data: PersistedData,
  goalId: string,
  input: MacroGoalInput,
): PersistedData {
  data.macroGoals = (data.macroGoals ?? []).map((g) =>
    g.id === goalId
      ? {
          ...g,
          ...clampGoalInput(input),
        }
      : g,
  );
  return data;
}

export function deleteMacroGoal(data: PersistedData, goalId: string): PersistedData {
  data.macroGoals = (data.macroGoals ?? []).filter((g) => g.id !== goalId);

  for (const day of Object.values(data.days)) {
    day.tasks = day.tasks.map((t) => {
      if (t.type !== 'temporal' || t.macroGoalId !== goalId) return t;
      return { ...t, macroGoalId: null };
    });
  }

  return data;
}
