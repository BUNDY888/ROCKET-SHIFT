import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  screen,
  dialog,
  clipboard,
  Notification,
  shell,
  type NativeImage,
} from 'electron';
import { configureAppIdentity } from './appIdentity';
import path from 'path';
import fs from 'fs';
import {
  loadData,
  saveData,
  getTodayState,
  updateDay,
  updateSettings,
  DATA_DIR,
  DATA_FILE,
} from './store';
import {
  clearCelebrationSoundFile,
  getCelebrationSoundMediaUrl,
  storeCelebrationSoundFromPicker,
} from './celebrationSound';
import {
  clearWidgetPhotoFile,
  getWidgetCustomPhotoMediaUrl,
  storeWidgetPhotoFromPicker,
  WIDGET_ICON_CUSTOM_ID,
} from './widgetPhoto';
import type {
  DayState,
  PersistedData,
  AppSettings,
  TemporalTask,
  ActiveTimer,
  MacroGoalCompletion,
} from './types';
import { calculateTotalPercent, applyActiveTimer } from './calculations';
import {
  createDayTemplate,
  templateItemsToTasks,
} from './dayTemplates';
import {
  findCurrentTemporalTasks,
  needsProgressReminder,
} from './currentTask';
import { buildHistorySummary, getDayByDate } from './history';
import { buildWeeklyReport } from './weeklyReport';
import { buildMonthlyReport } from './monthlyReport';
import { addFactMinutes, completeNextFixed, findFactTargetTask } from './widgetActions';
import { buildCloseDayPreview, closeDayWithAchievements, DEFAULT_STREAK } from './dayClose';
import { buildAchievementStatuses } from './achievements';
import {
  buildCloseDayReminderMessage,
  markCloseDayReminderSent,
  shouldSendCloseDayReminder,
} from './closeDayReminder';
import {
  dismissYesterdayClose,
  getPendingYesterdayClose,
} from './yesterdayClose';
import {
  buildMorningStartInfo,
  copyYesterdayPlanToToday,
} from './morningStart';
import { buildDayZoneHint } from './dayZoneHints';
import {
  createMacroGoal,
  deleteMacroGoal,
  syncMacroGoals,
  updateMacroGoal,
  type MacroGoalInput,
} from './macroGoals';
import {
  ensureUniqueRecurringIdsInDay,
  ensureRecurringTasksForDay,
  setTaskRecurrence,
  reconcileRecurringMacroGoals,
  syncRecurringTemplatesFromDay,
  deleteRecurringDefinition,
  setRecurringEnabled,
} from './recurringTasks';
import type { DayMood, RecurrencePattern } from './types';
import { todayKey } from './types';
import {
  buildDaysCsv,
  buildExportJson,
  isValidBackupPayload,
} from './exportData';

let mainWindow: BrowserWindow | null = null;
let widgetWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

/** Keep in sync with src/styles.css (.widget-shell.expanded) */
const WIDGET_TILE_W = 132;
const WIDGET_TILE_H = 44;
const WIDGET_MENU_W = 196;
const WIDGET_GAP = 8;
const WIDGET_EXPANDED_W = WIDGET_TILE_W + WIDGET_GAP + WIDGET_MENU_W;
const WIDGET_EXPANDED_H = 52;

/** Расширяем/сжимаем окно, не двигая плитку: правый край окна остаётся на месте. */
function applyWidgetBounds(expanded: boolean): void {
  if (!widgetWindow || widgetWindow.isDestroyed()) return;
  const compactW = WIDGET_TILE_W;
  const compactH = WIDGET_TILE_H;
  const expandedW = WIDGET_EXPANDED_W;
  const expandedH = WIDGET_EXPANDED_H;
  const bounds = widgetWindow.getBounds();
  const area = screen.getDisplayMatching(bounds).workArea;
  const right = bounds.x + bounds.width;
  const targetW = expanded ? expandedW : compactW;
  const targetH = expanded ? expandedH : compactH;
  let nx = right - targetW;
  nx = Math.max(area.x, Math.min(nx, area.x + area.width - targetW));
  widgetWindow.setBounds(
    { x: nx, y: bounds.y, width: targetW, height: targetH },
    false,
  );
}

function setWidgetMousePassthrough(ignore: boolean): void {
  if (!widgetWindow || widgetWindow.isDestroyed()) return;
  if (ignore) {
    widgetWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    widgetWindow.setIgnoreMouseEvents(false);
  }
}
let timerBroadcast: ReturnType<typeof setInterval> | null = null;
let reminderCheckInterval: ReturnType<typeof setInterval> | null = null;
let lastReminderAt = 0;
let persisted: PersistedData = loadData();
persisted = reconcileRecurringMacroGoals(persisted);
persisted = syncMacroGoals(persisted, false).data;
let pendingMacroGoalCompletions: MacroGoalCompletion[] = [];

function applyMacroGoalSync(announceNew: boolean): void {
  const synced = syncMacroGoals(persisted, announceNew);
  persisted = synced.data;
  saveData(persisted);
  if (announceNew && synced.newlyCompleted.length > 0) {
    pendingMacroGoalCompletions.push(...synced.newlyCompleted);
  }
}

configureAppIdentity();

const isDev = !app.isPackaged;
const VITE_DEV_URL = 'http://localhost:5173';

function iconSearchDirs(): string[] {
  const dirs: string[] = [];
  if (app.isPackaged) {
    dirs.push(path.join(process.resourcesPath, 'icons'));
    dirs.push(process.resourcesPath);
  }
  dirs.push(path.join(process.cwd(), 'build'));
  dirs.push(path.join(__dirname, '..', 'build'));
  dirs.push(path.join(app.getAppPath(), 'build'));
  return dirs;
}

function loadIconAt(baseDir: string, names: string[]): NativeImage | undefined {
  for (const name of names) {
    const filePath = path.join(baseDir, name);
    if (!fs.existsSync(filePath)) continue;
    const img = nativeImage.createFromPath(filePath);
    if (!img.isEmpty()) return img;
  }
  return undefined;
}

function resolveAppIcon(): NativeImage | undefined {
  for (const dir of iconSearchDirs()) {
    const img = loadIconAt(dir, ['icon.ico', 'icon.png']);
    if (img) return img;
  }
  if (app.isPackaged && process.platform === 'win32') {
    const fromExe = nativeImage.createFromPath(process.execPath);
    if (!fromExe.isEmpty()) return fromExe;
  }
  return undefined;
}

function sizeForTray(img: NativeImage): NativeImage {
  const scale = screen.getPrimaryDisplay().scaleFactor;
  const px = Math.max(16, Math.round(16 * scale));
  const { width, height } = img.getSize();
  if (width === px && height === px) return img;
  return img.resize({ width: px, height: px, quality: 'best' });
}

function resolveTrayIcon(): NativeImage {
  const trayFiles = ['tray-32.png', 'tray-16.png', 'icon.png'];
  for (const dir of iconSearchDirs()) {
    const img = loadIconAt(dir, trayFiles);
    if (img) return sizeForTray(img);
  }
  const appImg = resolveAppIcon();
  if (appImg) return sizeForTray(appImg);
  if (process.platform === 'win32') {
    const fromExe = nativeImage.createFromPath(process.execPath);
    if (!fromExe.isEmpty()) return sizeForTray(fromExe);
  }
  return nativeImage.createEmpty();
}

function loadWindow(win: BrowserWindow, hash: string): void {
  if (isDev) {
    win.loadURL(`${VITE_DEV_URL}/#${hash}`);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'), { hash });
  }
}

function stopTimerBroadcast(): void {
  if (timerBroadcast) {
    clearInterval(timerBroadcast);
    timerBroadcast = null;
  }
}

function formatMinutesBrief(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min} мин`;
  if (min === 0) return `${h} ч`;
  return `${h} ч ${min} мин`;
}

let planLimitDialogOpen = false;

async function promptTimerPlanLimit(task: TemporalTask): Promise<void> {
  const planLabel = formatMinutesBrief(task.plannedMinutes);
  const elapsedLabel = formatMinutesBrief(Math.floor(timerTotalSeconds(persisted.activeTimer!) / 60));

  showReminderBalloon(
    'Rocket Shift — план выполнен',
    `«${task.name}»: ${elapsedLabel} по таймеру (план ${planLabel}). Выберите действие в окне.`,
  );

  const { response } = await dialog.showMessageBox({
    type: 'question',
    title: 'План по таймеру выполнен',
    message: `«${task.name}»`,
    detail: `По таймеру уже ${elapsedLabel} — это ваш план (${planLabel}).\n\nПродолжить учёт времени сверх плана или остановить таймер?`,
    buttons: ['Продолжить', 'Остановить таймер'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  const timer = persisted.activeTimer;
  if (!timer || timer.taskId !== task.id) return;

  if (response === 0) {
    persisted.activeTimer = { ...timer, allowOvertime: true, planLimitPromptShown: true };
    saveData(persisted);
    broadcastState();
    return;
  }

  commitActiveTimer();
  broadcastState();
}

function checkTimerPlanLimit(): void {
  if (planLimitDialogOpen) return;
  const timer = persisted.activeTimer;
  if (!timer || timer.pausedAt != null || timer.allowOvertime || timer.planLimitPromptShown) return;

  const day = getTodayState(persisted);
  const task = day.tasks.find((t): t is TemporalTask => t.type === 'temporal' && t.id === timer.taskId);
  if (!task || task.plannedMinutes <= 0) return;

  const elapsedMin = Math.floor(timerTotalSeconds(timer) / 60);
  if (elapsedMin < task.plannedMinutes) return;

  persisted.activeTimer = { ...timer, planLimitPromptShown: true };
  saveData(persisted);

  planLimitDialogOpen = true;
  void promptTimerPlanLimit(task).finally(() => {
    planLimitDialogOpen = false;
  });
}

function startTimerBroadcast(): void {
  stopTimerBroadcast();
  timerBroadcast = setInterval(() => {
    checkTimerPlanLimit();
    broadcastState();
  }, 1000);
}

function timerFlagsFrom(timer: ActiveTimer | null): Pick<ActiveTimer, 'allowOvertime' | 'planLimitPromptShown'> {
  return {
    allowOvertime: timer?.allowOvertime,
    planLimitPromptShown: timer?.planLimitPromptShown,
  };
}

function timerTotalSeconds(timer: NonNullable<PersistedData['activeTimer']>, at = Date.now()): number {
  if (timer.pausedAt != null) {
    return timer.pausedTotalSeconds ?? Math.max(0, Math.floor(timer.baseActualMinutes * 60));
  }
  const runSec = Math.max(0, Math.floor((at - timer.startedAt) / 1000));
  return Math.max(0, Math.floor(timer.baseActualMinutes * 60) + runSec);
}

function pauseActiveTimer(): void {
  const timer = persisted.activeTimer;
  if (!timer || timer.pausedAt != null) return;

  const totalSec = timerTotalSeconds(timer);
  const savedMinutes = Math.floor(totalSec / 60);
  const day = getTodayState(persisted);
  day.tasks = day.tasks.map((t) => {
    if (t.type === 'temporal' && t.id === timer.taskId) {
      return { ...t, actualMinutes: savedMinutes };
    }
    return t;
  });
  persisted = updateDay(persisted, day);
  persisted.activeTimer = {
    taskId: timer.taskId,
    startedAt: timer.startedAt,
    baseActualMinutes: savedMinutes,
    pausedAt: Date.now(),
    pausedTotalSeconds: totalSec,
    ...timerFlagsFrom(timer),
  };
  saveData(persisted);
  stopTimerBroadcast();
}

function commitActiveTimer(): void {
  if (!persisted.activeTimer) return;
  const timer = persisted.activeTimer;
  const totalSec = timerTotalSeconds(timer);
  const minutes = Math.floor(totalSec / 60);
  const day = getTodayState(persisted);
  day.tasks = day.tasks.map((t) => {
    if (t.type === 'temporal' && t.id === timer.taskId) {
      return { ...t, actualMinutes: minutes };
    }
    return t;
  });
  persisted = updateDay(persisted, day);
  persisted.activeTimer = null;
  saveData(persisted);
  stopTimerBroadcast();
}

function resumeActiveTimer(taskId: string): boolean {
  const timer = persisted.activeTimer;
  if (!timer?.pausedAt || timer.taskId !== taskId) return false;
  const day = getTodayState(persisted);
  const task = day.tasks.find((t) => t.type === 'temporal' && t.id === taskId);
  if (!task || task.type !== 'temporal') return false;
  persisted.activeTimer = {
    taskId,
    startedAt: Date.now(),
    baseActualMinutes: task.actualMinutes,
    ...timerFlagsFrom(timer),
  };
  saveData(persisted);
  startTimerBroadcast();
  return true;
}

function buildStatePayload() {
  persisted = ensureRecurringTasksForDay(persisted, todayKey());
  const macroSynced = syncMacroGoals(persisted, false);
  persisted = macroSynced.data;
  const celebrations = [...pendingMacroGoalCompletions];
  pendingMacroGoalCompletions = [];
  const day = getTodayState(persisted);
  const tasks = applyActiveTimer(day.tasks, persisted.activeTimer);
  const percent = calculateTotalPercent(tasks);
  return {
    day: { ...day, tasks },
    settings: persisted.settings,
    percent,
    widgetPosition: persisted.widgetPosition,
    activeTimer: persisted.activeTimer,
    dayTemplates: persisted.dayTemplates,
    recurringTasks: persisted.recurringTasks ?? [],
    macroGoals: persisted.macroGoals ?? [],
    macroGoalCelebrations: celebrations,
    streak: persisted.streak ?? DEFAULT_STREAK,
    morningStart: buildMorningStartInfo(persisted),
    zoneHint: buildDayZoneHint(persisted, day, percent),
    celebrationSoundUrl: getCelebrationSoundMediaUrl(DATA_DIR, persisted.settings),
    widgetCustomPhotoUrl: getWidgetCustomPhotoMediaUrl(DATA_DIR, persisted.settings),
    mainWindowVisible: isMainWindowVisible(),
  };
}

function clearTodayClose(): void {
  const day = getTodayState(persisted);
  if (day.close) {
    delete day.close;
    persisted = updateDay(persisted, day);
  }
}

function resetDayProgress(): DayState {
  commitActiveTimer();
  clearTodayClose();
  const day = getTodayState(persisted);
  day.tasks = day.tasks.map((t) => {
    if (t.type === 'temporal') {
      return { ...t, actualMinutes: 0 };
    }
    return { ...t, completed: false, completedHour: null };
  });
  persisted = updateDay(persisted, day);
  return day;
}

function onReminderNotificationClick(): void {
  showMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('ui:open-close-day');
  }
}

function showReminderBalloon(title: string, content: string): void {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body: content,
      icon: resolveAppIcon(),
      silent: false,
    });
    notification.on('click', onReminderNotificationClick);
    notification.show();
    return;
  }
  if (!tray || tray.isDestroyed()) return;
  if (process.platform === 'win32') {
    tray.displayBalloon({ title, content, icon: resolveTrayIcon() });
    return;
  }
  tray.setToolTip(`${title}: ${content}`);
}

function checkProgressReminders(): void {
  if (!persisted.settings.reminderEnabled) return;
  const intervalMs = persisted.settings.reminderIntervalMinutes * 60_000;
  if (intervalMs < 60_000) return;
  if (Date.now() - lastReminderAt < intervalMs) return;

  const day = getTodayState(persisted);
  const tasks = applyActiveTimer(day.tasks, persisted.activeTimer);
  const current = findCurrentTemporalTasks(tasks).filter(needsProgressReminder);
  if (current.length === 0) return;

  lastReminderAt = Date.now();
  const label =
    current.length === 1
      ? current[0].name
      : `${current[0].name} и ещё ${current.length - 1}`;
  showReminderBalloon(
    'Rocket Shift',
    `Сейчас по плану: ${label}. Запустите таймер или отметьте факт.`,
  );
}

function checkCloseDayReminder(): void {
  const result = shouldSendCloseDayReminder(persisted);
  if (!result?.send) return;

  showReminderBalloon(
    'Rocket Shift — закрыть день?',
    buildCloseDayReminderMessage(result.percent, result.investedMinutes),
  );
  persisted = markCloseDayReminderSent(persisted);
  saveData(persisted);
}

function remindersActive(): boolean {
  return (
    persisted.settings.reminderEnabled || persisted.settings.closeDayReminderEnabled
  );
}

function stopReminderLoop(): void {
  if (reminderCheckInterval) {
    clearInterval(reminderCheckInterval);
    reminderCheckInterval = null;
  }
}

function startReminderLoop(): void {
  stopReminderLoop();
  if (!remindersActive()) return;
  reminderCheckInterval = setInterval(() => {
    checkProgressReminders();
    checkCloseDayReminder();
  }, 60_000);
  checkCloseDayReminder();
}

function broadcastState(): void {
  const payload = buildStatePayload();
  const windows = [mainWindow, widgetWindow];
  for (const win of windows) {
    if (win && !win.isDestroyed()) {
      win.webContents.send('state:update', payload);
    }
  }
}

function applyAutostart(enabled: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath,
    args: isDev ? [] : undefined,
  });
}

function createMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return;
  }
  mainWindow = new BrowserWindow({
    width: 920,
    height: 860,
    minWidth: 640,
    minHeight: 480,
    title: 'Rocket Shift',
    icon: resolveAppIcon(),
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  loadWindow(mainWindow, '/');
  mainWindow.setMenuBarVisibility(false);
  mainWindow.on('closed', () => {
    mainWindow = null;
    broadcastState();
  });
  mainWindow.on('hide', () => broadcastState());
  mainWindow.on('show', () => broadcastState());
}

function isMainWindowVisible(): boolean {
  return Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible());
}

function showMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return;
  }
  createMainWindow();
  mainWindow?.show();
  mainWindow?.focus();
}

function hideMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
}

function toggleMainWindow(): void {
  if (isMainWindowVisible()) {
    hideMainWindow();
    return;
  }
  showMainWindow();
}

function createWidgetWindow(): void {
  if (widgetWindow && !widgetWindow.isDestroyed()) return;

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const margin = 10;

  let x = screenW - WIDGET_TILE_W - margin;
  let y = Math.round((screenH - WIDGET_TILE_H) / 2);
  if (persisted.widgetPosition) {
    x = persisted.widgetPosition.x;
    y = persisted.widgetPosition.y;
  }

  widgetWindow = new BrowserWindow({
    width: WIDGET_TILE_W,
    height: WIDGET_TILE_H,
    x,
    y,
    icon: resolveAppIcon(),
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  loadWindow(widgetWindow, '/widget');
  widgetWindow.setAlwaysOnTop(true, 'screen-saver');
  widgetWindow.webContents.on('did-finish-load', () => {
    applyWidgetBounds(false);
    setWidgetMousePassthrough(true);
  });
  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });
}

function createTray(): void {
  const icon = resolveTrayIcon();
  if (icon.isEmpty()) {
    console.warn('Rocket Shift: tray icon missing, check build/tray-*.png in resources');
  }
  tray = new Tray(icon);
  tray.setToolTip('Rocket Shift');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Открыть',
      click: () => showMainWindow(),
    },
    { type: 'separator' },
    {
      label: 'Выход',
      click: () => app.quit(),
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('click', () => showMainWindow());
  tray.on('balloon-click', onReminderNotificationClick);
}

function registerIpc(): void {
  ipcMain.handle('state:get', () => buildStatePayload());

  ipcMain.handle('day:save', (_e, day: DayState) => {
    const prevDay = persisted.days[day.date];
    const mergedRaw: DayState = {
      ...(prevDay ?? { date: day.date, tasks: [] }),
      ...day,
    };

    if (prevDay) {
      const skipped = new Set(mergedRaw.skippedRecurring ?? []);
      for (const t of prevDay.tasks) {
        if (
          t.recurringId &&
          !mergedRaw.tasks.some((x) => x.recurringId === t.recurringId)
        ) {
          skipped.add(t.recurringId);
        }
      }
      if (skipped.size > 0) {
        mergedRaw.skippedRecurring = [...skipped];
      }
    }

    const merged = ensureUniqueRecurringIdsInDay(mergedRaw);
    if (!day.close && prevDay?.close) {
      merged.close = prevDay.close;
    }
    persisted = syncRecurringTemplatesFromDay(persisted, merged);
    persisted = updateDay(persisted, merged);
    if (merged.date === todayKey()) {
      persisted = ensureRecurringTasksForDay(persisted, merged.date);
    }
    applyMacroGoalSync(true);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('macroGoals:create', (_e, input: MacroGoalInput) => {
    persisted = createMacroGoal(persisted, input);
    applyMacroGoalSync(true);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('macroGoals:update', (_e, goalId: string, input: MacroGoalInput) => {
    persisted = updateMacroGoal(persisted, goalId, input);
    applyMacroGoalSync(true);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('macroGoals:delete', (_e, goalId: string) => {
    persisted = deleteMacroGoal(persisted, goalId);
    applyMacroGoalSync(false);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('day:reset', () => {
    const day = resetDayProgress();
    persisted = ensureRecurringTasksForDay(persisted, todayKey());
    broadcastState();
    return getTodayState(persisted);
  });

  ipcMain.handle('day:resetFull', () => {
    commitActiveTimer();
    clearTodayClose();
    const day = getTodayState(persisted);
    day.tasks = [];
    day.skippedRecurring = [];
    persisted = updateDay(persisted, day);
    persisted = ensureRecurringTasksForDay(persisted, todayKey());
    broadcastState();
    return getTodayState(persisted);
  });

  ipcMain.handle(
    'recurring:setForTask',
    (_e, taskId: string, pattern: RecurrencePattern | null) => {
      commitActiveTimer();
      const day = getTodayState(persisted);
      persisted = setTaskRecurrence(persisted, day, taskId, pattern);
      persisted = ensureRecurringTasksForDay(persisted, todayKey());
      broadcastState();
      return buildStatePayload();
    },
  );

  ipcMain.handle('recurring:setEnabled', (_e, recurringId: string, enabled: boolean) => {
    persisted = setRecurringEnabled(persisted, recurringId, enabled);
    persisted = ensureRecurringTasksForDay(persisted, todayKey());
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('recurring:delete', (_e, recurringId: string) => {
    persisted = deleteRecurringDefinition(persisted, recurringId);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('export:backupJson', async () => {
    commitActiveTimer();
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Сохранить резервную копию',
      defaultPath: `rocket-shift-backup-${todayKey()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    try {
      fs.writeFileSync(filePath, buildExportJson(persisted), 'utf-8');
      return { ok: true, filePath };
    } catch {
      return { ok: false, error: 'write_failed' as const };
    }
  });

  ipcMain.handle('export:daysCsv', async () => {
    commitActiveTimer();
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Экспорт дней в CSV',
      defaultPath: `rocket-shift-days-${todayKey()}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    try {
      fs.writeFileSync(filePath, buildDaysCsv(persisted), 'utf-8');
      return { ok: true, filePath };
    } catch {
      return { ok: false, error: 'write_failed' as const };
    }
  });

  ipcMain.handle('import:backupJson', async () => {
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Восстановить из резервной копии',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (canceled || !filePaths[0]) return { ok: false, canceled: true };
    try {
      const raw = fs.readFileSync(filePaths[0], 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      if (!isValidBackupPayload(parsed)) {
        return { ok: false, error: 'invalid_file' as const };
      }
      commitActiveTimer();
      if (fs.existsSync(DATA_FILE)) {
        fs.copyFileSync(DATA_FILE, `${DATA_FILE}.bak`);
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      persisted = loadData();
      stopTimerBroadcast();
      broadcastState();
      return { ok: true, filePath: filePaths[0] };
    } catch {
      return { ok: false, error: 'read_failed' as const };
    }
  });

  ipcMain.handle('share:copyImage', (_e, dataUrl: string) => {
    try {
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        return { ok: false, error: 'invalid_file' as const };
      }
      const img = nativeImage.createFromDataURL(dataUrl);
      if (img.isEmpty()) return { ok: false, error: 'invalid_file' as const };
      clipboard.writeImage(img);
      return { ok: true };
    } catch {
      return { ok: false, error: 'write_failed' as const };
    }
  });

  ipcMain.handle('share:saveImage', async (_e, dataUrl: string, defaultName?: string) => {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return { ok: false, error: 'invalid_file' as const };
    }
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Сохранить карточку дня',
      defaultPath: defaultName ?? `rocket-shift-${todayKey()}.png`,
      filters: [{ name: 'PNG', extensions: ['png'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    try {
      const img = nativeImage.createFromDataURL(dataUrl);
      if (img.isEmpty()) return { ok: false, error: 'invalid_file' as const };
      fs.writeFileSync(filePath, img.toPNG());
      return { ok: true, filePath };
    } catch {
      return { ok: false, error: 'write_failed' as const };
    }
  });

  ipcMain.handle('celebration:pickSound', async () => {
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Выбрать трек',
      filters: [
        {
          name: 'Аудио',
          extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm', 'flac'],
        },
      ],
      properties: ['openFile'],
    });
    if (canceled || !filePaths[0]) return { ok: false, canceled: true as const };

    const stored = storeCelebrationSoundFromPicker(DATA_DIR, filePaths[0]);
    if (!stored.ok) return { ok: false, error: stored.error };

    clearCelebrationSoundFile(DATA_DIR, persisted.settings.celebrationSoundFile);
    persisted = updateSettings(persisted, {
      celebrationSoundFile: stored.fileName,
      celebrationSoundAt100: true,
    });
    broadcastState();
    return { ok: true, fileName: stored.fileName };
  });

  ipcMain.handle('celebration:clearSound', () => {
    clearCelebrationSoundFile(DATA_DIR, persisted.settings.celebrationSoundFile);
    persisted = updateSettings(persisted, { celebrationSoundFile: null });
    broadcastState();
    return { ok: true };
  });

  ipcMain.handle('widget:pickPhoto', async () => {
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Выбрать фото для виджета',
      filters: [
        {
          name: 'Изображения',
          extensions: ['png', 'jpg', 'jpeg', 'webp'],
        },
      ],
      properties: ['openFile'],
    });
    if (canceled || !filePaths[0]) return { ok: false, canceled: true as const };

    const stored = storeWidgetPhotoFromPicker(DATA_DIR, filePaths[0]);
    if (!stored.ok) return { ok: false, error: stored.error };

    clearWidgetPhotoFile(DATA_DIR, persisted.settings.widgetCustomPhotoFile);
    persisted = updateSettings(persisted, {
      widgetCustomPhotoFile: stored.fileName,
      widgetIcon: WIDGET_ICON_CUSTOM_ID,
    });
    broadcastState();
    return { ok: true, fileName: stored.fileName };
  });

  ipcMain.handle('widget:clearPhoto', () => {
    clearWidgetPhotoFile(DATA_DIR, persisted.settings.widgetCustomPhotoFile);
    const nextIcon =
      persisted.settings.widgetIcon === WIDGET_ICON_CUSTOM_ID
        ? 'photo:new-rocket'
        : persisted.settings.widgetIcon;
    persisted = updateSettings(persisted, {
      widgetCustomPhotoFile: null,
      widgetIcon: nextIcon,
    });
    broadcastState();
    return { ok: true };
  });

  ipcMain.handle('settings:save', (_e, partial: Partial<AppSettings>) => {
    persisted = updateSettings(persisted, partial);
    if (partial.autostart !== undefined) {
      applyAutostart(partial.autostart);
    }
    if (
      partial.reminderEnabled !== undefined ||
      partial.reminderIntervalMinutes !== undefined ||
      partial.closeDayReminderEnabled !== undefined ||
      partial.closeDayReminderHour !== undefined ||
      partial.closeDayReminderMinute !== undefined
    ) {
      startReminderLoop();
    }
    broadcastState();
    return persisted.settings;
  });

  ipcMain.handle('widget:position', (_e, pos: { x: number; y: number }) => {
    persisted.widgetPosition = pos;
    saveData(persisted);
  });

  ipcMain.handle('shell:openExternal', (_e, url: unknown) => {
    if (typeof url !== 'string') return { ok: false as const };
    if (!url.startsWith('mailto:') && !url.startsWith('https://') && !url.startsWith('http://')) {
      return { ok: false as const };
    }
    return shell.openExternal(url).then(
      () => ({ ok: true as const }),
      () => ({ ok: false as const }),
    );
  });

  ipcMain.on('window:open-main', () => showMainWindow());
  ipcMain.on('window:show-main', () => showMainWindow());

  ipcMain.handle('window:toggle-main', () => {
    toggleMainWindow();
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.on('widget:drag', (_e, { dx, dy }: { dx: number; dy: number }) => {
    if (!widgetWindow || widgetWindow.isDestroyed()) return;
    const [x, y] = widgetWindow.getPosition();
    const nx = x + dx;
    const ny = y + dy;
    widgetWindow.setPosition(nx, ny);
    persisted.widgetPosition = { x: nx, y: ny };
  });

  ipcMain.on('widget:drag-end', () => {
    saveData(persisted);
  });

  ipcMain.handle('timer:start', (_e, taskId: string) => {
    if (resumeActiveTimer(taskId)) {
      broadcastState();
      return buildStatePayload();
    }
    commitActiveTimer();
    const day = getTodayState(persisted);
    const task = day.tasks.find((t) => t.type === 'temporal' && t.id === taskId);
    if (!task || task.type !== 'temporal') {
      return buildStatePayload();
    }
    persisted.activeTimer = {
      taskId,
      startedAt: Date.now(),
      baseActualMinutes: task.actualMinutes,
    };
    saveData(persisted);
    startTimerBroadcast();
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('timer:pause', () => {
    pauseActiveTimer();
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('timer:stop', () => {
    commitActiveTimer();
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('template:save', (_e, name: string) => {
    const day = getTodayState(persisted);
    if (day.tasks.length === 0) {
      return buildStatePayload();
    }
    const template = createDayTemplate(name, day.tasks);
    persisted.dayTemplates = [...persisted.dayTemplates, template];
    saveData(persisted);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('template:apply', (_e, templateId: string) => {
    commitActiveTimer();
    const template = persisted.dayTemplates.find((t) => t.id === templateId);
    if (!template) return buildStatePayload();
    const day = getTodayState(persisted);
    day.tasks = templateItemsToTasks(template.tasks);
    if (day.close) delete day.close;
    persisted = updateDay(persisted, day);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('day:copyYesterdayPlan', () => {
    commitActiveTimer();
    persisted = copyYesterdayPlanToToday(persisted);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('template:delete', (_e, templateId: string) => {
    persisted.dayTemplates = persisted.dayTemplates.filter((t) => t.id !== templateId);
    if (persisted.settings.defaultMorningTemplateId === templateId) {
      persisted.settings.defaultMorningTemplateId = null;
    }
    saveData(persisted);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('day:closePreview', (_e, dateKey?: string) =>
    buildCloseDayPreview(persisted, dateKey ?? todayKey()),
  );

  ipcMain.handle('day:close', (_e, mood: DayMood, note?: string, dateKey?: string) => {
    const targetDate = dateKey ?? todayKey();
    if (targetDate === todayKey()) {
      commitActiveTimer();
    }
    const { data, newlyUnlocked } = closeDayWithAchievements(persisted, mood, note, targetDate);
    persisted = data;
    saveData(persisted);
    applyMacroGoalSync(true);
    if (targetDate === todayKey()) {
      stopTimerBroadcast();
    }
    broadcastState();
    return { state: buildStatePayload(), newlyUnlocked };
  });

  ipcMain.handle('achievements:list', () => buildAchievementStatuses(persisted));

  ipcMain.handle('day:pendingYesterdayClose', () => getPendingYesterdayClose(persisted));

  ipcMain.handle('day:dismissYesterdayClose', () => {
    persisted = dismissYesterdayClose(persisted);
    saveData(persisted);
    return true;
  });

  ipcMain.handle('history:summary', (_e, dayCount: number) => {
    const count = Math.min(30, Math.max(1, Number(dayCount) || 7));
    return buildHistorySummary(persisted, count);
  });

  ipcMain.handle('history:weeklyReport', (_e, weekOffset?: number) =>
    buildWeeklyReport(persisted, Number(weekOffset) || 0),
  );

  ipcMain.handle('history:monthlyReport', (_e, monthOffset?: number) =>
    buildMonthlyReport(persisted, Number(monthOffset) || 0),
  );

  ipcMain.handle('history:getDay', (_e, date: string) => {
    const day = getDayByDate(persisted, date);
    if (!day) return null;
    const tasks =
      date === todayKey()
        ? applyActiveTimer(day.tasks, persisted.activeTimer)
        : day.tasks;
    const percent = day.close?.percentAtClose ?? calculateTotalPercent(tasks);
    return {
      day: { ...day, tasks },
      percent,
    };
  });

  ipcMain.handle('widget:resize', (_e, expanded: boolean) => {
    applyWidgetBounds(expanded);
  });

  ipcMain.on('widget:ignore-mouse-events', (_e, payload: { ignore: boolean }) => {
    setWidgetMousePassthrough(payload.ignore);
  });

  ipcMain.handle('widget:addFact', (_e, minutes: number) => {
    const preferred = persisted.activeTimer?.taskId ?? null;
    commitActiveTimer();
    persisted = addFactMinutes(persisted, minutes, preferred);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('widget:completeNextFixed', () => {
    commitActiveTimer();
    persisted = completeNextFixed(persisted);
    broadcastState();
    return buildStatePayload();
  });

  ipcMain.handle('widget:toggleTimer', () => {
    if (persisted.activeTimer) {
      if (persisted.activeTimer.pausedAt) {
        resumeActiveTimer(persisted.activeTimer.taskId);
      } else {
        pauseActiveTimer();
      }
    } else {
      const day = getTodayState(persisted);
      const target = findFactTargetTask(day.tasks);
      if (target) {
        persisted.activeTimer = {
          taskId: target.id,
          startedAt: Date.now(),
          baseActualMinutes: target.actualMinutes,
        };
        saveData(persisted);
        startTimerBroadcast();
      }
    }
    broadcastState();
    return buildStatePayload();
  });
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    registerIpc();
    applyAutostart(persisted.settings.autostart);
    if (persisted.activeTimer && !persisted.activeTimer.pausedAt) startTimerBroadcast();
    startReminderLoop();
    createMainWindow();
    createWidgetWindow();
    createTray();
    broadcastState();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
      else showMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      /* keep running in tray */
    }
  });

  app.on('before-quit', () => {
    commitActiveTimer();
    stopReminderLoop();
    saveData(persisted);
  });
}
