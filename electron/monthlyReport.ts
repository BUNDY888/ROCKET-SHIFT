import type {
  DayHistoryEntry,
  MonthlyReportDayCell,
  MonthlyReportSummary,
  PersistedData,
} from './types';
import { todayKey } from './types';
import { calculateTotalPercent } from './calculations';
import { getInvestedMinutes } from './dayClose';

export const WEEKDAY_HEADERS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'] as const;

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftMonth(year: number, month: number, offset: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function formatMonthTitle(year: number, month: number): string {
  const raw = new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildDayCell(
  data: PersistedData,
  dateKey: string,
  today: string,
  inMonth: boolean,
): MonthlyReportDayCell {
  const day = data.days[dateKey];
  const isToday = dateKey === today;
  const closed = Boolean(day?.close);
  const taskCount = day?.tasks.length ?? 0;
  const [, , dom] = dateKey.split('-').map(Number);

  return {
    date: dateKey,
    dayOfMonth: dom,
    inMonth,
    isToday,
    percent: closed
      ? day!.close!.percentAtClose
      : day
        ? calculateTotalPercent(day.tasks)
        : 0,
    taskCount,
    closed,
    mood: day?.close?.mood,
    investedMinutes: closed
      ? day!.close!.investedMinutes
      : day
        ? getInvestedMinutes(day.tasks)
        : 0,
    goalReached: day?.close?.goalReached,
  };
}

function toHistoryEntry(cell: MonthlyReportDayCell): DayHistoryEntry {
  const [y, m, d] = cell.date.split('-').map(Number);
  const label = cell.isToday
    ? 'Сегодня'
    : `${d} ${new Date(y, m - 1, d).toLocaleDateString('ru-RU', { month: 'short' })}`;

  return {
    date: cell.date,
    label,
    percent: cell.percent,
    taskCount: cell.taskCount,
    isToday: cell.isToday,
    closed: cell.closed,
    mood: cell.mood,
    investedMinutes: cell.investedMinutes,
    goalReached: cell.goalReached,
  };
}

function averagePercentForDays(days: DayHistoryEntry[]): number {
  const withTasks = days.filter((d) => d.taskCount > 0);
  if (withTasks.length === 0) return 0;
  const sum = withTasks.reduce((s, d) => s + d.percent, 0);
  return Math.round((sum / withTasks.length) * 10) / 10;
}

function buildMonthCells(
  data: PersistedData,
  year: number,
  month: number,
  today: string,
): MonthlyReportDayCell[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);
  const weekday = firstOfMonth.getDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;

  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - daysSinceMonday);

  const gridEnd = new Date(lastOfMonth);
  const endWeekday = gridEnd.getDay();
  const daysToSunday = endWeekday === 0 ? 0 : 7 - endWeekday;
  gridEnd.setDate(gridEnd.getDate() + daysToSunday);

  const cells: MonthlyReportDayCell[] = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    const dateKey = formatDateKey(cursor);
    const inMonth = cursor.getMonth() === month - 1 && cursor.getFullYear() === year;
    cells.push(buildDayCell(data, dateKey, today, inMonth));
    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

function chunkWeeks(cells: MonthlyReportDayCell[]): MonthlyReportDayCell[][] {
  const weeks: MonthlyReportDayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function buildMonthDays(data: PersistedData, year: number, month: number, today: string): DayHistoryEntry[] {
  const lastDay = new Date(year, month, 0).getDate();
  const days: DayHistoryEntry[] = [];
  for (let dom = 1; dom <= lastDay; dom++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(dom).padStart(2, '0')}`;
    const cell = buildDayCell(data, dateKey, today, true);
    days.push(toHistoryEntry(cell));
  }
  return days;
}

export function buildMonthlyReport(
  data: PersistedData,
  monthOffset = 0,
): MonthlyReportSummary {
  const today = todayKey();
  const [ty, tm] = today.split('-').map(Number);
  const { year, month } = shiftMonth(ty, tm, monthOffset);

  const cells = buildMonthCells(data, year, month, today);
  const weeks = chunkWeeks(cells);
  const days = buildMonthDays(data, year, month, today);
  const activeDays = days.filter((d) => d.taskCount > 0);
  const averagePercent = averagePercentForDays(days);
  const totalInvestedMinutes = days.reduce((sum, d) => sum + d.investedMinutes, 0);
  const closedDays = days.filter((d) => d.closed).length;
  const goalsReached = days.filter((d) => d.goalReached).length;

  let bestDay: MonthlyReportSummary['bestDay'] = null;
  for (const day of activeDays) {
    if (!bestDay || day.percent > bestDay.percent) {
      bestDay = { date: day.date, label: day.label, percent: day.percent };
    }
  }

  const prev = shiftMonth(year, month, -1);
  const prevDays = buildMonthDays(data, prev.year, prev.month, today);
  const prevAverage = averagePercentForDays(prevDays);
  const previousMonthAverage = prevDays.some((d) => d.taskCount > 0) ? prevAverage : null;
  const monthDelta =
    previousMonthAverage != null && activeDays.length > 0
      ? Math.round((averagePercent - previousMonthAverage) * 10) / 10
      : null;

  const isCurrentMonth = year === ty && month === tm;

  return {
    year,
    month,
    title: formatMonthTitle(year, month),
    isCurrentMonth,
    weeks,
    days,
    averagePercent,
    totalInvestedMinutes,
    activeDays: activeDays.length,
    closedDays,
    goalsReached,
    bestDay,
    previousMonthAverage,
    monthDelta,
  };
}
