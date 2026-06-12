import { useEffect, useRef, useState } from 'react';

import { useAppState } from '../hooks/useAppState';

import { PercentDisplay } from '../components/PercentDisplay';
import { DayZoneHint } from '../components/DayZoneHint';
import { DailyGoalBar } from '../components/DailyGoalBar';

import { NowPanel } from '../components/NowPanel';

import { WeeklyReportPanel } from '../components/WeeklyReportPanel';
import { MonthlyReportPanel } from '../components/MonthlyReportPanel';

import { DayReadOnlyView } from '../components/DayReadOnlyView';

import { HistogramChart } from '../components/HistogramChart';

import { SleepScheduleControl } from '../components/SleepScheduleControl';

import {
  HistogramChartModeSwitch,
  type ChartSectionView,
} from '../components/HistogramChartModeSwitch';

import { DayTemplatePanel } from '../components/DayTemplatePanel';
import { MorningStartBanner } from '../components/MorningStartBanner';
import { resolveMorningTemplate } from '../lib/morningStart';

import { TaskList } from '../components/TaskList';

import { SettingsPanel } from '../components/SettingsPanel';
import { OnboardingOverlay } from '../components/OnboardingOverlay';
import { WidgetSetupBanner } from '../components/WidgetSetupBanner';
import { CloseDayModal } from '../components/CloseDayModal';
import { PastDaysCloseBanner } from '../components/PastDaysCloseBanner';
import { AchievementsModal } from '../components/AchievementsModal';
import type { DayMood } from '../../electron/types';
import { formatInvestedDuration } from '../lib/dayClose';

import type { Task, WeeklyReportSummary, MonthlyReportSummary, RecurrencePattern, UnlockedAchievement } from '../../electron/types';
import { todayKey } from '../../electron/types';

import type { StatePayload } from '../../electron/preload';

import type { DayDetailPayload } from '../../electron/preload';

import { calculatePercentBreakdown, syncAllTemporalTaskEnds } from '../lib/calculations';

import { createFixedTask, createTemporalTask } from '../lib/taskFactory';
import { createOnboardingSampleTasks } from '../lib/onboardingSampleDay';
import { useAppHotkeys } from '../hooks/useAppHotkeys';
import { useGoalCelebration } from '../hooks/useGoalCelebration';
import { playTrophyCloseSound } from '../lib/goalCelebration';
import { FocusModePanel } from '../components/FocusModePanel';
import { MacroGoalUnlockBanner } from '../components/MacroGoalUnlockBanner';
import {
  MacroGoalsHeaderButtons,
  MacroGoalsHeaderPanel,
  useMacroGoalsHeaderState,
} from '../components/MainMacroGoalsBar';
import type { MacroGoalCompletion } from '../../electron/types';
import { RocketLogo } from '../components/RocketLogo';
import { resolveFocusTask } from '../lib/focusTask';
import { isEditableTarget } from '../lib/hotkeys';



export function MainApp() {

  const {

    state,

    percent,

    updateTasks,

    resetDay,

    resetDayFull,

    saveSettings,

    saveTemplate,

    applyTemplate,

    deleteTemplate,

    saveDay,

    savePendingRef,

    setLocalState,

  } = useAppState();

  const [tasks, setTasks] = useState<Task[]>([]);

  const [timerTick, setTimerTick] = useState(0);

  const [clockTick, setClockTick] = useState(0);

  const [chartSectionView, setChartSectionView] = useState<ChartSectionView>(null);

  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportSummary | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportSummary | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);

  const [historyDayDetail, setHistoryDayDetail] = useState<DayDetailPayload | null>(null);
  const [closeDayOpen, setCloseDayOpen] = useState(false);
  const [closeDayLoading, setCloseDayLoading] = useState(false);
  const [closeDayTargetDate, setCloseDayTargetDate] = useState<string | undefined>();
  const [yesterdayCloseLabel, setYesterdayCloseLabel] = useState<string | undefined>();
  const [focusMode, setFocusMode] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [macroGoalsOpen, setMacroGoalsOpen] = useMacroGoalsHeaderState();
  const [macroCelebrations, setMacroCelebrations] = useState<MacroGoalCompletion[]>([]);
  const [newAchievements, setNewAchievements] = useState<UnlockedAchievement[]>([]);
  const [pendingPastCloseCount, setPendingPastCloseCount] = useState(0);
  const yesterdayCheckDone = useRef(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const tasksDirtyRef = useRef(false);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;



  useEffect(() => {
    if (savePendingRef.current || tasksDirtyRef.current) return;
    if (state) setTasks(syncAllTemporalTaskEnds(state.day.tasks));
  }, [state?.day.tasks, state?.day.date, savePendingRef]);



  useEffect(() => {

    if (!state?.activeTimer) return;

    const id = setInterval(() => setTimerTick((t) => t + 1), 1000);

    return () => clearInterval(id);

  }, [state?.activeTimer]);



  useEffect(() => {

    const id = setInterval(() => setClockTick((t) => t + 1), 30_000);

    return () => clearInterval(id);

  }, []);



  useEffect(() => {
    if (!window.electronAPI) return;
    return window.electronAPI.onOpenCloseDay(() => {
      setCloseDayTargetDate(undefined);
      setYesterdayCloseLabel(undefined);
      setCloseDayOpen(true);
    });
  }, []);

  const refreshPendingPastCloseCount = async () => {
    const list = await window.electronAPI.listPendingPastCloses();
    setPendingPastCloseCount(list.length);
    return list;
  };

  useEffect(() => {
    if (!state?.settings.onboardingCompleted) return;
    void refreshPendingPastCloseCount();
  }, [state?.settings.onboardingCompleted, state?.day.date, state?.day.close, closeDayOpen]);

  useEffect(() => {
    if (!state?.settings.onboardingCompleted) return;
    if (yesterdayCheckDone.current) return;
    yesterdayCheckDone.current = true;
    void refreshPendingPastCloseCount().then((list) => {
      const pending = list[0];
      if (!pending) return;
      setCloseDayTargetDate(pending.date);
      setYesterdayCloseLabel(pending.label);
      setCloseDayOpen(true);
    });
  }, [state?.settings.onboardingCompleted]);

  useEffect(() => {
    if (!window.electronAPI || !state) return;
    const syncDay = () => {
      if (state.day.date !== todayKey()) {
        window.electronAPI.getState().then(applyPayload);
      }
    };
    syncDay();
    const id = setInterval(syncDay, 60_000);
    return () => clearInterval(id);
  }, [state?.day.date]);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.getWeeklyReport(weekOffset).then(setWeeklyReport);
  }, [
    weekOffset,
    state?.day.date,
    state?.percent,
    state?.day.close?.closedAt,
  ]);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.getMonthlyReport(monthOffset).then(setMonthlyReport);
  }, [
    monthOffset,
    state?.day.date,
    state?.percent,
    state?.day.close?.closedAt,
  ]);

  useEffect(() => {
    if (!selectedHistoryDate) {
      setHistoryDayDetail(null);
      return;
    }
    window.electronAPI.getHistoryDay(selectedHistoryDate).then(setHistoryDayDetail);
  }, [selectedHistoryDate, state?.day.date, state?.macroGoals]);



  const handleHistoryTaskGoalChange = async (taskId: string, macroGoalId: string | null) => {
    if (!historyDayDetail || !selectedHistoryDate) return;
    const updatedTasks = historyDayDetail.day.tasks.map((t) => {
      if (t.id !== taskId || t.type !== 'temporal') return t;
      return { ...t, macroGoalId };
    });
    const updatedDay = { ...historyDayDetail.day, tasks: updatedTasks };
    const payload = await saveDay(updatedDay);
    applyPayload(payload);
    const detail = await window.electronAPI.getHistoryDay(selectedHistoryDate);
    setHistoryDayDetail(detail);
  };

  const applyPayload = (payload: StatePayload) => {

    setLocalState({ ...payload, loading: false });

    setTasks(payload.day.tasks);

    if (payload.macroGoalCelebrations?.length) {
      setMacroCelebrations(payload.macroGoalCelebrations);
    }

  };



  const handleTasksChange = (next: Task[]) => {
    const synced = syncAllTemporalTaskEnds(next);
    tasksDirtyRef.current = true;
    setTasks(synced);

    if (!state) return;

    const breakdown = calculatePercentBreakdown(synced);

    setLocalState((prev) =>

      prev

        ? {

            ...prev,

            day: { ...prev.day, tasks: synced },

            percent: breakdown.total,

          }

        : prev,

    );

    const immediate =
      synced.length < tasks.length ||
      tasks.some((t) => t.recurringId && !synced.some((s) => s.id === t.id));

    if (saveTimer.current) clearTimeout(saveTimer.current);

    const persist = () => {
      void updateTasks(synced).then((payload) => {
        tasksDirtyRef.current = false;
        setTasks(syncAllTemporalTaskEnds(payload.day.tasks));
        if (payload.macroGoalCelebrations?.length) {
          setMacroCelebrations(payload.macroGoalCelebrations);
        }
      });
    };

    if (immediate) {
      persist();
    } else {
      saveTimer.current = setTimeout(persist, 300);
    }
  };



  const handleTimerStart = async (taskId: string) => {

    applyPayload(await window.electronAPI.timerStart(taskId));

  };



  const handleTimerPause = async () => {

    applyPayload(await window.electronAPI.timerPause());

  };



  const handleTimerStop = async () => {

    applyPayload(await window.electronAPI.timerStop());

  };

  const openCloseDayModal = () => {
    setNewAchievements([]);
    setCloseDayTargetDate(undefined);
    setYesterdayCloseLabel(undefined);
    setCloseDayOpen(true);
  };

  const openPendingPastDayClose = async (): Promise<boolean> => {
    const list = await refreshPendingPastCloseCount();
    const pending = list[0];
    if (!pending) return false;
    setNewAchievements([]);
    setCloseDayTargetDate(pending.date);
    setYesterdayCloseLabel(pending.label);
    setCloseDayOpen(true);
    return true;
  };

  const handleDismissAllPendingPastCloses = async () => {
    await window.electronAPI.dismissAllPendingPastCloses();
    setCloseDayTargetDate(undefined);
    setYesterdayCloseLabel(undefined);
    setCloseDayOpen(false);
    await refreshPendingPastCloseCount();
  };

  const openPastDayClose = (date: string, label: string) => {
    setSelectedHistoryDate(null);
    setHistoryDayDetail(null);
    setNewAchievements([]);
    setCloseDayTargetDate(date);
    setYesterdayCloseLabel(label);
    setCloseDayOpen(true);
  };

  const handleToggleTimer = async () => {
    applyPayload(await window.electronAPI.widgetToggleTimer());
  };

  useAppHotkeys(
    {
      onToggleTimer: handleToggleTimer,
      onAddTask: () => {
        handleTasksChange([...tasksRef.current, createTemporalTask()]);
      },
      onCloseDay: openCloseDayModal,
    },
    Boolean(state?.settings.onboardingCompleted) && !closeDayOpen && !focusMode && !achievementsOpen,
  );

  useAppHotkeys(
    {
      onToggleTimer: handleToggleTimer,
      onAddTask: () => {},
      onCloseDay: () => {},
    },
    Boolean(state?.settings.onboardingCompleted) && focusMode && !closeDayOpen,
  );

  useEffect(() => {
    if (!state?.settings.onboardingCompleted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setFocusMode((value) => !value);
        return;
      }
      if (focusMode && event.key === 'Escape') {
        event.preventDefault();
        setFocusMode(false);
        return;
      }
      if (achievementsOpen && event.key === 'Escape') {
        event.preventDefault();
        setAchievementsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusMode, achievementsOpen, state?.settings.onboardingCompleted]);

  useEffect(

    () => () => {

      if (saveTimer.current) clearTimeout(saveTimer.current);

    },

    [],

  );

  const goalCelebrating = useGoalCelebration({
    percent,
    goalEnabled: state?.settings.dailyGoalEnabled ?? false,
    goalPercent: state?.settings.dailyGoalPercent ?? 70,
    celebrationEnabled: state?.settings.goalCelebrationEnabled !== false,
    celebrationSoundUrl: state?.celebrationSoundUrl ?? null,
    celebrationSoundAt100: state?.settings.celebrationSoundAt100 !== false,
    celebrationSoundAtGoal: state?.settings.celebrationSoundAtGoal === true,
    celebrationSoundDurationSec: state?.settings.celebrationSoundDurationSec ?? 10,
  });

  if (!state) {

    return <div className="loading">Загрузка…</div>;

  }



  const breakdown = calculatePercentBreakdown(tasks);
  const displayPercent = breakdown.total;

  const handleChartSectionChange = (view: ChartSectionView) => {
    setChartSectionView(view);
    if (view === 'week') {
      setWeekOffset(0);
    }
    if (view === 'month') {
      setMonthOffset(0);
    }
  };

  const finishOnboarding = async (loadSample: boolean) => {
    await saveSettings({ onboardingCompleted: true });
    if (loadSample) {
      const sample = createOnboardingSampleTasks();
      setTasks(sample);
      await updateTasks(sample);
    }
  };

  const showOnboarding = !state.settings.onboardingCompleted;
  const showWidgetSetupHint =
    !showOnboarding &&
    !focusMode &&
    !state.settings.widgetSetupHintDismissed;
  const dayClosed = Boolean(state.day.close);
  const showMorningStart = !showOnboarding && !focusMode && !dayClosed && tasks.length === 0;
  const morningPrimary = resolveMorningTemplate(
    state.dayTemplates ?? [],
    state.settings.defaultMorningTemplateId,
  );
  const streakCurrent = state.streak?.current ?? 0;

  const handleCloseDayConfirm = async (mood: DayMood, note: string): Promise<boolean> => {
    if (mood === '🏆' && state.settings.goalCelebrationEnabled !== false) {
      playTrophyCloseSound();
    }
    const closedPastDate = closeDayTargetDate;
    setCloseDayLoading(true);
    try {
      const result = await window.electronAPI.closeDay(mood, note, closeDayTargetDate);
      applyPayload(result.state);
      setNewAchievements(result.newlyUnlocked);
      setCloseDayTargetDate(undefined);
      setYesterdayCloseLabel(undefined);
      await refreshPendingPastCloseCount();
      if (closedPastDate && (await openPendingPastDayClose())) {
        return true;
      }
      return false;
    } finally {
      setCloseDayLoading(false);
    }
  };

  const handleDismissYesterdayClose = async () => {
    if (!closeDayTargetDate) {
      setCloseDayOpen(false);
      return;
    }
    await window.electronAPI.dismissYesterdayClose(closeDayTargetDate);
    setCloseDayTargetDate(undefined);
    setYesterdayCloseLabel(undefined);
    setCloseDayOpen(false);
    await refreshPendingPastCloseCount();
  };

  const handleCloseDayModalClose = () => {
    if (!closeDayLoading) {
      setCloseDayOpen(false);
      setNewAchievements([]);
    }
  };

  const handleRecurrenceChange = async (
    taskId: string,
    pattern: RecurrencePattern | null,
  ) => {
    applyPayload(await window.electronAPI.setTaskRecurrence(taskId, pattern));
  };

  const handleRecurringEnabled = async (recurringId: string, enabled: boolean) => {
    applyPayload(await window.electronAPI.setRecurringEnabled(recurringId, enabled));
  };

  const handleRecurringDelete = async (recurringId: string) => {
    applyPayload(await window.electronAPI.deleteRecurring(recurringId));
  };

  const handleApplyMorningTemplate = async (templateId: string) => {
    applyPayload(await applyTemplate(templateId));
  };

  const handleCopyYesterdayPlan = async () => {
    applyPayload(await window.electronAPI.copyYesterdayPlan());
  };

  const handleSetDefaultMorningTemplate = async (templateId: string | null) => {
    await saveSettings({ defaultMorningTemplateId: templateId });
  };

  const focusTask = resolveFocusTask(tasks, state.activeTimer ?? null);



  return (

    <div className={`app main-app${focusMode ? ' main-app-focus' : ''}`}>

      <header className="main-header">
        <div className="header-row">
          <div className="header-brand">
            <RocketLogo />
            <h1>Rocket Shift</h1>
          </div>
          <div className="header-actions">
            {!focusMode && streakCurrent > 0 && (
              <span className="day-streak-badge" title="Дней подряд с закрытым днём">
                🔥 {streakCurrent}
              </span>
            )}
            {!showOnboarding && (
              <>
                {!focusMode && (
                  <>
                    <MacroGoalsHeaderButtons
                      goals={state.macroGoals ?? []}
                      onAchievements={() => setAchievementsOpen(true)}
                      open={macroGoalsOpen}
                      onToggle={() => setMacroGoalsOpen((v) => !v)}
                    />
                    <button
                      type="button"
                      className="btn-secondary header-chip focus-mode-toggle"
                      onClick={() => setFocusMode(true)}
                      title="Режим фокуса (Ctrl+Shift+F)"
                    >
                      🎯 Фокус
                    </button>
                  </>
                )}
                {focusMode && (
                  <button
                    type="button"
                    className="btn-secondary header-chip focus-mode-toggle active"
                    onClick={() => setFocusMode(false)}
                    title="Выйти из режима фокуса"
                  >
                    ◧ Выйти
                  </button>
                )}
                {showMorningStart && morningPrimary && (
                  <button
                    type="button"
                    className="btn-secondary header-chip morning-header-btn"
                    onClick={() => handleApplyMorningTemplate(morningPrimary.id)}
                    title={`Начать день: ${morningPrimary.name}`}
                  >
                    ☀️ Старт
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {!focusMode && !showOnboarding && (
          <MacroGoalsHeaderPanel goals={state.macroGoals ?? []} open={macroGoalsOpen} />
        )}
      </header>

      {focusMode ? (
        <FocusModePanel
          task={focusTask}
          activeTimer={state.activeTimer ?? null}
          percent={displayPercent}
          timerTick={timerTick}
          onToggleTimer={handleToggleTimer}
          onExit={() => setFocusMode(false)}
          onSubtasksChange={
            focusTask
              ? (subtasks) => {
                  handleTasksChange(
                    tasks.map((t) =>
                      t.id === focusTask.id && t.type === 'temporal' ? { ...t, subtasks } : t,
                    ),
                  );
                }
              : undefined
          }
        />
      ) : (
        <>
      {showMorningStart && (
        <MorningStartBanner
          templates={state.dayTemplates ?? []}
          defaultTemplateId={state.settings.defaultMorningTemplateId}
          yesterdayTaskCount={state.morningStart?.yesterdayTaskCount ?? 0}
          yesterdayLabel={state.morningStart?.yesterdayLabel ?? ''}
          onApplyTemplate={handleApplyMorningTemplate}
          onCopyYesterday={handleCopyYesterdayPlan}
        />
      )}

      {showWidgetSetupHint && (
        <WidgetSetupBanner
          onDismiss={() => saveSettings({ widgetSetupHintDismissed: true })}
        />
      )}

      {!closeDayOpen && pendingPastCloseCount > 0 && (
        <PastDaysCloseBanner
          count={pendingPastCloseCount}
          onCloseNext={() => void openPendingPastDayClose()}
          onDismissAll={() => void handleDismissAllPendingPastCloses()}
        />
      )}

      <div className="dashboard-top">
        <PercentDisplay percent={displayPercent} breakdown={breakdown} celebrate={goalCelebrating} />

        <DailyGoalBar
          percent={displayPercent}
          enabled={state.settings.dailyGoalEnabled}
          goalPercent={state.settings.dailyGoalPercent}
          celebrate={goalCelebrating}
        />
      </div>

      <DayZoneHint hint={state.zoneHint ?? null} />

      <MacroGoalUnlockBanner items={macroCelebrations} />

      <section className="histogram-section">
        {chartSectionView === 'week' && weeklyReport ? (
          <WeeklyReportPanel
            report={weeklyReport}
            weekOffset={weekOffset}
            onWeekOffsetChange={setWeekOffset}
            onSelectDay={setSelectedHistoryDate}
            selectedDate={selectedHistoryDate}
          />
        ) : chartSectionView === 'month' && monthlyReport ? (
          <MonthlyReportPanel
            report={monthlyReport}
            monthOffset={monthOffset}
            onMonthOffsetChange={setMonthOffset}
            onSelectDay={setSelectedHistoryDate}
            selectedDate={selectedHistoryDate}
          />
        ) : (
          <HistogramChart
            tasks={tasks}
            wakeHour={state.settings.sleepWakeHour ?? 7}
            bedHour={state.settings.sleepBedHour ?? 23}
          />
        )}

        <div className="histogram-switches histogram-switches-below">
          {chartSectionView !== 'week' && chartSectionView !== 'month' && (
            <SleepScheduleControl
              wakeHour={state.settings.sleepWakeHour ?? 7}
              bedHour={state.settings.sleepBedHour ?? 23}
              onChange={(patch) => saveSettings(patch)}
            />
          )}
          <HistogramChartModeSwitch
            mode={chartSectionView}
            onChange={handleChartSectionChange}
          />
        </div>
      </section>

      <NowPanel
        tasks={tasks}

        activeTimer={state.activeTimer ?? null}

        onStartTimer={handleTimerStart}

        clockTick={clockTick}

      />



      {historyDayDetail && selectedHistoryDate && (

        <DayReadOnlyView

          date={selectedHistoryDate}

          day={historyDayDetail.day}

          percent={historyDayDetail.percent}

          macroGoals={state.macroGoals ?? []}

          onTaskGoalChange={(taskId, macroGoalId) => {
            void handleHistoryTaskGoalChange(taskId, macroGoalId);
          }}

          onClose={() => setSelectedHistoryDate(null)}
          onCloseDay={openPastDayClose}

        />

      )}



      <DayTemplatePanel

        templates={state.dayTemplates ?? []}

        hasTasks={tasks.length > 0}

        defaultMorningTemplateId={state.settings.defaultMorningTemplateId}

        onSave={async (name) => applyPayload(await saveTemplate(name))}

        onApply={async (id) => {

          if (

            tasks.length > 0 &&

            !confirm('Заменить задачи на сегодня шаблоном? Текущий прогресс будет сброшен.')

          ) {

            return;

          }

          applyPayload(await applyTemplate(id));

        }}

        onDelete={async (id) => applyPayload(await deleteTemplate(id))}

        onSetDefaultMorning={handleSetDefaultMorningTemplate}

      />



      <div className="toolbar">

        <button

          type="button"

          className="btn-secondary"

          onClick={() => {

            if (

              confirm(

                'Сбросить прогресс за сегодня? План (задачи, время, веса) останется.',

              )

            ) {

              resetDay();

            }

          }}

        >

          Сбросить прогресс

        </button>

        <button

          type="button"

          className="btn-secondary"

          onClick={() => {

            if (confirm('Удалить все задачи на сегодня? Это нельзя отменить.')) {

              resetDayFull();

            }

          }}

        >

          Очистить задачи

        </button>

        <button

          type="button"

          onClick={() => handleTasksChange([...tasks, createTemporalTask()])}

        >

          + Временная

        </button>

        <button

          type="button"

          onClick={() => handleTasksChange([...tasks, createFixedTask()])}

        >

          + Фиксированная

        </button>

      </div>

      <div className="day-close-row">
        {state.day.close ? (
          <button type="button" className="day-close-btn day-close-btn-done" onClick={openCloseDayModal}>
            <span className="day-close-mood">{state.day.close.mood}</span>
            <span>
              День закрыт · {state.day.close.percentAtClose}% · {formatInvestedDuration(state.day.close.investedMinutes)}
            </span>
          </button>
        ) : (
          <button type="button" className="day-close-btn" onClick={openCloseDayModal}>
            Закрыть день
          </button>
        )}
      </div>

      <TaskList

        tasks={tasks}

        onChange={handleTasksChange}

        activeTimer={state.activeTimer ?? null}

        onTimerStart={handleTimerStart}

        onTimerPause={handleTimerPause}

        onTimerStop={handleTimerStop}

        timerTick={timerTick}

        recurringTasks={state.recurringTasks ?? []}

        onRecurrenceChange={handleRecurrenceChange}

        macroGoals={state.macroGoals ?? []}

      />



      <SettingsPanel
        settings={state.settings}
        celebrationSoundUrl={state.celebrationSoundUrl ?? null}
        widgetCustomPhotoUrl={state.widgetCustomPhotoUrl ?? null}
        recurringTasks={state.recurringTasks ?? []}
        macroGoals={state.macroGoals ?? []}
        onSave={saveSettings}
        onRecurringEnabled={handleRecurringEnabled}
        onRecurringDelete={handleRecurringDelete}
        onMacroGoalsChanged={async () => {
          applyPayload(await window.electronAPI.getState());
        }}
      />
        </>
      )}

      {showOnboarding && !focusMode && (
        <OnboardingOverlay
          hasTasks={tasks.length > 0}
          onComplete={finishOnboarding}
          onSkip={() => finishOnboarding(false)}
        />
      )}

      <CloseDayModal
        open={closeDayOpen}
        onClose={handleCloseDayModalClose}
        onConfirm={handleCloseDayConfirm}
        loading={closeDayLoading}
        targetDate={closeDayTargetDate}
        yesterdayLabel={yesterdayCloseLabel}
        newlyUnlocked={newAchievements}
        tasks={tasks}
        macroGoals={state.macroGoals ?? []}
        recurringTasks={state.recurringTasks ?? []}
        onDismissPending={
          closeDayTargetDate ? handleDismissYesterdayClose : undefined
        }
      />

      <AchievementsModal open={achievementsOpen} onClose={() => setAchievementsOpen(false)} />
    </div>

  );

}


