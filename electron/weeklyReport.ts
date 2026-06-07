import type { DayHistoryEntry, PersistedData, WeeklyReportSummary } from './types';
import { todayKey } from './types';
import { calculateTotalPercent } from './calculations';
import { getInvestedMinutes } from './dayClose';

const WEEKDAY_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'] as const;

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysToDateKey(dateKey: string, delta: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + delta);
  return formatDateKey(date);
}

/** Понедельник календарной недели для dateKey (локальное время). */
export function getWeekStartKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const weekday = date.getDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  date.setDate(date.getDate() - daysSinceMonday);
  return formatDateKey(date);
}

function formatWeekTitle(weekStart: string, weekEnd: string): string {
  const start = parseDateKey(weekStart);
  const end = parseDateKey(weekEnd);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('ru-RU', { month: 'long' });
  const endMonth = end.toLocaleDateString('ru-RU', { month: 'long' });
  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay}–${endDay} ${endMonth} ${year}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${startDay} ${startMonth.slice(0, 3)} – ${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} ${start.getFullYear()} – ${endDay} ${endMonth} ${year}`;
}

function buildDayEntry(
  data: PersistedData,
  date: string,
  today: string,
  weekdayIndex: number,
): DayHistoryEntry {
  const day = data.days[date];
  const isToday = date === today;
  const closed = Boolean(day?.close);
  const taskCount = day?.tasks.length ?? 0;
  const [y, m, d] = date.split('-').map(Number);
  const label = isToday
    ? 'Сегодня'
    : `${WEEKDAY_SHORT[weekdayIndex]} ${d}`;

  return {
    date,
    label,
    percent: closed
      ? day!.close!.percentAtClose
      : day
        ? calculateTotalPercent(day.tasks)
        : 0,
    taskCount,
    isToday,
    closed,
    mood: day?.close?.mood,
    investedMinutes: closed
      ? day!.close!.investedMinutes
      : day
        ? getInvestedMinutes(day.tasks)
        : 0,
    note: day?.close?.note?.trim() || undefined,
    goalReached: day?.close?.goalReached,
  };
}

function averagePercentForDays(days: DayHistoryEntry[]): number {
  const withTasks = days.filter((d) => d.taskCount > 0);
  if (withTasks.length === 0) return 0;
  const sum = withTasks.reduce((s, d) => s + d.percent, 0);
  return Math.round((sum / withTasks.length) * 10) / 10;
}

function buildWeekDays(data: PersistedData, weekStart: string, today: string): DayHistoryEntry[] {
  const days: DayHistoryEntry[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDaysToDateKey(weekStart, i);
    days.push(buildDayEntry(data, date, today, i));
  }
  return days;
}

export function buildWeeklyReport(
  data: PersistedData,
  weekOffset = 0,
): WeeklyReportSummary {
  const today = todayKey();
  const anchor = addDaysToDateKey(today, weekOffset * 7);
  const weekStart = getWeekStartKey(anchor);
  const weekEnd = addDaysToDateKey(weekStart, 6);
  const days = buildWeekDays(data, weekStart, today);

  const activeDays = days.filter((d) => d.taskCount > 0);
  const averagePercent = averagePercentForDays(days);
  const totalInvestedMinutes = days.reduce((sum, d) => sum + d.investedMinutes, 0);
  const closedDays = days.filter((d) => d.closed).length;
  const goalsReached = days.filter((d) => d.goalReached).length;

  let bestDay: WeeklyReportSummary['bestDay'] = null;
  for (const day of activeDays) {
    if (!bestDay || day.percent > bestDay.percent) {
      bestDay = { date: day.date, label: day.label, percent: day.percent };
    }
  }

  const prevWeekStart = addDaysToDateKey(weekStart, -7);
  const prevDays = buildWeekDays(data, prevWeekStart, today);
  const prevAverage = averagePercentForDays(prevDays);
  const previousWeekAverage = prevDays.some((d) => d.taskCount > 0) ? prevAverage : null;
  const weekDelta =
    previousWeekAverage != null && activeDays.length > 0
      ? Math.round((averagePercent - previousWeekAverage) * 10) / 10
      : null;

  const isCurrentWeek = weekStart === getWeekStartKey(today);

  return {
    weekStart,
    weekEnd,
    title: formatWeekTitle(weekStart, weekEnd),
    isCurrentWeek,
    days,
    averagePercent,
    totalInvestedMinutes,
    activeDays: activeDays.length,
    closedDays,
    goalsReached,
    bestDay,
    previousWeekAverage,
    weekDelta,
  };
}
