import type { DayState, MacroGoal, Task, TemporalTask } from '../../electron/types';
import { DAY_MOOD_LABELS } from '../../electron/types';
import { decimalHourToTimeValue } from '../lib/timeInput';
import { formatInvestedDuration } from '../lib/dayClose';
import { formatDurationMinutes } from '../lib/durationFormat';
import { MACRO_GOAL_OPT_OUT } from '../lib/macroGoals';
import { sortTasksForDisplay } from '../lib/taskDisplay';

interface Props {
  date: string;
  day: DayState;
  percent: number;
  macroGoals: MacroGoal[];
  onClose: () => void;
  onCloseDay?: (date: string, label: string) => void;
  onTaskGoalChange?: (taskId: string, macroGoalId: string | null) => void;
}

export function DayReadOnlyView({
  date,
  day,
  percent,
  macroGoals,
  onClose,
  onCloseDay,
  onTaskGoalChange,
}: Props) {
  const close = day.close;
  const displayPercent = close?.percentAtClose ?? percent;
  const canCloseDay = !close && day.tasks.length > 0 && onCloseDay;

  return (
    <div className="day-readonly-overlay" onClick={onClose}>
      <div className="day-readonly-panel" onClick={(e) => e.stopPropagation()}>
        <div className="day-readonly-header">
          <h3>
            {formatDateTitle(date)} — {displayPercent}%
            {close?.mood && <span className="day-readonly-mood"> {close.mood}</span>}
          </h3>
          <button type="button" className="btn-chip" onClick={onClose}>
            ✕
          </button>
        </div>

        {canCloseDay && (
          <div className="day-readonly-close-prompt">
            <p>Этот день не был закрыт.</p>
            <button
              type="button"
              className="close-day-submit"
              onClick={() => onCloseDay(date, formatDateTitle(date))}
            >
              Закрыть этот день
            </button>
          </div>
        )}

        {close && (
          <div className="day-readonly-close-summary">
            <p>
              День закрыт · {formatInvestedDuration(close.investedMinutes)} инвестировано
              {close.mood && ` · ${DAY_MOOD_LABELS[close.mood]}`}
            </p>
            {close.note && <p className="day-readonly-close-note">«{close.note}»</p>}
            {close.goalReached && close.dailyGoalPercent != null && (
              <p className="day-readonly-goal">✓ Цель {close.dailyGoalPercent}% выполнена</p>
            )}
            <p className="day-readonly-close-meta">
              Временные {close.temporalPercent}% · Фиксированные +{close.fixedPercent}% ·{' '}
              {close.tasksCompleted}/{close.tasksTotal} с прогрессом
            </p>
            {macroGoals.length > 0 && onTaskGoalChange && (
              <p className="day-readonly-goal-edit-hint">
                Можно изменить привязку к цели у задачи — % закрытого дня не меняется.
              </p>
            )}
          </div>
        )}

        {day.tasks.length === 0 ? (
          <p className="empty-hint">Нет задач</p>
        ) : (
          <ul className="day-readonly-list">
            {sortTasksForDisplay(day.tasks).map((t) => (
              <li key={t.id}>
                <ReadOnlyTaskRow
                  task={t}
                  macroGoals={macroGoals}
                  onTaskGoalChange={onTaskGoalChange}
                />
                {t.type === 'temporal' && t.subtasks && t.subtasks.length > 0 && (
                  <ul className="day-readonly-subtasks">
                    {t.subtasks.map((item) => (
                      <li
                        key={item.id}
                        className={item.completed ? 'day-readonly-subtask-done' : undefined}
                      >
                        {item.completed ? '✓' : '○'} {item.text}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ReadOnlyTaskRow({
  task,
  macroGoals,
  onTaskGoalChange,
}: {
  task: Task;
  macroGoals: MacroGoal[];
  onTaskGoalChange?: (taskId: string, macroGoalId: string | null) => void;
}) {
  const summary =
    task.type === 'temporal'
      ? `${task.name}: ${formatDurationMinutes(task.actualMinutes)} / ${formatDurationMinutes(task.plannedMinutes)} (${decimalHourToTimeValue(task.startHour)}–${decimalHourToTimeValue(task.endHour)})`
      : (() => {
          const time =
            task.completedHour != null ? ` в ${decimalHourToTimeValue(task.completedHour)}` : '';
          return `${task.name}: ${task.completed ? `✓ ${task.weightPercent}%${time}` : `— ${task.weightPercent}%`}`;
        })();

  const canEditGoal =
    task.type === 'temporal' && macroGoals.length > 0 && onTaskGoalChange != null;

  return (
    <div className="day-readonly-task">
      <span className="day-readonly-task-summary">{summary}</span>
      {canEditGoal && (
        <label className="day-readonly-goal-field">
          Цель
          <select
            value={
              task.macroGoalId === MACRO_GOAL_OPT_OUT
                ? MACRO_GOAL_OPT_OUT
                : task.macroGoalId ?? ''
            }
            onChange={(e) => {
              const value = e.target.value;
              onTaskGoalChange(
                task.id,
                value === '' ? null : value === MACRO_GOAL_OPT_OUT ? MACRO_GOAL_OPT_OUT : value,
              );
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
    </div>
  );
}

function formatDateTitle(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
