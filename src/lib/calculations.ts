import type {
  ActiveTimer,
  FixedTask,
  Task,
  TemporalTask,
} from '../../electron/types';
import { getCurrentDecimalHour } from './currentTask';
import { decimalHourToTimeValue } from './timeInput';

/** Фиксированная шкала гистограммы (не настраивается) */
export const HISTOGRAM_MAX_PERCENT = 150;

export function clampSleepHour(hour: number, fallback = 0): number {
  if (!Number.isFinite(hour)) return fallback;
  const n = ((hour % 24) + 24) % 24;
  return Math.round(n * 1000) / 1000;
}

/** Шкала гистограммы: от пробуждения до отхода ко сну (через полночь, если нужно). */
export function getSleepChartRange(wakeHour: number, bedHour: number): {
  start: number;
  end: number;
  axisLabel: string;
  title: string;
} {
  const wake = clampSleepHour(wakeHour, 7);
  const bed = clampSleepHour(bedHour, 23);
  // end — исключающая граница для слотов (последний столбец = час «ложусь»).
  const end = bed > wake ? bed + 1 : bed + 24 + 1;
  const axisLabel = `${decimalHourToTimeValue(wake)} – ${decimalHourToTimeValue(bed)}`;
  return {
    start: wake,
    end,
    axisLabel,
    title: `Гистограмма (${axisLabel})`,
  };
}

/** Фиксированные пороги цветовых зон (не настраиваются) */
const ZONE_RED_MAX = 15;
const ZONE_ORANGE_MAX = 52;
const ZONE_GREEN_MAX = 72;

export function getTotalPlannedMinutes(tasks: Task[]): number {
  return tasks
    .filter((t): t is TemporalTask => t.type === 'temporal')
    .reduce((sum, t) => sum + Math.max(0, t.plannedMinutes), 0);
}

/** Вклад одной временной задачи в общий процент */
export function temporalContribution(task: TemporalTask, totalPlanned: number): number {
  if (totalPlanned <= 0 || task.plannedMinutes <= 0) return 0;
  const ratio = Math.max(0, task.actualMinutes) / task.plannedMinutes;
  const share = task.plannedMinutes / totalPlanned;
  return ratio * share * 100;
}

export function fixedContribution(task: FixedTask): number {
  return task.completed ? Math.max(0, task.weightPercent) : 0;
}

export function calculateTotalPercent(tasks: Task[]): number {
  return calculatePercentBreakdown(tasks).total;
}

export interface PercentBreakdown {
  temporal: number;
  fixed: number;
  total: number;
}

export function calculatePercentBreakdown(tasks: Task[]): PercentBreakdown {
  const totalPlanned = getTotalPlannedMinutes(tasks);
  let temporal = 0;
  let fixed = 0;
  for (const task of tasks) {
    if (task.type === 'temporal') {
      temporal += temporalContribution(task, totalPlanned);
    } else if (task.completed) {
      fixed += fixedContribution(task);
    }
  }
  temporal = Math.round(temporal * 10) / 10;
  fixed = Math.round(fixed * 10) / 10;
  return {
    temporal,
    fixed,
    total: Math.round((temporal + fixed) * 10) / 10,
  };
}

export function sumFixedWeights(tasks: Task[]): number {
  return tasks
    .filter((t): t is FixedTask => t.type === 'fixed')
    .reduce((sum, t) => sum + Math.max(0, t.weightPercent), 0);
}

export const FIXED_WEIGHT_WARN_THRESHOLD = 50;

export function isTimerPaused(timer: ActiveTimer): boolean {
  return timer.pausedAt != null;
}

export function timerElapsedSeconds(timer: ActiveTimer, at = Date.now()): number {
  if (timer.pausedAt != null) {
    return (
      timer.pausedTotalSeconds ??
      Math.max(0, Math.floor(timer.baseActualMinutes * 60))
    );
  }
  const runSec = Math.max(0, Math.floor((at - timer.startedAt) / 1000));
  return Math.max(0, Math.floor(timer.baseActualMinutes * 60) + runSec);
}

export function timerElapsedMinutes(timer: ActiveTimer, at = Date.now()): number {
  return Math.floor(timerElapsedSeconds(timer, at) / 60);
}

export function applyActiveTimer(
  tasks: Task[],
  timer: ActiveTimer | null,
  at = Date.now(),
): Task[] {
  if (!timer) return tasks;
  const minutes = timerElapsedMinutes(timer, at);
  return tasks.map((t) => {
    if (t.type !== 'temporal' || t.id !== timer.taskId) return t;
    return {
      ...t,
      actualMinutes: minutes,
    };
  });
}

export function intervalDurationHours(startHour: number, endHour: number): number {
  if (endHour > startHour) return endHour - startHour;
  if (endHour <= startHour) return endHour + 24 - startHour;
  return 0;
}

export function intervalDurationMinutes(startHour: number, endHour: number): number {
  return Math.round(intervalDurationHours(startHour, endHour) * 60);
}

/** Конец интервала: начало + длительность плана (поддержка перехода через полночь). */
export function endHourFromStartAndPlanned(
  startHour: number,
  plannedMinutes: number,
): number {
  const end = startHour + Math.max(0, plannedMinutes) / 60;
  const normalized = end >= 24 ? end % 24 : end;
  return Math.round(normalized * 1000) / 1000;
}

/** Подставляет конец из начала и плана (для сохранения и расчёта %). */
export function syncTemporalTaskEnd<T extends { startHour: number; plannedMinutes: number; endHour: number }>(
  task: T,
): T {
  const endHour = endHourFromStartAndPlanned(task.startHour, task.plannedMinutes);
  if (Math.abs(task.endHour - endHour) < 0.001) return task;
  return { ...task, endHour };
}

export function syncAllTemporalTaskEnds(tasks: Task[]): Task[] {
  return tasks.map((t) => (t.type === 'temporal' ? syncTemporalTaskEnd(t) : t));
}

export function isPlanIntervalMismatch(
  plannedMinutes: number,
  startHour: number,
  endHour: number,
): boolean {
  const windowMin = intervalDurationMinutes(startHour, endHour);
  if (windowMin <= 0) return plannedMinutes > 0;
  return Math.abs(plannedMinutes - windowMin) > 5;
}

/** Красный столбец «простой» на гистограмме (0%). */
export const HISTOGRAM_IDLE_COLOR = '#e53935';

export function getZoneColor(percent: number): string {
  if (percent <= 0) return HISTOGRAM_IDLE_COLOR;
  if (percent < ZONE_RED_MAX) return HISTOGRAM_IDLE_COLOR;
  if (percent < ZONE_ORANGE_MAX) return '#fb8c00';
  if (percent < ZONE_GREEN_MAX) return '#43a047';
  return '#8e24aa';
}

export interface HourlyBar {
  slot: number;
  clockHour: number;
  label: string;
  percent: number;
  /** Высота столбца (null = не рисовать, для будущих часов с 0%). */
  barValue: number | null;
  color: string;
  /** Красный простой 0% — только прошедший час без работы (факт). */
  showIdleBar: boolean;
}

/** Текущее время на шкале гистограммы (совпадает с номером slot). */
export function getNowOnChartTimeline(
  chartStartHour: number,
  chartEndHour: number,
  at = new Date(),
): number {
  const now = getCurrentDecimalHour(at);
  const h = Math.floor(now);

  if (chartEndHour <= 24) {
    return now;
  }
  // День через полночь: слоты после 24 — часы после полуночи
  if (h >= chartStartHour) return now;
  if (h < chartEndHour - 24) return 24 + now;
  return chartEndHour;
}

/** Час на шкале уже закончился (как на вахте: текущий час ещё не «сгорает»). */
export function isHistogramSlotPast(
  slot: number,
  chartStartHour: number,
  chartEndHour: number,
  at = new Date(),
): boolean {
  const nowOnChart = getNowOnChartTimeline(chartStartHour, chartEndHour, at);
  return nowOnChart >= slot + 1;
}

function formatChartHourLabel(slot: number): string {
  const h = slot % 24;
  return `${h}:00`;
}

function intervalDuration(startHour: number, endHour: number): number {
  return intervalDurationHours(startHour, endHour);
}

/** Доля интервала задачи, попадающая в каждый целый час (0–23) */
function getTemporalHourWeights(
  startHour: number,
  endHour: number,
): Map<number, number> {
  const weights = new Map<number, number>();
  const duration = intervalDuration(startHour, endHour);
  if (duration <= 0) return weights;

  const normalizedEnd = endHour <= startHour ? endHour + 24 : endHour;

  for (let slot = Math.floor(startHour); slot < Math.ceil(normalizedEnd); slot++) {
    const slotStart = slot;
    const slotEnd = slot + 1;
    const overlapStart = Math.max(startHour, slotStart);
    const overlapEnd = Math.min(normalizedEnd, slotEnd);
    const overlap = overlapEnd - overlapStart;
    if (overlap > 0) {
      const clockHour = ((slot % 24) + 24) % 24;
      weights.set(clockHour, (weights.get(clockHour) ?? 0) + overlap / duration);
    }
  }

  return weights;
}

/** Часы окна задачи по порядку с плановыми минутами в каждом. */
function orderedTaskWindowHours(
  task: TemporalTask,
): { clockHour: number; plannedInHour: number }[] {
  const weights = getTemporalHourWeights(task.startHour, task.endHour);
  const normalizedEnd =
    task.endHour <= task.startHour ? task.endHour + 24 : task.endHour;
  const list: { clockHour: number; plannedInHour: number }[] = [];

  for (let slot = Math.floor(task.startHour); slot < Math.ceil(normalizedEnd); slot++) {
    const clockHour = ((slot % 24) + 24) % 24;
    const weight = weights.get(clockHour) ?? 0;
    if (weight <= 0) continue;
    list.push({
      clockHour,
      plannedInHour: task.plannedMinutes * weight,
    });
  }

  return list;
}

/** Целый час на часах уже завершился (текущий час ещё не красим фактом задачи). */
function isClockHourComplete(clockHour: number, now: number): boolean {
  const hourEnd = clockHour + 1;
  if (hourEnd < 24) return now >= hourEnd;
  return now >= 24 || now < 1;
}

/**
 * Факт по часам: минуты идут с начала фактического окна (или планового) по завершённым часам.
 * % в часе = факт в этом часе / план в этом часе (если час в плановом окне), иначе / ёмкость часа в факт-окне.
 */
function distributeTemporalFactToHours(
  task: TemporalTask,
  hourPercentSum: Map<number, number>,
  hourWeightSum: Map<number, number>,
  at = new Date(),
): void {
  if (task.plannedMinutes <= 0) return;

  const now = getCurrentDecimalHour(at);
  let remainingActual = Math.max(0, task.actualMinutes);

  const planByHour = new Map(
    orderedTaskWindowHours(task).map((x) => [x.clockHour, x.plannedInHour]),
  );

  const hasFactWindow =
    task.factStartHour != null &&
    task.factEndHour != null &&
    intervalDuration(task.factStartHour, task.factEndHour) > 0;
  const fillStart = hasFactWindow ? task.factStartHour! : task.startHour;
  const fillEnd = hasFactWindow ? task.factEndHour! : task.endHour;
  const windowMinutes = intervalDurationMinutes(fillStart, fillEnd);
  const weights = getTemporalHourWeights(fillStart, fillEnd);
  const normalizedEnd = fillEnd <= fillStart ? fillEnd + 24 : fillEnd;

  for (let slot = Math.floor(fillStart); slot < Math.ceil(normalizedEnd); slot++) {
    const clockHour = ((slot % 24) + 24) % 24;
    const weight = weights.get(clockHour) ?? 0;
    if (weight <= 0) continue;
    if (!isClockHourComplete(clockHour, now)) continue;

    const plannedInHour = planByHour.get(clockHour) ?? 0;
    const hourCapacity =
      plannedInHour > 0 ? plannedInHour : windowMinutes * weight;
    if (hourCapacity <= 0) continue;

    const actualInHour = Math.min(remainingActual, hourCapacity);
    remainingActual -= actualInHour;
    if (actualInHour <= 0) continue;

    const denom = plannedInHour > 0 ? plannedInHour : hourCapacity;
    const hourPercent = Math.min(
      HISTOGRAM_MAX_PERCENT,
      Math.round((actualInHour / denom) * 1000) / 10,
    );

    hourPercentSum.set(
      clockHour,
      (hourPercentSum.get(clockHour) ?? 0) + hourPercent * denom,
    );
    hourWeightSum.set(clockHour, (hourWeightSum.get(clockHour) ?? 0) + denom);
  }
}

function finalizeHourlyPercent(
  hourPercentSum: Map<number, number>,
  hourWeightSum: Map<number, number>,
): Map<number, number> {
  const out = new Map<number, number>();
  for (const [h, weight] of hourWeightSum) {
    if (weight <= 0) continue;
    const sum = hourPercentSum.get(h) ?? 0;
    out.set(h, Math.round((sum / weight) * 10) / 10);
  }
  return out;
}

function buildHourlyBars(
  tasks: Task[],
  chartStartHour: number,
  chartEndHour: number,
): HourlyBar[] {
  const hourMap = new Map<number, number>();
  const hourPercentSum = new Map<number, number>();
  const hourWeightSum = new Map<number, number>();

  for (const task of tasks) {
    if (task.type === 'temporal') {
      distributeTemporalFactToHours(task, hourPercentSum, hourWeightSum, new Date());
    } else if (task.completed && task.completedHour !== null) {
      const h = Math.floor(task.completedHour) % 24;
      hourMap.set(h, (hourMap.get(h) ?? 0) + fixedContribution(task));
    }
  }

  const temporalByHour = finalizeHourlyPercent(hourPercentSum, hourWeightSum);
  for (const [h, percent] of temporalByHour) {
    hourMap.set(h, (hourMap.get(h) ?? 0) + percent);
  }

  const bars: HourlyBar[] = [];
  for (let slot = chartStartHour; slot < chartEndHour; slot++) {
    const clockHour = slot % 24;
    const raw = hourMap.get(clockHour) ?? 0;
    const percent = Math.round(raw * 10) / 10;
    const past = isHistogramSlotPast(slot, chartStartHour, chartEndHour);
    const showIdleBar = percent <= 0 && past;
    const barValue = percent > 0 ? percent : showIdleBar ? 0 : null;
    bars.push({
      slot,
      clockHour,
      label: formatChartHourLabel(slot),
      percent,
      barValue,
      showIdleBar,
      color: showIdleBar
        ? HISTOGRAM_IDLE_COLOR
        : percent > 0
          ? getZoneColor(percent)
          : 'transparent',
    });
  }

  return bars;
}

export function calculateHourlyHistogram(
  tasks: Task[],
  chartStartHour: number,
  chartEndHour: number,
): HourlyBar[] {
  return buildHourlyBars(tasks, chartStartHour, chartEndHour);
}

export function calculateHistogramForSleepSchedule(
  tasks: Task[],
  wakeHour: number,
  bedHour: number,
): HourlyBar[] {
  const { start, end } = getSleepChartRange(wakeHour, bedHour);
  return buildHourlyBars(tasks, start, end);
}

export function cumulativePercentUpToHour(
  tasks: Task[],
  upToSlot: number,
  chartStartHour: number,
  chartEndHour: number,
): number {
  const bars = calculateHourlyHistogram(tasks, chartStartHour, chartEndHour);
  let sum = 0;
  for (const bar of bars) {
    if (bar.slot <= upToSlot) sum += bar.percent;
  }
  return Math.round(sum * 10) / 10;
}

export function currentHour(): number {
  return new Date().getHours();
}

export function formatHour(h: number): string {
  const hours = Math.floor(((h % 24) + 24) % 24);
  const minutes = Math.round((h - Math.floor(h)) * 60) % 60;
  if (minutes === 0) {
    return `${hours.toString().padStart(2, '0')}:00`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
