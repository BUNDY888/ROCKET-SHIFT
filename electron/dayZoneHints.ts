import { getTotalPlannedMinutes } from './calculations';
import { dateKeyDaysAgo } from './history';
import type { DayZoneHint, DayState, PersistedData, Task, TemporalTask, FixedTask } from './types';
import { todayKey } from './types';

const MIN_HISTORY_DAYS = 3;
const LOOKBACK_DAYS = 21;
const MIN_TASKS_TODAY = 2;
const BEHIND_HISTORY_GAP = 8;
const CATCH_UP_FINAL_GAP = 18;
const BEHIND_PLAN_GAP = 12;

type DayZone = 'morning' | 'afternoon' | 'evening';

export function getDecimalHour(now = new Date()): number {
  return now.getHours() + now.getMinutes() / 60;
}

function formatHourLabel(decimalHour: number): string {
  const h = Math.floor(decimalHour) % 24;
  const m = Math.round((decimalHour % 1) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function intervalDurationHours(startHour: number, endHour: number): number {
  if (endHour > startHour) return endHour - startHour;
  if (endHour <= startHour) return endHour + 24 - startHour;
  return 0;
}

/** Доля интервала задачи, уже «прошедшая» к моменту cutoff (decimal hour) */
function slotFractionBeforeCutoff(
  startHour: number,
  endHour: number,
  cutoff: number,
): number {
  const duration = intervalDurationHours(startHour, endHour);
  if (duration <= 0) return 0;

  const normalizedEnd = endHour <= startHour ? endHour + 24 : endHour;
  let elapsed = 0;

  for (let slot = Math.floor(startHour); slot < Math.ceil(normalizedEnd); slot++) {
    const slotStart = slot;
    const slotEnd = slot + 1;
    const overlapStart = Math.max(startHour, slotStart);
    const overlapEnd = Math.min(normalizedEnd, slotEnd, cutoff);
    if (overlapEnd > overlapStart) {
      elapsed += overlapEnd - overlapStart;
    }
  }

  return Math.min(1, Math.max(0, elapsed / duration));
}

function temporalContributionAtCutoff(
  task: TemporalTask,
  totalPlanned: number,
  cutoff: number,
): number {
  if (totalPlanned <= 0 || task.plannedMinutes <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, task.actualMinutes) / task.plannedMinutes);
  const share = task.plannedMinutes / totalPlanned;
  const maxContrib = ratio * share * 100;
  const frac = slotFractionBeforeCutoff(task.startHour, task.endHour, cutoff);
  return maxContrib * frac;
}

function plannedTemporalAtCutoff(
  task: TemporalTask,
  totalPlanned: number,
  cutoff: number,
): number {
  if (totalPlanned <= 0 || task.plannedMinutes <= 0) return 0;
  const share = task.plannedMinutes / totalPlanned;
  const frac = slotFractionBeforeCutoff(task.startHour, task.endHour, cutoff);
  return share * 100 * frac;
}

function fixedContributionAtCutoff(task: FixedTask, cutoff: number): number {
  if (!task.completed || task.completedHour == null) return 0;
  if (task.completedHour > cutoff) return 0;
  return Math.max(0, task.weightPercent);
}

export function reconstructPercentAtHour(tasks: Task[], cutoff: number): number {
  const totalPlanned = getTotalPlannedMinutes(tasks);
  let total = 0;
  for (const task of tasks) {
    if (task.type === 'temporal') {
      total += temporalContributionAtCutoff(task, totalPlanned, cutoff);
    } else {
      total += fixedContributionAtCutoff(task, cutoff);
    }
  }
  return Math.round(total * 10) / 10;
}

export function expectedPlanPercentByNow(tasks: Task[], cutoff: number): number {
  const totalPlanned = getTotalPlannedMinutes(tasks);
  let total = 0;
  for (const task of tasks) {
    if (task.type === 'temporal') {
      total += plannedTemporalAtCutoff(task, totalPlanned, cutoff);
    }
  }
  return Math.round(total * 10) / 10;
}

function getZone(hour: number): DayZone {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

const ZONE_END: Record<DayZone, { hour: number; label: string } | null> = {
  morning: { hour: 12, label: 'обеду' },
  afternoon: { hour: 18, label: 'вечеру' },
  evening: null,
};

function collectHistoryPercents(
  data: PersistedData,
  cutoff: number,
): number[] {
  const today = todayKey();
  const values: number[] = [];

  for (let i = 1; i <= LOOKBACK_DAYS; i++) {
    const date = dateKeyDaysAgo(i);
    if (date === today) continue;
    const day = data.days[date];
    if (!day || day.tasks.length < MIN_TASKS_TODAY) continue;
    if (!day.close && day.tasks.every((t) => t.type === 'temporal' && t.actualMinutes === 0)) {
      continue;
    }
    values.push(reconstructPercentAtHour(day.tasks, cutoff));
  }

  return values;
}

function average(values: number[]): number | null {
  if (values.length < MIN_HISTORY_DAYS) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function buildHistoryHint(
  data: PersistedData,
  currentPercent: number,
  nowHour: number,
): DayZoneHint | null {
  const zone = getZone(nowHour);
  const zoneEnd = ZONE_END[zone];
  const historyAtNow = collectHistoryPercents(data, nowHour);
  const avgNow = average(historyAtNow);
  if (avgNow == null) return null;
  if (currentPercent >= avgNow - BEHIND_HISTORY_GAP) return null;

  const timeLabel = formatHourLabel(nowHour);

  if (zoneEnd) {
    const historyAtEnd = collectHistoryPercents(data, zoneEnd.hour);
    const avgEnd = average(historyAtEnd);
    if (avgEnd != null && avgEnd >= currentPercent + CATCH_UP_FINAL_GAP) {
      return {
        tone: 'catch-up',
        text: `К ${timeLabel} у вас ${currentPercent}% — в ваших днях обычно ~${avgNow}%. Часто добираете к ${zoneEnd.label}.`,
      };
    }
  }

  return {
    tone: 'neutral',
    text: `К ${timeLabel} у вас ${currentPercent}% — в прошлые дни в это время в среднем ~${avgNow}%.`,
  };
}

function buildPlanHint(
  tasks: Task[],
  currentPercent: number,
  nowHour: number,
): DayZoneHint | null {
  const expected = expectedPlanPercentByNow(tasks, nowHour);
  if (expected < 5) return null;
  if (currentPercent >= expected - BEHIND_PLAN_GAP) return null;

  return {
    tone: 'neutral',
    text: `По плану дня к ${formatHourLabel(nowHour)} уже ~${expected}% — сейчас ${currentPercent}%.`,
  };
}

export function buildDayZoneHint(
  data: PersistedData,
  today: DayState,
  currentPercent: number,
  now = new Date(),
): DayZoneHint | null {
  if (data.settings.zoneHintsEnabled === false) return null;
  if (today.close) return null;
  if (today.tasks.length < MIN_TASKS_TODAY) return null;

  const nowHour = getDecimalHour(now);
  if (nowHour < 7 || nowHour >= 23) return null;

  const historyHint = buildHistoryHint(data, currentPercent, nowHour);
  if (historyHint) return historyHint;

  return buildPlanHint(today.tasks, currentPercent, nowHour);
}
