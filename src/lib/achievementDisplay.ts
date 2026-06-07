import type { AchievementId } from '../../electron/types';

export const ACHIEVEMENT_DISPLAY: Record<
  AchievementId,
  { title: string; description: string; emoji: string }
> = {
  first_close: {
    title: 'Первый финиш',
    description: 'Закрыть первый день',
    emoji: '🎯',
  },
  percent_100: {
    title: 'Сотка',
    description: '100% за день',
    emoji: '💯',
  },
  streak_7: {
    title: 'Неделя огня',
    description: '7 дней подряд с закрытием',
    emoji: '🔥',
  },
  streak_30: {
    title: 'Марафон',
    description: '30 дней подряд с закрытием',
    emoji: '🏃',
  },
  best_week: {
    title: 'Лучшая неделя',
    description: '≥75% в среднем за неделю (3+ закрытых дня)',
    emoji: '📈',
  },
  goal_streak_5: {
    title: 'Снайпер целей',
    description: '5 дней подряд — цель дня выполнена',
    emoji: '🎪',
  },
};
