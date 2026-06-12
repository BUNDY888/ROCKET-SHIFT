export type TaskType = 'temporal' | 'fixed';

export interface TemporalSubtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface TemporalTask {
  id: string;
  type: 'temporal';
  name: string;
  plannedMinutes: number;
  actualMinutes: number;
  startHour: number;
  endHour: number;
  /** Чеклист дел внутри слота — на % дня не влияет. */
  subtasks?: TemporalSubtask[];
  /** Реальное начало работы (для режима «Факт» на гистограмме). */
  factStartHour?: number | null;
  /** Реальное окончание работы (для режима «Факт» на гистограмме). */
  factEndHour?: number | null;
  /** Привязка к макроцели; null — авто по тегу; "none" — не учитывать */
  macroGoalId?: string | null;
  recurringId?: string;
}

export interface FixedTask {
  id: string;
  type: 'fixed';
  name: string;
  weightPercent: number;
  completed: boolean;
  completedHour: number | null;
  recurringId?: string;
}

export type Task = TemporalTask | FixedTask;

export type RecurrencePattern = 'daily' | 'weekdays' | 'weekly';

export const RECURRENCE_LABELS: Record<RecurrencePattern, string> = {
  daily: 'Каждый день',
  weekdays: 'Будни',
  weekly: 'Каждую неделю',
};

/** Активный таймер (один на приложение) */
export interface ActiveTimer {
  taskId: string;
  startedAt: number;
  baseActualMinutes: number;
  /** Если задано — таймер на паузе (можно продолжить). */
  pausedAt?: number;
  /** Накопленное время в секундах на момент паузы (для отображения). */
  pausedTotalSeconds?: number;
  /** Пользователь выбрал продолжать после достижения плана. */
  allowOvertime?: boolean;
  /** Диалог «план выполнен» уже показывали для этого запуска таймера. */
  planLimitPromptShown?: boolean;
}

export type AppTheme = 'light' | 'dark' | 'system';

export type DayMood = '😫' | '😐' | '🙂' | '🔥' | '🏆';

export const DAY_MOODS: DayMood[] = ['😫', '😐', '🙂', '🔥', '🏆'];

export const DAY_MOOD_LABELS: Record<DayMood, string> = {
  '😫': 'Тяжело',
  '😐': 'Норм',
  '🙂': 'Хорошо',
  '🔥': 'Огонь',
  '🏆': 'Топ',
};

export interface DayCloseSummary {
  closedAt: string;
  mood: DayMood;
  percentAtClose: number;
  temporalPercent: number;
  fixedPercent: number;
  investedMinutes: number;
  tasksCompleted: number;
  tasksTotal: number;
  note: string;
  dailyGoalPercent?: number | null;
  goalReached?: boolean;
}

export interface StreakState {
  current: number;
  best: number;
  lastClosedDate: string | null;
}

export interface PendingYesterdayClose {
  date: string;
  label: string;
}

export interface CloseDayPreview {
  date: string;
  percent: number;
  temporalPercent: number;
  fixedPercent: number;
  investedMinutes: number;
  tasksCompleted: number;
  tasksTotal: number;
  alreadyClosed: boolean;
  previousMood?: DayMood;
  previousNote?: string;
  streakCurrent: number;
  streakAfterClose: number;
  streakBest: number;
  yesterdayPercent: number | null;
  yesterdayInvestedMinutes: number | null;
  percentDelta: number | null;
  investedDeltaMinutes: number | null;
  dailyGoalEnabled: boolean;
  dailyGoalPercent: number;
  goalReached: boolean;
  goalProgress: number;
  goalRemaining: number;
}

/** Задача без id и прогресса — для шаблона дня */
export type TaskTemplateItem =
  | Omit<TemporalTask, 'id' | 'actualMinutes'>
  | Omit<FixedTask, 'id' | 'completed' | 'completedHour'>;

export interface MorningStartInfo {
  yesterdayTaskCount: number;
  yesterdayLabel: string;
}

export interface DayTemplate {
  id: string;
  name: string;
  tasks: TaskTemplateItem[];
  createdAt: string;
}

/** Правило повторения задачи — шаблон без прогресса за день */
/** Долгосрочная цель (часы, тег задач, веха). */
export interface MacroGoal {
  id: string;
  name: string;
  emoji: string;
  /** Заметка для себя (на подсчёт часов не влияет). */
  linkTag: string;
  targetMinutes: number;
  /** Факт, внесённый вручную (до создания цели в приложении). */
  priorMinutes: number;
  accumulatedMinutes: number;
  /** Для подсказки «~N недель при X ч/нед». */
  weeklyPaceMinutes: number | null;
  milestoneLabel: string;
  completedAt: string | null;
  createdAt: string;
}

export interface MacroGoalCompletion {
  goalId: string;
  name: string;
  milestoneLabel: string;
  completedAt: string;
}

export interface RecurringTaskDefinition {
  id: string;
  enabled: boolean;
  pattern: RecurrencePattern;
  /** 1 = пн … 7 = вс — для weekly и якорь при создании */
  weekday: number;
  item: TaskTemplateItem;
  createdAt: string;
}

export interface AppSettings {
  widgetIcon: string;
  /** Имя файла в папке widget-photos (например custom.png) */
  widgetCustomPhotoFile: string | null;
  autostart: boolean;
  /** Начало шкалы гистограммы (пробуждение), десятичный час. */
  sleepWakeHour: number;
  /** Конец шкалы (отход ко сну), десятичный час; если раньше пробуждения — следующий день. */
  sleepBedHour: number;
  reminderEnabled: boolean;
  reminderIntervalMinutes: number;
  onboardingCompleted: boolean;
  /** Подсказка про виджет после первого запуска */
  widgetSetupHintDismissed: boolean;
  closeDayReminderEnabled: boolean;
  closeDayReminderHour: number;
  closeDayReminderMinute: number;
  dailyGoalEnabled: boolean;
  dailyGoalPercent: number;
  /** Звук и анимация при достижении цели / закрытии с 🏆 */
  goalCelebrationEnabled: boolean;
  /** Имя файла в папке sounds (например celebration.mp3) */
  celebrationSoundFile: string | null;
  /** Свой трек при 100% */
  celebrationSoundAt100: boolean;
  /** Свой трек при цели дня (вместо встроенного) */
  celebrationSoundAtGoal: boolean;
  /** Сколько секунд играть свой трек (0 = до конца файла). */
  celebrationSoundDurationSec: number;
  theme: AppTheme;
  /** Шаблон для кнопки «Начать день» */
  defaultMorningTemplateId: string | null;
  /** Мягкие подсказки по зонам дня из истории */
  zoneHintsEnabled: boolean;
}

export type DayZoneHintTone = 'neutral' | 'catch-up';

export interface DayZoneHint {
  text: string;
  tone: DayZoneHintTone;
}

export interface DayState {
  date: string;
  tasks: Task[];
  close?: DayCloseSummary;
  /** recurringId, пропущенные в этот день после удаления */
  skippedRecurring?: string[];
}

export interface DayHistoryEntry {
  date: string;
  label: string;
  percent: number;
  taskCount: number;
  isToday: boolean;
  closed: boolean;
  mood?: DayMood;
  investedMinutes: number;
  note?: string;
  goalReached?: boolean;
}

export interface WeeklyReportSummary {
  weekStart: string;
  weekEnd: string;
  title: string;
  isCurrentWeek: boolean;
  days: DayHistoryEntry[];
  averagePercent: number;
  totalInvestedMinutes: number;
  activeDays: number;
  closedDays: number;
  goalsReached: number;
  bestDay: { date: string; label: string; percent: number } | null;
  previousWeekAverage: number | null;
  weekDelta: number | null;
}

export interface MonthlyReportDayCell {
  date: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  percent: number;
  taskCount: number;
  closed: boolean;
  mood?: DayMood;
  investedMinutes: number;
  goalReached?: boolean;
}

export interface MonthlyReportSummary {
  year: number;
  month: number;
  title: string;
  isCurrentMonth: boolean;
  weeks: MonthlyReportDayCell[][];
  days: DayHistoryEntry[];
  averagePercent: number;
  totalInvestedMinutes: number;
  activeDays: number;
  closedDays: number;
  goalsReached: number;
  bestDay: { date: string; label: string; percent: number } | null;
  previousMonthAverage: number | null;
  monthDelta: number | null;
}

export type AchievementId =
  | 'first_close'
  | 'percent_100'
  | 'streak_7'
  | 'streak_30'
  | 'best_week'
  | 'goal_streak_5';

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  emoji: string;
}

export interface UnlockedAchievement {
  id: AchievementId;
  unlockedAt: string;
}

export interface AchievementStatus extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt?: string;
  progressText?: string;
}

export interface PersistedData {
  settings: AppSettings;
  days: Record<string, DayState>;
  widgetPosition: { x: number; y: number } | null;
  activeTimer: ActiveTimer | null;
  dayTemplates: DayTemplate[];
  recurringTasks: RecurringTaskDefinition[];
  macroGoals: MacroGoal[];
  streak: StreakState;
  lastCloseDayReminderDate: string | null;
  /** @deprecated use dismissedPastCloseDates */
  dismissedYesterdayCloseDate: string | null;
  dismissedPastCloseDates?: string[];
  /** id → ISO дата разблокировки */
  unlockedAchievements?: Partial<Record<AchievementId, string>>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  widgetIcon: 'photo:new-rocket',
  widgetCustomPhotoFile: null,
  autostart: false,
  sleepWakeHour: 7,
  sleepBedHour: 23,
  reminderEnabled: false,
  reminderIntervalMinutes: 30,
  onboardingCompleted: false,
  widgetSetupHintDismissed: false,
  closeDayReminderEnabled: true,
  closeDayReminderHour: 21,
  closeDayReminderMinute: 0,
  dailyGoalEnabled: false,
  dailyGoalPercent: 70,
  goalCelebrationEnabled: true,
  celebrationSoundFile: null,
  celebrationSoundAt100: true,
  celebrationSoundAtGoal: false,
  celebrationSoundDurationSec: 10,
  theme: 'light',
  defaultMorningTemplateId: null,
  zoneHintsEnabled: true,
};

export { todayKey } from './dateKey';
