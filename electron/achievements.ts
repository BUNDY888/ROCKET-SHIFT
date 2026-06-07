import type {
  AchievementDefinition,
  AchievementId,
  AchievementStatus,
  PersistedData,
  UnlockedAchievement,
} from './types';
import { todayKey } from './types';
import { calculateTotalPercent } from './calculations';
import { dateKeyAddDays } from './dayClose';
import { getWeekStartKey } from './weeklyReport';

export const ACHIEVEMENT_ORDER: AchievementId[] = [
  'first_close',
  'percent_100',
  'streak_7',
  'streak_30',
  'best_week',
  'goal_streak_5',
];

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementId, AchievementDefinition> = {
  first_close: {
    id: 'first_close',
    title: 'Первый финиш',
    description: 'Закрыть первый день',
    emoji: '🎯',
  },
  percent_100: {
    id: 'percent_100',
    title: 'Сотка',
    description: '100% за день',
    emoji: '💯',
  },
  streak_7: {
    id: 'streak_7',
    title: 'Неделя огня',
    description: '7 дней подряд с закрытием',
    emoji: '🔥',
  },
  streak_30: {
    id: 'streak_30',
    title: 'Марафон',
    description: '30 дней подряд с закрытием',
    emoji: '🏃',
  },
  best_week: {
    id: 'best_week',
    title: 'Лучшая неделя',
    description: '≥75% в среднем за неделю (3+ закрытых дня)',
    emoji: '📈',
  },
  goal_streak_5: {
    id: 'goal_streak_5',
    title: 'Снайпер целей',
    description: '5 дней подряд — цель дня выполнена',
    emoji: '🎪',
  },
};

const MIN_CLOSED_DAYS_FOR_BEST_WEEK = 3;
const BEST_WEEK_MIN_AVERAGE = 75;

function closedDays(data: PersistedData) {
  return Object.values(data.days).filter((d) => d.close);
}

function countClosedDays(data: PersistedData): number {
  return closedDays(data).length;
}

function hasPercent100(data: PersistedData): boolean {
  return closedDays(data).some((d) => d.close!.percentAtClose >= 100);
}

function maxConsecutiveGoalDays(data: PersistedData): number {
  const dates = closedDays(data)
    .filter((d) => d.close?.goalReached === true)
    .map((d) => d.date)
    .sort();

  if (dates.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dateKeyAddDays(dates[i - 1], 1) === dates[i]) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

interface WeekStats {
  weekStart: string;
  averagePercent: number;
  closedDays: number;
}

function buildWeekStats(data: PersistedData): WeekStats[] {
  const byWeek = new Map<string, { sum: number; count: number; closed: number }>();

  for (const day of Object.values(data.days)) {
    if (day.tasks.length === 0 && !day.close) continue;
    const weekStart = getWeekStartKey(day.date);
    const entry = byWeek.get(weekStart) ?? { sum: 0, count: 0, closed: 0 };
    const percent = day.close?.percentAtClose ?? calculateTotalPercent(day.tasks);
    entry.sum += percent;
    entry.count++;
    if (day.close) entry.closed++;
    byWeek.set(weekStart, entry);
  }

  const weeks: WeekStats[] = [];
  for (const [weekStart, entry] of byWeek) {
    if (entry.count === 0) continue;
    weeks.push({
      weekStart,
      averagePercent: Math.round((entry.sum / entry.count) * 10) / 10,
      closedDays: entry.closed,
    });
  }
  return weeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

function hasBestWeekRecord(data: PersistedData): boolean {
  return buildWeekStats(data).some(
    (w) => w.closedDays >= MIN_CLOSED_DAYS_FOR_BEST_WEEK && w.averagePercent >= BEST_WEEK_MIN_AVERAGE,
  );
}

export function evaluateEarnedAchievements(data: PersistedData): Set<AchievementId> {
  const earned = new Set<AchievementId>();
  const streakBest = data.streak?.best ?? 0;

  if (countClosedDays(data) >= 1) earned.add('first_close');
  if (hasPercent100(data)) earned.add('percent_100');
  if (streakBest >= 7) earned.add('streak_7');
  if (streakBest >= 30) earned.add('streak_30');
  if (hasBestWeekRecord(data)) earned.add('best_week');
  if (maxConsecutiveGoalDays(data) >= 5) earned.add('goal_streak_5');

  return earned;
}

function progressTextFor(id: AchievementId, data: PersistedData): string | undefined {
  const streakBest = data.streak?.best ?? 0;
  const streakCurrent = data.streak?.current ?? 0;
  const streakProgress = Math.max(streakCurrent, streakBest);

  switch (id) {
    case 'first_close':
      return countClosedDays(data) > 0 ? undefined : '0/1';
    case 'percent_100': {
      const best = closedDays(data).reduce(
        (max, d) => Math.max(max, d.close!.percentAtClose),
        0,
      );
      return best >= 100 ? undefined : `${Math.round(best)}/100%`;
    }
    case 'streak_7':
      return streakProgress >= 7 ? undefined : `${Math.min(streakProgress, 7)}/7`;
    case 'streak_30':
      return streakProgress >= 30 ? undefined : `${Math.min(streakProgress, 30)}/30`;
    case 'goal_streak_5': {
      const run = maxConsecutiveGoalDays(data);
      return run >= 5 ? undefined : `${Math.min(run, 5)}/5`;
    }
    case 'best_week': {
      const weekStart = getWeekStartKey(todayKey());
      const current = buildWeekStats(data).find((w) => w.weekStart === weekStart);
      if (!current) return '0/3 дн.';
      const closedPart =
        current.closedDays >= MIN_CLOSED_DAYS_FOR_BEST_WEEK
          ? `${Math.round(current.averagePercent)}%`
          : `${current.closedDays}/${MIN_CLOSED_DAYS_FOR_BEST_WEEK} дн.`;
      if (current.closedDays >= MIN_CLOSED_DAYS_FOR_BEST_WEEK && current.averagePercent >= BEST_WEEK_MIN_AVERAGE) {
        return undefined;
      }
      return current.closedDays >= MIN_CLOSED_DAYS_FOR_BEST_WEEK
        ? `${Math.round(current.averagePercent)}/${BEST_WEEK_MIN_AVERAGE}%`
        : closedPart;
    }
    default:
      return undefined;
  }
}

export function syncAchievements(
  data: PersistedData,
  announceNew = false,
): { data: PersistedData; newlyUnlocked: UnlockedAchievement[] } {
  const earned = evaluateEarnedAchievements(data);
  const store = { ...(data.unlockedAchievements ?? {}) };
  const newlyUnlocked: UnlockedAchievement[] = [];
  const now = new Date().toISOString();

  for (const id of ACHIEVEMENT_ORDER) {
    if (!earned.has(id) || store[id]) continue;
    store[id] = now;
    if (announceNew) {
      newlyUnlocked.push({ id, unlockedAt: now });
    }
  }

  data.unlockedAchievements = store;
  return { data, newlyUnlocked };
}

export function buildAchievementStatuses(data: PersistedData): AchievementStatus[] {
  const synced = syncAchievements({ ...data, unlockedAchievements: { ...data.unlockedAchievements } }, false);
  const store = synced.data.unlockedAchievements ?? {};

  return ACHIEVEMENT_ORDER.map((id) => {
    const def = ACHIEVEMENT_DEFINITIONS[id];
    const unlocked = Boolean(store[id]);
    return {
      ...def,
      unlocked,
      unlockedAt: store[id],
      progressText: unlocked ? undefined : progressTextFor(id, synced.data),
    };
  });
}

export function achievementLabel(id: AchievementId): string {
  const def = ACHIEVEMENT_DEFINITIONS[id];
  return `${def.emoji} ${def.title}`;
}
