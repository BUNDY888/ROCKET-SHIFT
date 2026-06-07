import type { DayState, Task } from '../../electron/types';
import { DAY_MOOD_LABELS } from '../../electron/types';
import { decimalHourToTimeValue } from '../lib/timeInput';
import { formatInvestedDuration } from '../lib/dayClose';
import { formatDurationMinutes } from '../lib/durationFormat';
import { sortTasksForDisplay } from '../lib/taskDisplay';

interface Props {
  date: string;
  day: DayState;
  percent: number;
  onClose: () => void;
}

export function DayReadOnlyView({ date, day, percent, onClose }: Props) {
  const close = day.close;
  const displayPercent = close?.percentAtClose ?? percent;

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
          </div>
        )}

        {day.tasks.length === 0 ? (
          <p className="empty-hint">Нет задач</p>
        ) : (
          <ul className="day-readonly-list">
            {sortTasksForDisplay(day.tasks).map((t) => (
              <li key={t.id}>{renderTask(t)}</li>
            ))}
          </ul>
        )}
      </div>
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

function renderTask(task: Task): string {
  if (task.type === 'temporal') {
    return `${task.name}: ${formatDurationMinutes(task.actualMinutes)} / ${formatDurationMinutes(task.plannedMinutes)} (${decimalHourToTimeValue(task.startHour)}–${decimalHourToTimeValue(task.endHour)})`;
  }
  const time =
    task.completedHour != null ? ` в ${decimalHourToTimeValue(task.completedHour)}` : '';
  return `${task.name}: ${task.completed ? `✓ ${task.weightPercent}%${time}` : `— ${task.weightPercent}%`}`;
}
