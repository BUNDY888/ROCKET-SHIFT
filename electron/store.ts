import path from 'path';
import fs from 'fs';
import type { DayState, PersistedData, AppSettings } from './types';
import { DEFAULT_STREAK } from './dayClose';
import { syncAchievements } from './achievements';
import { DEFAULT_SETTINGS, todayKey } from './types';
import { resolveCelebrationSoundPath } from './celebrationSound';
import { resolveWidgetPhotoPath, WIDGET_ICON_CUSTOM_ID } from './widgetPhoto';

const DATA_DIR = path.join(
  process.env.APPDATA || process.env.HOME || '.',
  'RocketShift',
);
const DATA_FILE = path.join(DATA_DIR, 'data.json');

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function defaultData(): PersistedData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    days: {},
    widgetPosition: null,
    activeTimer: null,
    dayTemplates: [],
    recurringTasks: [],
    macroGoals: [],
    streak: { ...DEFAULT_STREAK },
    lastCloseDayReminderDate: null,
    dismissedYesterdayCloseDate: null,
    dismissedPastCloseDates: [],
  };
}

export function loadData(): PersistedData {
  ensureDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedData;
      const savedRaw = parsed.settings as AppSettings & {
        colorThresholds?: unknown;
        histogramMaxPercent?: unknown;
        chartStartHour?: number;
        chartEndHour?: number;
        histogramMode?: string;
      };
      const {
        colorThresholds: _c,
        histogramMaxPercent: _h,
        chartStartHour: _cs,
        chartEndHour: _ce,
        histogramMode: savedMode,
        ...savedSettings
      } = savedRaw;
      const clampSleepHour = (h: number, fallback: number) => {
        if (!Number.isFinite(h)) return fallback;
        const n = ((h % 24) + 24) % 24;
        return Math.round(n * 1000) / 1000;
      };
      const sleepWakeHour =
        typeof savedSettings.sleepWakeHour === 'number'
          ? clampSleepHour(savedSettings.sleepWakeHour, DEFAULT_SETTINGS.sleepWakeHour)
          : savedMode === 'owl'
            ? 12
            : savedMode === 'lark'
              ? 6
              : DEFAULT_SETTINGS.sleepWakeHour;
      const sleepBedHour =
        typeof savedSettings.sleepBedHour === 'number'
          ? clampSleepHour(savedSettings.sleepBedHour, DEFAULT_SETTINGS.sleepBedHour)
          : savedMode === 'owl'
            ? 6
            : savedMode === 'lark'
              ? 24 % 24
              : DEFAULT_SETTINGS.sleepBedHour;
      const removedWidgetIcons = new Set([
        '⚫', '⚪', '⬛', '⬜', '🖤', '🤍', '☯️', '♟️', '🎱', '🐼', '👻', '🦇', '🏁', '🔲',
        '🕶️', '🎹', '🦴', '▪️', '▫️',
      ]);
      const widgetIcon =
        typeof savedSettings.widgetIcon === 'string' &&
        !removedWidgetIcons.has(savedSettings.widgetIcon)
          ? savedSettings.widgetIcon
          : DEFAULT_SETTINGS.widgetIcon;
      const hasAnyTasks = Object.values(parsed.days ?? {}).some(
        (d) => Array.isArray(d?.tasks) && d.tasks.length > 0,
      );
      const onboardingCompleted =
        savedSettings.onboardingCompleted === true
          ? true
          : savedSettings.onboardingCompleted === false
            ? false
            : hasAnyTasks;
      const result: PersistedData = {
        ...defaultData(),
        ...parsed,
        settings: {
          ...DEFAULT_SETTINGS,
          ...savedSettings,
          sleepWakeHour,
          sleepBedHour,
          widgetIcon,
          onboardingCompleted,
          dailyGoalEnabled: savedSettings.dailyGoalEnabled ?? DEFAULT_SETTINGS.dailyGoalEnabled,
          dailyGoalPercent:
            typeof savedSettings.dailyGoalPercent === 'number'
              ? Math.min(100, Math.max(1, Math.round(savedSettings.dailyGoalPercent)))
              : DEFAULT_SETTINGS.dailyGoalPercent,
          goalCelebrationEnabled:
            savedSettings.goalCelebrationEnabled === false
              ? false
              : DEFAULT_SETTINGS.goalCelebrationEnabled,
          celebrationSoundFile:
            typeof savedSettings.celebrationSoundFile === 'string'
              ? savedSettings.celebrationSoundFile
              : DEFAULT_SETTINGS.celebrationSoundFile,
          celebrationSoundAt100:
            savedSettings.celebrationSoundAt100 === false
              ? false
              : DEFAULT_SETTINGS.celebrationSoundAt100,
          celebrationSoundAtGoal: savedSettings.celebrationSoundAtGoal === true,
          celebrationSoundDurationSec:
            typeof savedSettings.celebrationSoundDurationSec === 'number'
              ? Math.min(600, Math.max(0, Math.round(savedSettings.celebrationSoundDurationSec)))
              : DEFAULT_SETTINGS.celebrationSoundDurationSec,
          widgetCustomPhotoFile:
            typeof savedSettings.widgetCustomPhotoFile === 'string'
              ? savedSettings.widgetCustomPhotoFile
              : DEFAULT_SETTINGS.widgetCustomPhotoFile,
          theme:
            savedSettings.theme === 'dark' ||
            savedSettings.theme === 'light' ||
            savedSettings.theme === 'system'
              ? savedSettings.theme
              : DEFAULT_SETTINGS.theme,
          defaultMorningTemplateId:
            typeof savedSettings.defaultMorningTemplateId === 'string'
              ? savedSettings.defaultMorningTemplateId
              : DEFAULT_SETTINGS.defaultMorningTemplateId,
          widgetSetupHintDismissed:
            savedSettings.widgetSetupHintDismissed === false
              ? false
              : savedSettings.widgetSetupHintDismissed === true || onboardingCompleted
                ? true
                : DEFAULT_SETTINGS.widgetSetupHintDismissed,
          zoneHintsEnabled:
            savedSettings.zoneHintsEnabled === false ? false : DEFAULT_SETTINGS.zoneHintsEnabled,
        },
        activeTimer: parsed.activeTimer ?? null,
        dayTemplates: Array.isArray(parsed.dayTemplates) ? parsed.dayTemplates : [],
        recurringTasks: Array.isArray(parsed.recurringTasks) ? parsed.recurringTasks : [],
        macroGoals: Array.isArray(parsed.macroGoals)
          ? parsed.macroGoals.slice(0, 3).map((g) => ({
              id: String(g.id),
              name: typeof g.name === 'string' ? g.name : 'Цель',
              emoji: typeof g.emoji === 'string' ? g.emoji : '🎯',
              linkTag: typeof g.linkTag === 'string' ? g.linkTag : '',
              targetMinutes:
                typeof g.targetMinutes === 'number'
                  ? Math.max(1, Math.round(g.targetMinutes))
                  : 36000,
              priorMinutes:
                typeof g.priorMinutes === 'number'
                  ? Math.max(0, Math.round(g.priorMinutes))
                  : 0,
              accumulatedMinutes:
                typeof g.accumulatedMinutes === 'number'
                  ? Math.max(0, Math.round(g.accumulatedMinutes))
                  : 0,
              weeklyPaceMinutes:
                typeof g.weeklyPaceMinutes === 'number'
                  ? Math.max(0, Math.round(g.weeklyPaceMinutes))
                  : null,
              milestoneLabel:
                typeof g.milestoneLabel === 'string' ? g.milestoneLabel : 'Цель достигнута',
              completedAt: typeof g.completedAt === 'string' ? g.completedAt : null,
              createdAt: typeof g.createdAt === 'string' ? g.createdAt : new Date().toISOString(),
            }))
          : [],
        streak: parsed.streak ?? { ...DEFAULT_STREAK },
        lastCloseDayReminderDate: parsed.lastCloseDayReminderDate ?? null,
        dismissedYesterdayCloseDate: parsed.dismissedYesterdayCloseDate ?? null,
        dismissedPastCloseDates:
          parsed.dismissedPastCloseDates ??
          (parsed.dismissedYesterdayCloseDate ? [parsed.dismissedYesterdayCloseDate] : []),
        unlockedAchievements: parsed.unlockedAchievements ?? {},
      };
      const synced = syncAchievements(result, false);
      let data = synced.data;
      if (
        data.settings.celebrationSoundFile &&
        !resolveCelebrationSoundPath(DATA_DIR, data.settings.celebrationSoundFile)
      ) {
        data = {
          ...data,
          settings: { ...data.settings, celebrationSoundFile: null },
        };
      }
      if (
        data.settings.widgetCustomPhotoFile &&
        !resolveWidgetPhotoPath(DATA_DIR, data.settings.widgetCustomPhotoFile)
      ) {
        const revertIcon =
          data.settings.widgetIcon === WIDGET_ICON_CUSTOM_ID
            ? DEFAULT_SETTINGS.widgetIcon
            : data.settings.widgetIcon;
        data = {
          ...data,
          settings: {
            ...data.settings,
            widgetCustomPhotoFile: null,
            widgetIcon: revertIcon,
          },
        };
      } else if (
        data.settings.widgetIcon === WIDGET_ICON_CUSTOM_ID &&
        !data.settings.widgetCustomPhotoFile
      ) {
        data = {
          ...data,
          settings: { ...data.settings, widgetIcon: DEFAULT_SETTINGS.widgetIcon },
        };
      }
      const defaultId = data.settings.defaultMorningTemplateId;
      if (
        defaultId &&
        !data.dayTemplates.some((t) => t.id === defaultId)
      ) {
        data = {
          ...data,
          settings: { ...data.settings, defaultMorningTemplateId: null },
        };
      }
      const beforeCount = Object.keys(result.unlockedAchievements ?? {}).length;
      const afterCount = Object.keys(data.unlockedAchievements ?? {}).length;
      if (afterCount > beforeCount || data !== synced.data) {
        saveData(data);
      }
      return data;
    }
  } catch {
    /* ignore corrupt file */
  }
  return defaultData();
}

export function saveData(data: PersistedData): void {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getTodayState(data: PersistedData): DayState {
  const key = todayKey();
  if (!data.days[key]) {
    data.days[key] = { date: key, tasks: [] };
  }
  return data.days[key];
}

export function updateSettings(
  data: PersistedData,
  settings: Partial<AppSettings>,
): PersistedData {
  data.settings = { ...data.settings, ...settings };
  saveData(data);
  return data;
}

export function updateDay(
  data: PersistedData,
  day: DayState,
): PersistedData {
  data.days[day.date] = day;
  saveData(data);
  return data;
}

export { DATA_DIR, DATA_FILE };
