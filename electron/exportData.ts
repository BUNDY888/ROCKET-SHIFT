import type { DayState, PersistedData } from './types';
import { calculateTotalPercent } from './calculations';
import { countTaskProgress, getInvestedMinutes } from './dayClose';

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value == null || value === '') return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function dayRow(day: DayState): (string | number | boolean)[] {
  const closed = Boolean(day.close);
  const { completed, total } = countTaskProgress(day.tasks);
  return [
    day.date,
    closed ? day.close!.percentAtClose : calculateTotalPercent(day.tasks),
    closed ? 'yes' : 'no',
    closed ? day.close!.mood : '',
    closed ? day.close!.investedMinutes : getInvestedMinutes(day.tasks),
    closed ? day.close!.temporalPercent : '',
    closed ? day.close!.fixedPercent : '',
    total,
    completed,
    closed && day.close!.goalReached ? 'yes' : closed ? 'no' : '',
    closed ? day.close!.note : '',
  ];
}

export function buildDaysCsv(data: PersistedData): string {
  const header = [
    'date',
    'percent',
    'closed',
    'mood',
    'invested_minutes',
    'temporal_percent',
    'fixed_percent',
    'tasks_total',
    'tasks_completed',
    'goal_reached',
    'note',
  ];

  const rows = [header.join(',')];

  const dates = Object.keys(data.days).sort();
  for (const date of dates) {
    const day = data.days[date];
    if (day.tasks.length === 0 && !day.close) continue;
    rows.push(dayRow(day).map(escapeCsvCell).join(','));
  }

  return `\uFEFF${rows.join('\n')}\n`;
}

export function buildExportJson(data: PersistedData): string {
  return JSON.stringify(data, null, 2);
}

export function isValidBackupPayload(raw: unknown): raw is PersistedData {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as PersistedData;
  return Boolean(obj.settings) && typeof obj.days === 'object' && obj.days !== null;
}
