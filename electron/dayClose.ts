import type {
  DayCloseSummary,
  DayMood,
  DayState,
  CloseDayPreview,
  PersistedData,
  StreakState,
  Task,
  UnlockedAchievement,
} from './types';
import { dateKeyAddDays } from './dateKey';
import { todayKey } from './types';

export { dateKeyAddDays } from './dateKey';
import { syncAchievements } from './achievements';
import {
  applyActiveTimer,
  calculatePercentBreakdown,
  calculateTotalPercent,
} from './calculations';

export const DEFAULT_STREAK: StreakState = {
  current: 0,
  best: 0,
  lastClosedDate: null,
};

export const CLOSE_DAY_NOTE_MAX = 280;

export function clampDailyGoalPercent(value: number): number {
  return Math.min(100, Math.max(1, Math.round(value)));
}

export function computeDailyGoalState(
  percent: number,
  enabled: boolean,
  goalRaw: number,
): {
  dailyGoalEnabled: boolean;
  dailyGoalPercent: number;
  goalReached: boolean;
  goalProgress: number;
  goalRemaining: number;
} {
  const dailyGoalPercent = clampDailyGoalPercent(goalRaw);
  if (!enabled) {
    return {
      dailyGoalEnabled: false,
      dailyGoalPercent,
      goalReached: false,
      goalProgress: 0,
      goalRemaining: 0,
    };
  }
  const goalReached = percent >= dailyGoalPercent;
  const goalProgress = Math.min(
    100,
    Math.round((percent / dailyGoalPercent) * 1000) / 10,
  );
  const goalRemaining = Math.max(0, Math.ceil(dailyGoalPercent - percent));
  return {
    dailyGoalEnabled: true,
    dailyGoalPercent,
    goalReached,
    goalProgress,
    goalRemaining,
  };
}

export function normalizeCloseDayNote(raw: string | undefined): string {
  if (!raw) return '';
  return raw.trim().slice(0, CLOSE_DAY_NOTE_MAX);
}

export function getInvestedMinutes(tasks: Task[]): number {
  return tasks
    .filter((t) => t.type === 'temporal')
    .reduce((sum, t) => sum + Math.max(0, t.actualMinutes), 0);
}

export function countTaskProgress(tasks: Task[]): { completed: number; total: number } {
  let completed = 0;
  for (const task of tasks) {
    if (task.type === 'temporal') {
      if (task.actualMinutes > 0) completed++;
    } else if (task.completed) {
      completed++;
    }
  }
  return { completed, total: tasks.length };
}

export function computeStreakAfterClose(
  streak: StreakState,
  dateKey: string,
  alreadyClosed: boolean,
): StreakState {
  if (alreadyClosed) return streak;

  const yesterday = dateKeyAddDays(dateKey, -1);
  let current = 1;
  if (streak.lastClosedDate === yesterday) {
    current = streak.current + 1;
  }
  const best = Math.max(streak.best, current);
  return { current, best, lastClosedDate: dateKey };
}

function getDayPercent(day: DayState | undefined): number | null {
  if (!day || day.tasks.length === 0) return null;
  if (day.close) return day.close.percentAtClose;
  return calculateTotalPercent(day.tasks);
}

function getDayInvested(day: DayState | undefined): number | null {
  if (!day || day.tasks.length === 0) return null;
  if (day.close) return day.close.investedMinutes;
  return getInvestedMinutes(day.tasks);
}

export function buildCloseDayPreview(
  data: PersistedData,
  dateKey = todayKey(),
): CloseDayPreview {
  const day = data.days[dateKey] ?? { date: dateKey, tasks: [] };
  const tasks = applyActiveTimer(day.tasks, data.activeTimer);
  const breakdown = calculatePercentBreakdown(tasks);
  const { completed, total } = countTaskProgress(tasks);
  const streak = data.streak ?? DEFAULT_STREAK;
  const alreadyClosed = Boolean(day.close);
  const streakAfter = computeStreakAfterClose(streak, dateKey, alreadyClosed);
  const percent = calculateTotalPercent(tasks);
  const investedMinutes = getInvestedMinutes(tasks);

  const yesterdayKey = dateKeyAddDays(dateKey, -1);
  const yesterdayDay = data.days[yesterdayKey];
  const yesterdayPercent = getDayPercent(yesterdayDay);
  const yesterdayInvestedMinutes = getDayInvested(yesterdayDay);
  const percentDelta =
    yesterdayPercent != null
      ? Math.round((percent - yesterdayPercent) * 10) / 10
      : null;
  const investedDeltaMinutes =
    yesterdayInvestedMinutes != null
      ? investedMinutes - yesterdayInvestedMinutes
      : null;

  const goalState = computeDailyGoalState(
    percent,
    data.settings.dailyGoalEnabled ?? false,
    data.settings.dailyGoalPercent ?? 70,
  );

  return {
    date: dateKey,
    percent,
    temporalPercent: breakdown.temporal,
    fixedPercent: breakdown.fixed,
    investedMinutes,
    tasksCompleted: completed,
    tasksTotal: total,
    alreadyClosed,
    previousMood: day.close?.mood,
    previousNote: day.close?.note ?? '',
    streakCurrent: streak.current,
    streakAfterClose: streakAfter.current,
    streakBest: Math.max(streak.best, streakAfter.best),
    yesterdayPercent,
    yesterdayInvestedMinutes,
    percentDelta,
    investedDeltaMinutes,
    ...goalState,
  };
}

function buildCloseSummary(
  tasks: Task[],
  mood: DayMood,
  note: string,
  settings: PersistedData['settings'],
): DayCloseSummary {
  const breakdown = calculatePercentBreakdown(tasks);
  const { completed, total } = countTaskProgress(tasks);
  const percentAtClose = breakdown.total;
  const goalState = computeDailyGoalState(
    percentAtClose,
    settings.dailyGoalEnabled ?? false,
    settings.dailyGoalPercent ?? 70,
  );
  return {
    closedAt: new Date().toISOString(),
    mood,
    percentAtClose,
    temporalPercent: breakdown.temporal,
    fixedPercent: breakdown.fixed,
    investedMinutes: getInvestedMinutes(tasks),
    tasksCompleted: completed,
    tasksTotal: total,
    note,
    dailyGoalPercent: goalState.dailyGoalEnabled ? goalState.dailyGoalPercent : null,
    goalReached: goalState.dailyGoalEnabled ? goalState.goalReached : undefined,
  };
}

export function closeDay(
  data: PersistedData,
  mood: DayMood,
  noteRaw = '',
  dateKey = todayKey(),
): PersistedData {
  const day: DayState = data.days[dateKey] ?? { date: dateKey, tasks: [] };
  const alreadyClosed = Boolean(day.close);
  const streak = data.streak ?? DEFAULT_STREAK;

  day.tasks = applyActiveTimer(day.tasks, data.activeTimer);
  day.close = buildCloseSummary(day.tasks, mood, normalizeCloseDayNote(noteRaw), data.settings);
  data.days[dateKey] = day;
  data.streak = computeStreakAfterClose(streak, dateKey, alreadyClosed);
  if (dateKey === todayKey()) {
    data.activeTimer = null;
  }
  return data;
}

export interface CloseDayResult {
  data: PersistedData;
  newlyUnlocked: UnlockedAchievement[];
}

export function closeDayWithAchievements(
  data: PersistedData,
  mood: DayMood,
  noteRaw = '',
  dateKey = todayKey(),
): CloseDayResult {
  const updated = closeDay(data, mood, noteRaw, dateKey);
  return syncAchievements(updated, true);
}
