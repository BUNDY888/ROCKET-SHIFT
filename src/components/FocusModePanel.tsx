import type { ActiveTimer, TemporalTask } from '../../electron/types';
import { getZoneColor } from '../lib/calculations';
import { formatPercentDisplay } from '../lib/percentFormat';
import {
  formatTimerClock,
  getTimerElapsedSeconds,
} from '../lib/focusTask';
import { formatDurationMinutes } from '../lib/durationFormat';
import { decimalHourToTimeValue } from '../lib/timeInput';

interface Props {
  task: TemporalTask | null;
  activeTimer: ActiveTimer | null;
  percent: number;
  timerTick: number;
  onToggleTimer: () => void;
  onExit: () => void;
}

export function FocusModePanel({
  task,
  activeTimer,
  percent,
  timerTick,
  onToggleTimer,
  onExit,
}: Props) {
  void timerTick;

  const timerOnTask = Boolean(task && activeTimer?.taskId === task.id);
  const elapsed = timerOnTask ? getTimerElapsedSeconds(activeTimer) : 0;
  const liveActual = task
    ? task.actualMinutes + (timerOnTask ? Math.floor(elapsed / 60) : 0)
    : 0;
  const taskProgress =
    task && task.plannedMinutes > 0
      ? Math.min(100, Math.round((liveActual / task.plannedMinutes) * 100))
      : 0;

  return (
    <section className="focus-mode-panel">
      <div className="focus-mode-top">
        <button type="button" className="btn-secondary focus-mode-exit" onClick={onExit}>
          Выйти из фокуса
        </button>
        <span className="focus-mode-esc-hint">Esc</span>
      </div>

      <div
        className="focus-mode-percent"
        style={{ background: getZoneColor(percent) }}
      >
        {formatPercentDisplay(percent)}%
      </div>

      {!task ? (
        <div className="focus-mode-empty">
          <p>Нет временной задачи для фокуса.</p>
          <p className="hint">Добавьте задачу или выйдите и выберите слот в расписании.</p>
        </div>
      ) : (
        <>
          <h2 className="focus-mode-task-name">{task.name}</h2>
          <p className="focus-mode-task-meta">
            {decimalHourToTimeValue(task.startHour)} – {decimalHourToTimeValue(task.endHour)}
            {' · '}план {formatDurationMinutes(task.plannedMinutes)}
            {' · '}факт {formatDurationMinutes(liveActual)}
          </p>

          {task.plannedMinutes > 0 && (
            <div className="focus-mode-task-progress">
              <div className="focus-mode-task-track">
                <div
                  className="focus-mode-task-fill"
                  style={{ width: `${taskProgress}%` }}
                />
              </div>
              <span className="focus-mode-task-progress-label">
                {taskProgress}% слота
              </span>
            </div>
          )}

          {timerOnTask && (
            <div className="focus-mode-timer">{formatTimerClock(elapsed)}</div>
          )}

          <button type="button" className="focus-mode-timer-btn" onClick={onToggleTimer}>
            {timerOnTask ? '⏸ Пауза (Space)' : '▶ Старт таймера (Space)'}
          </button>
        </>
      )}
    </section>
  );
}
