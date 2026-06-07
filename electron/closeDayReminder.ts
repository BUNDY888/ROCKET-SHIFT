import type { PersistedData } from './types';
import { todayKey } from './types';
import { applyActiveTimer, calculateTotalPercent } from './calculations';
import { getInvestedMinutes } from './dayClose';
import { getTodayState } from './store';

export function formatInvestedShort(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  if (minutes === 0) return '0 мин';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

function isPastReminderTime(hour: number, minute: number, now = new Date()): boolean {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const target = hour * 60 + minute;
  return nowMinutes >= target;
}

export function shouldSendCloseDayReminder(data: PersistedData, now = new Date()): {
  send: boolean;
  percent: number;
  investedMinutes: number;
} | null {
  const { closeDayReminderEnabled, closeDayReminderHour, closeDayReminderMinute } =
    data.settings;
  if (!closeDayReminderEnabled) return null;

  const hour = closeDayReminderHour ?? 21;
  const minute = closeDayReminderMinute ?? 0;
  if (!isPastReminderTime(hour, minute, now)) return null;

  const today = todayKey();
  if (data.lastCloseDayReminderDate === today) return null;

  const day = getTodayState(data);
  if (day.close) return null;
  if (day.tasks.length === 0) return null;

  const tasks = applyActiveTimer(day.tasks, data.activeTimer);
  const percent = calculateTotalPercent(tasks);
  const investedMinutes = getInvestedMinutes(tasks);

  return { send: true, percent, investedMinutes };
}

export function buildCloseDayReminderMessage(percent: number, investedMinutes: number): string {
  return `Сегодня ${percent}%, ${formatInvestedShort(investedMinutes)} вложено. Пора закрыть день?`;
}

export function markCloseDayReminderSent(data: PersistedData): PersistedData {
  data.lastCloseDayReminderDate = todayKey();
  return data;
}
