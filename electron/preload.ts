import { contextBridge, ipcRenderer } from 'electron';

import type { DayState, AppSettings, ActiveTimer, DayTemplate, DayHistoryEntry, StreakState, DayMood, CloseDayPreview, PendingYesterdayClose, WeeklyReportSummary, MonthlyReportSummary, RecurrencePattern, RecurringTaskDefinition, UnlockedAchievement, AchievementStatus, MorningStartInfo, DayZoneHint, MacroGoal, MacroGoalCompletion } from './types';



export interface StatePayload {

  day: DayState;

  settings: AppSettings;

  percent: number;

  widgetPosition: { x: number; y: number } | null;

  activeTimer: ActiveTimer | null;

  dayTemplates: DayTemplate[];

  recurringTasks: RecurringTaskDefinition[];

  macroGoals: MacroGoal[];

  macroGoalCelebrations: MacroGoalCompletion[];

  streak: StreakState;

  morningStart: MorningStartInfo;

  zoneHint: DayZoneHint | null;

  celebrationSoundUrl: string | null;

  widgetCustomPhotoUrl: string | null;

  mainWindowVisible: boolean;

}

export interface CelebrationSoundPickResult {
  ok: boolean;
  canceled?: boolean;
  fileName?: string;
  error?: 'unsupported' | 'too_large' | 'read_failed';
}

export interface WidgetPhotoPickResult {
  ok: boolean;
  canceled?: boolean;
  fileName?: string;
  error?: 'unsupported' | 'too_large' | 'read_failed';
}

export interface CloseDayResultPayload {
  state: StatePayload;
  newlyUnlocked: UnlockedAchievement[];
}



export interface DayDetailPayload {

  day: DayState;

  percent: number;

}

export interface FileTransferResult {
  ok: boolean;
  canceled?: boolean;
  filePath?: string;
  error?: 'invalid_file' | 'read_failed' | 'write_failed';
}



contextBridge.exposeInMainWorld('electronAPI', {

  getState: (): Promise<StatePayload> => ipcRenderer.invoke('state:get'),

  saveDay: (day: DayState) => ipcRenderer.invoke('day:save', day),

  resetDay: () => ipcRenderer.invoke('day:reset'),

  resetDayFull: () => ipcRenderer.invoke('day:resetFull'),

  saveSettings: (partial: Partial<AppSettings>) =>

    ipcRenderer.invoke('settings:save', partial),

  openMain: () => ipcRenderer.send('window:open-main'),

  showMain: () => ipcRenderer.send('window:show-main'),

  toggleMain: () => ipcRenderer.invoke('window:toggle-main') as Promise<StatePayload>,

  onStateUpdate: (cb: (payload: StatePayload) => void) => {

    const listener = (_: unknown, payload: StatePayload) => cb(payload);

    ipcRenderer.on('state:update', listener);

    return () => ipcRenderer.removeListener('state:update', listener);

  },

  widgetDrag: (dx: number, dy: number) =>

    ipcRenderer.send('widget:drag', { dx, dy }),

  widgetDragEnd: () => ipcRenderer.send('widget:drag-end'),

  widgetResize: (expanded: boolean) =>
    ipcRenderer.invoke('widget:resize', expanded) as Promise<void>,

  widgetSetMousePassthrough: (ignore: boolean) =>

    ipcRenderer.send('widget:ignore-mouse-events', { ignore }),

  widgetAddFact: (minutes: number) =>

    ipcRenderer.invoke('widget:addFact', minutes),

  widgetCompleteNextFixed: () => ipcRenderer.invoke('widget:completeNextFixed'),

  widgetToggleTimer: () => ipcRenderer.invoke('widget:toggleTimer'),

  timerStart: (taskId: string) => ipcRenderer.invoke('timer:start', taskId),

  timerPause: () => ipcRenderer.invoke('timer:pause'),

  timerStop: () => ipcRenderer.invoke('timer:stop'),

  saveTemplate: (name: string) => ipcRenderer.invoke('template:save', name),

  applyTemplate: (templateId: string) =>

    ipcRenderer.invoke('template:apply', templateId),

  deleteTemplate: (templateId: string) =>

    ipcRenderer.invoke('template:delete', templateId),

  copyYesterdayPlan: () => ipcRenderer.invoke('day:copyYesterdayPlan'),

  pickCelebrationSound: (): Promise<CelebrationSoundPickResult> =>
    ipcRenderer.invoke('celebration:pickSound'),

  clearCelebrationSound: (): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('celebration:clearSound'),

  pickWidgetPhoto: (): Promise<WidgetPhotoPickResult> =>
    ipcRenderer.invoke('widget:pickPhoto'),

  clearWidgetPhoto: (): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('widget:clearPhoto'),

  getHistorySummary: (dayCount: number): Promise<DayHistoryEntry[]> =>

    ipcRenderer.invoke('history:summary', dayCount),

  getHistoryDay: (date: string): Promise<DayDetailPayload | null> =>

    ipcRenderer.invoke('history:getDay', date),

  getWeeklyReport: (weekOffset?: number): Promise<WeeklyReportSummary> =>
    ipcRenderer.invoke('history:weeklyReport', weekOffset),

  getMonthlyReport: (monthOffset?: number): Promise<MonthlyReportSummary> =>
    ipcRenderer.invoke('history:monthlyReport', monthOffset),

  getCloseDayPreview: (dateKey?: string): Promise<CloseDayPreview> =>
    ipcRenderer.invoke('day:closePreview', dateKey),

  closeDay: (mood: DayMood, note?: string, dateKey?: string) =>
    ipcRenderer.invoke('day:close', mood, note, dateKey),

  getAchievementsList: (): Promise<AchievementStatus[]> =>
    ipcRenderer.invoke('achievements:list'),

  getPendingYesterdayClose: (): Promise<PendingYesterdayClose | null> =>
    ipcRenderer.invoke('day:pendingYesterdayClose'),

  dismissYesterdayClose: (): Promise<boolean> =>
    ipcRenderer.invoke('day:dismissYesterdayClose'),

  setTaskRecurrence: (taskId: string, pattern: RecurrencePattern | null) =>
    ipcRenderer.invoke('recurring:setForTask', taskId, pattern),

  setRecurringEnabled: (recurringId: string, enabled: boolean) =>
    ipcRenderer.invoke('recurring:setEnabled', recurringId, enabled),

  deleteRecurring: (recurringId: string) =>
    ipcRenderer.invoke('recurring:delete', recurringId),

  createMacroGoal: (input: {
    name: string;
    emoji?: string;
    linkTag: string;
    targetHours: number;
    priorHours?: number;
    weeklyPaceHours?: number | null;
    milestoneLabel: string;
  }) => ipcRenderer.invoke('macroGoals:create', input) as Promise<StatePayload>,

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
  ) => ipcRenderer.invoke('macroGoals:update', goalId, input) as Promise<StatePayload>,

  deleteMacroGoal: (goalId: string) =>
    ipcRenderer.invoke('macroGoals:delete', goalId) as Promise<StatePayload>,

  exportBackupJson: (): Promise<FileTransferResult> =>
    ipcRenderer.invoke('export:backupJson'),

  exportDaysCsv: (): Promise<FileTransferResult> =>
    ipcRenderer.invoke('export:daysCsv'),

  importBackupJson: (): Promise<FileTransferResult> =>
    ipcRenderer.invoke('import:backupJson'),

  shareCopyImage: (dataUrl: string): Promise<FileTransferResult> =>
    ipcRenderer.invoke('share:copyImage', dataUrl),

  shareSaveImage: (dataUrl: string, defaultName?: string): Promise<FileTransferResult> =>
    ipcRenderer.invoke('share:saveImage', dataUrl, defaultName),

  openExternal: (url: string): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('shell:openExternal', url),

  onOpenCloseDay: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on('ui:open-close-day', listener);
    return () => ipcRenderer.removeListener('ui:open-close-day', listener);
  },

});


