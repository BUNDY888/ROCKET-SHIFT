import { useMemo } from 'react';
import type { ActiveTimer, Task, TemporalTask, FixedTask, RecurrencePattern, RecurringTaskDefinition, MacroGoal } from '../../electron/types';
import { MACRO_GOAL_OPT_OUT } from '../lib/macroGoals';
import { RECURRENCE_LABELS, recurrenceSelectValue } from '../lib/recurrence';

import {

  currentHour,

  FIXED_WEIGHT_WARN_THRESHOLD,

  intervalDurationMinutes,
  timerElapsedSeconds,
  endHourFromStartAndPlanned,
  syncTemporalTaskEnd,
  sumFixedWeights,

} from '../lib/calculations';
import { getCurrentDecimalHour } from '../lib/currentTask';
import {
  getPlanFactMatchLabel,
  getTaskCardClassName,
  getTemporalPlanFactMatch,
  isTemporalTaskDone,
  sortTasksForDisplay,
} from '../lib/taskDisplay';
import { formatDurationMinutes } from '../lib/durationFormat';
import { DurationField } from './DurationField';

import {

  decimalHourToTimeValue,

  timeValueToDecimalHour,

} from '../lib/timeInput';



interface Props {

  tasks: Task[];

  onChange: (tasks: Task[]) => void;

  activeTimer: ActiveTimer | null;

  onTimerStart: (taskId: string) => void;

  onTimerPause: () => void;

  onTimerStop: () => void;

  timerTick: number;

  recurringTasks: RecurringTaskDefinition[];

  onRecurrenceChange: (taskId: string, pattern: RecurrencePattern | null) => void;

  macroGoals: MacroGoal[];

}



export function TaskList({

  tasks,

  onChange,

  activeTimer,

  onTimerStart,

  onTimerPause,

  onTimerStop,

  timerTick,

  recurringTasks,

  onRecurrenceChange,
  macroGoals,

}: Props) {

  const fixedWeightSum = Math.round(sumFixedWeights(tasks) * 10) / 10;

  const fixedWeightWarn = fixedWeightSum > FIXED_WEIGHT_WARN_THRESHOLD;

  const displayTasks = useMemo(() => {
    void timerTick;
    return sortTasksForDisplay(tasks, getCurrentDecimalHour());
  }, [tasks, timerTick]);



  const update = (id: string, patch: Partial<Task>) => {

    onChange(

      tasks.map((t) => (t.id === id ? ({ ...t, ...patch } as Task) : t)),

    );

  };



  const remove = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task?.recurringId) {
      const confirmed = confirm(
        'Пропустить повторяющуюся задачу на сегодня? Завтра она появится снова по расписанию.',
      );
      if (!confirmed) return;
    }

    if (activeTimer?.taskId === id) onTimerStop();

    onChange(tasks.filter((t) => t.id !== id));
  };



  const syncTemporalSchedule = (
    task: TemporalTask,
    patch: Partial<Pick<TemporalTask, 'plannedMinutes' | 'startHour'>>,
  ) => {
    update(task.id, syncTemporalTaskEnd({ ...task, ...patch }));
  };



  const isTimerRunning = (taskId: string) =>
    activeTimer?.taskId === taskId && activeTimer.pausedAt == null;

  const isTimerPausedOn = (taskId: string) =>
    activeTimer?.taskId === taskId && activeTimer.pausedAt != null;



  const timerLiveLabel = (taskId: string) => {

    if (!activeTimer || activeTimer.taskId !== taskId) return '';

    void timerTick;

    const totalSec = timerElapsedSeconds(activeTimer);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    const prefix = activeTimer.pausedAt != null ? '⏸ ' : '⏱ ';
    return `${prefix}${mm}:${String(ss).padStart(2, '0')}`;

  };



  return (

    <div className="task-list">

      {fixedWeightSum > 0 && (

        <p

          className={

            fixedWeightWarn ? 'fixed-weight-hint warn' : 'fixed-weight-hint'

          }

        >

          Сумма весов фиксированных: <strong>{fixedWeightSum}%</strong>

          {fixedWeightWarn &&

            ` — много (рекомендуем до ${FIXED_WEIGHT_WARN_THRESHOLD}%)`}

        </p>

      )}



      {tasks.length === 0 && (

        <p className="empty-hint">Добавьте задачи на сегодня</p>

      )}

      {tasks.length > 0 && (
        <p className="task-list-legend">
          Сверху — ближе по времени. Выполненные подсвечены:{' '}
          <span className="task-legend-swatch task-card-done-match">план≈факт</span>
          <span className="task-legend-swatch task-card-done-under">ниже</span>
          <span className="task-legend-swatch task-card-done-over">выше</span>
        </p>
      )}

      {displayTasks.map((task) => {
        const cardClass = getTaskCardClassName(task, getCurrentDecimalHour());
        const doneHint =
          task.type === 'temporal' && isTemporalTaskDone(task)
            ? getPlanFactMatchLabel(getTemporalPlanFactMatch(task))
            : task.type === 'fixed' && task.completed
              ? 'Выполнено'
              : '';

        return (
        <div key={task.id} className={cardClass} title={doneHint || undefined}>

          <div className="task-card-header">

            <select

              value={task.type}

              onChange={(e) => {

                const type = e.target.value as 'temporal' | 'fixed';

                if (type === task.type) return;

                if (isTimerRunning(task.id)) onTimerStop();

                if (type === 'temporal') {

                  const startHour = 9;
                  const plannedMinutes = 60;
                  const t: TemporalTask = {

                    id: task.id,

                    type: 'temporal',

                    name: task.name,

                    plannedMinutes,

                    actualMinutes: 0,

                    startHour,

                    endHour: endHourFromStartAndPlanned(startHour, plannedMinutes),
                    factStartHour: null,
                    factEndHour: null,
                    macroGoalId: null,

                    recurringId: task.recurringId,

                  };

                  onChange(tasks.map((x) => (x.id === task.id ? t : x)));

                } else {

                  const t: FixedTask = {

                    id: task.id,

                    type: 'fixed',

                    name: task.name,

                    weightPercent: 2,

                    completed: false,

                    completedHour: null,

                    recurringId: task.recurringId,

                  };

                  onChange(tasks.map((x) => (x.id === task.id ? t : x)));

                }

              }}

            >

              <option value="temporal">Временная</option>

              <option value="fixed">Фиксированная</option>

            </select>

            <input

              className="task-name"

              value={task.name}

              onChange={(e) => update(task.id, { name: e.target.value })}

              placeholder="Название"

            />

            {task.recurringId && (
              <span className="task-recurring-badge" title="Повторяющаяся задача">
                🔁
              </span>
            )}

            <button

              type="button"

              className="btn-danger"

              onClick={() => remove(task.id)}

              title="Удалить"

            >

              ✕

            </button>

          </div>

          <label className="task-recurrence">
            Повтор
            <select
              value={recurrenceSelectValue(task, recurringTasks)}
              onChange={(e) => {
                const value = e.target.value as RecurrencePattern | 'none';
                onRecurrenceChange(
                  task.id,
                  value === 'none' ? null : value,
                );
              }}
            >
              <option value="none">Не повторять</option>
              {(Object.keys(RECURRENCE_LABELS) as RecurrencePattern[]).map((key) => (
                <option key={key} value={key}>
                  {RECURRENCE_LABELS[key]}
                </option>
              ))}
            </select>
          </label>

          {task.type === 'temporal' && macroGoals.length > 0 && (
            <label className="task-recurrence">
              Цель
              <select
                value={
                  task.macroGoalId === MACRO_GOAL_OPT_OUT
                    ? MACRO_GOAL_OPT_OUT
                    : task.macroGoalId ?? ''
                }
                onChange={(e) => {
                  const value = e.target.value;
                  update(task.id, {
                    macroGoalId: value === '' ? null : value,
                  });
                }}
              >
                <option value="">Не привязана</option>
                {macroGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.name}
                  </option>
                ))}
                <option value={MACRO_GOAL_OPT_OUT}>Не учитывать</option>
              </select>
            </label>
          )}

          {task.type === 'temporal' ? (

            <>

              <div className="task-fields grid-4">

                <DurationField
                  label="План"
                  minutes={task.plannedMinutes}
                  onChange={(plannedMinutes) => syncTemporalSchedule(task, { plannedMinutes })}
                />

                <DurationField
                  label="Факт"
                  minutes={task.actualMinutes}
                  disabled={isTimerRunning(task.id) || isTimerPausedOn(task.id)}
                  onChange={(actualMinutes) => {
                    if (isTimerRunning(task.id)) onTimerPause();
                    update(task.id, { actualMinutes });
                  }}
                />

                <label>

                  Начало

                  <input

                    type="time"

                    step={60}

                    value={decimalHourToTimeValue(task.startHour)}

                    onChange={(e) =>
                      syncTemporalSchedule(task, {
                        startHour: timeValueToDecimalHour(e.target.value),
                      })
                    }

                  />

                </label>

                <label>
                  Конец
                  <input
                    type="time"
                    step={60}
                    readOnly
                    className="input-readonly"
                    value={decimalHourToTimeValue(
                      endHourFromStartAndPlanned(task.startHour, task.plannedMinutes),
                    )}
                    title="Считается автоматически: начало + план"
                  />
                </label>

              </div>



              <div className="task-timer-row">

                {isTimerRunning(task.id) || isTimerPausedOn(task.id) ? (

                  <>

                    <span className="timer-live">{timerLiveLabel(task.id)}</span>

                    {isTimerRunning(task.id) ? (
                      <button type="button" className="btn-timer" onClick={onTimerPause}>
                        Пауза
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-timer btn-timer-start"
                        onClick={() => onTimerStart(task.id)}
                      >
                        ▶ Продолжить
                      </button>
                    )}

                    <button type="button" className="btn-timer btn-timer-stop" onClick={onTimerStop}>

                      Стоп

                    </button>

                  </>

                ) : (

                  <button

                    type="button"

                    className="btn-timer btn-timer-start"

                    onClick={() => onTimerStart(task.id)}

                  >

                    ▶ Старт таймера

                  </button>

                )}

              </div>



              {(() => {
                const endHour = endHourFromStartAndPlanned(
                  task.startHour,
                  task.plannedMinutes,
                );
                const windowMin = intervalDurationMinutes(task.startHour, endHour);
                return (
                  <p className="interval-hint">
                    Окно: {formatDurationMinutes(windowMin)} ({decimalHourToTimeValue(task.startHour)} –{' '}
                    {decimalHourToTimeValue(endHour)}) · План:{' '}
                    {formatDurationMinutes(task.plannedMinutes)}
                  </p>
                );
              })()}

            </>

          ) : (
            <>
            <div className="task-fields grid-3">
              <label>
                Вес (%)
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={task.weightPercent}
                  onChange={(e) =>
                    update(task.id, {
                      weightPercent: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => {
                    const completed = e.target.checked;
                    update(task.id, {
                      completed,
                      completedHour: completed
                        ? task.completedHour ?? currentHour()
                        : task.completedHour,
                    });
                  }}
                />
                Выполнено
              </label>
              <label>
                Когда сделано
                <input
                  type="time"
                  step={60}
                  value={
                    task.completedHour != null
                      ? decimalHourToTimeValue(task.completedHour)
                      : ''
                  }
                  placeholder="09:00"
                  onChange={(e) => {
                    const value = e.target.value;
                    update(task.id, {
                      completedHour: value ? timeValueToDecimalHour(value) : null,
                    });
                  }}
                />
              </label>
            </div>
            <p className="interval-hint">
              Укажите время, когда задача была сделана — можно записать позже, не только «сейчас».
            </p>
            </>
          )}

        </div>
        );
      })}

    </div>

  );

}


