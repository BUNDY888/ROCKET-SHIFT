/// <reference types="vite/client" />



import type {
  StatePayload,
  DayDetailPayload,
  FileTransferResult,
  CloseDayResultPayload,
  CelebrationSoundPickResult,
  WidgetPhotoPickResult,
} from '../electron/preload';

import type { DayState, AppSettings, DayHistoryEntry, StreakState, DayMood, CloseDayPreview, PendingYesterdayClose, WeeklyReportSummary, MonthlyReportSummary, RecurrencePattern, RecurringTaskDefinition, AchievementStatus } from '../electron/types';



declare global {

  interface Window {

    electronAPI: {

      getState: () => Promise<StatePayload>;

      saveDay: (day: DayState) => Promise<StatePayload>;

      resetDay: () => Promise<DayState>;

      resetDayFull: () => Promise<DayState>;

      saveSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;

      openMain: () => void;

      showMain: () => void;

      toggleMain: () => Promise<StatePayload>;

      onStateUpdate: (cb: (payload: StatePayload) => void) => () => void;

      widgetDrag: (dx: number, dy: number) => void;

      widgetDragEnd: () => void;

      widgetResize: (expanded: boolean) => Promise<void>;

      widgetSetMousePassthrough: (ignore: boolean) => void;

      widgetAddFact: (minutes: number) => Promise<StatePayload>;

      widgetCompleteNextFixed: () => Promise<StatePayload>;

      widgetToggleTimer: () => Promise<StatePayload>;

      timerStart: (taskId: string) => Promise<StatePayload>;

      timerPause: () => Promise<StatePayload>;

      timerStop: () => Promise<StatePayload>;

      saveTemplate: (name: string) => Promise<StatePayload>;

      applyTemplate: (templateId: string) => Promise<StatePayload>;

      deleteTemplate: (templateId: string) => Promise<StatePayload>;

      copyYesterdayPlan: () => Promise<StatePayload>;

      getHistorySummary: (dayCount: number) => Promise<DayHistoryEntry[]>;

      getHistoryDay: (date: string) => Promise<DayDetailPayload | null>;

      getWeeklyReport: (weekOffset?: number) => Promise<WeeklyReportSummary>;

      getMonthlyReport: (monthOffset?: number) => Promise<MonthlyReportSummary>;

      getCloseDayPreview: (dateKey?: string) => Promise<CloseDayPreview>;

      closeDay: (mood: DayMood, note?: string, dateKey?: string) => Promise<CloseDayResultPayload>;

      getAchievementsList: () => Promise<AchievementStatus[]>;

      getPendingYesterdayClose: () => Promise<PendingYesterdayClose | null>;

      dismissYesterdayClose: (dateKey: string) => Promise<boolean>;

      listPendingPastCloses: () => Promise<PendingYesterdayClose[]>;

      dismissAllPendingPastCloses: () => Promise<boolean>;

      setTaskRecurrence: (taskId: string, pattern: RecurrencePattern | null) => Promise<StatePayload>;

      setRecurringEnabled: (recurringId: string, enabled: boolean) => Promise<StatePayload>;

      deleteRecurring: (recurringId: string) => Promise<StatePayload>;

      createMacroGoal: (input: {
        name: string;
        emoji?: string;
        linkTag: string;
        targetHours: number;
        priorHours?: number;
        weeklyPaceHours?: number | null;
        milestoneLabel: string;
      }) => Promise<StatePayload>;

      updateMacroGoal: (
        goalId: string,
        input: {
          name: string;
          emoji?: string;
          linkTag: string;
          targetHours: number;
          priorHours?: number;
          weeklyPaceHours?: number | null;
          milestoneLabel: string;
        },
      ) => Promise<StatePayload>;

      deleteMacroGoal: (goalId: string) => Promise<StatePayload>;

      exportBackupJson: () => Promise<FileTransferResult>;

      exportDaysCsv: () => Promise<FileTransferResult>;

      importBackupJson: () => Promise<FileTransferResult>;

      shareCopyImage: (dataUrl: string) => Promise<FileTransferResult>;

      shareSaveImage: (dataUrl: string, defaultName?: string) => Promise<FileTransferResult>;

      openExternal: (url: string) => Promise<{ ok: boolean }>;

      onOpenCloseDay: (cb: () => void) => () => void;

      pickCelebrationSound: () => Promise<CelebrationSoundPickResult>;

      clearCelebrationSound: () => Promise<{ ok: boolean }>;

      pickWidgetPhoto: () => Promise<WidgetPhotoPickResult>;

      clearWidgetPhoto: () => Promise<{ ok: boolean }>;

    };

  }

}



export {};


