import type { CloseDayPreview, MacroGoal, RecurringTaskDefinition, Task } from '../../electron/types';
import {
  formatInvestedDuration,
  formatInvestedDelta,
  formatPercentDelta,
} from './dayClose';
import { formatMacroGoalHours, resolveTaskMacroGoal } from './macroGoals';

function streakDaysLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} день подряд`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} дня подряд`;
  return `${n} дней подряд`;
}

function macroMinutesToday(
  tasks: Task[],
  goals: MacroGoal[],
  recurringTasks?: RecurringTaskDefinition[],
): { goal: MacroGoal; minutes: number }[] {
  const map = new Map<string, number>();
  for (const task of tasks) {
    if (task.type !== 'temporal' || task.actualMinutes <= 0) continue;
    const goal = resolveTaskMacroGoal(task, goals, recurringTasks);
    if (!goal) continue;
    map.set(goal.id, (map.get(goal.id) ?? 0) + task.actualMinutes);
  }
  return goals
    .map((goal) => ({ goal, minutes: map.get(goal.id) ?? 0 }))
    .filter((x) => x.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
}

export function buildCloseDayVictorySummary(
  preview: CloseDayPreview,
  tasks: Task[],
  macroGoals: MacroGoal[],
  streak: number,
  recurringTasks?: RecurringTaskDefinition[],
): { headline: string; lines: string[] } {
  const lines: string[] = [];
  const headline = `Сегодня ${preview.percent}% — ${formatInvestedDuration(preview.investedMinutes)} вложено в себя`;

  const percentDelta = formatPercentDelta(preview.percentDelta);
  if (percentDelta) {
    lines.push(percentDelta.charAt(0).toUpperCase() + percentDelta.slice(1));
  }

  const investedDelta = formatInvestedDelta(preview.investedDeltaMinutes);
  if (investedDelta) {
    lines.push(investedDelta.charAt(0).toUpperCase() + investedDelta.slice(1));
  }

  if (preview.dailyGoalEnabled && preview.goalReached) {
    lines.push(`Цель дня ${preview.dailyGoalPercent}% выполнена`);
  }

  for (const { goal, minutes } of macroMinutesToday(tasks, macroGoals, recurringTasks).slice(0, 2)) {
    lines.push(`+${formatMacroGoalHours(minutes)} к «${goal.name}»`);
  }

  if (streak > 0) {
    lines.push(`Streak: ${streakDaysLabel(streak)}`);
  }

  return { headline, lines };
}
