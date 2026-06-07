import type { ActiveTimer, Task, TemporalTask } from '../../electron/types';

import { formatDurationMinutes } from '../lib/durationFormat';
import { decimalHourToTimeValue } from '../lib/timeInput';



interface Props {

  tasks: Task[];

  activeTimer: ActiveTimer | null;

  onStartTimer: (taskId: string) => void;

  clockTick: number;

}



export function NowPanel({

  tasks,

  activeTimer,

  onStartTimer,

  clockTick,

}: Props) {

  void clockTick;

  const current = findNowTasks(tasks);



  if (current.length === 0) {

    return (

      <section className="now-panel now-panel-empty">

        <h2 className="now-panel-title">Сейчас</h2>

        <p className="now-panel-hint">Нет задачи на текущий момент по расписанию</p>

      </section>

    );

  }



  const primary = current[0];

  const timerOnThis =

    activeTimer?.taskId === primary.id;



  return (

    <section className="now-panel">

      <h2 className="now-panel-title">Сейчас</h2>

      <div className="now-panel-body">

        <div className="now-panel-info">

          <strong className="now-task-name">{primary.name}</strong>

          <span className="now-task-time">

            {decimalHourToTimeValue(primary.startHour)} –{' '}

            {decimalHourToTimeValue(primary.endHour)}

            {' · '}

            план {formatDurationMinutes(primary.plannedMinutes)}

            {primary.actualMinutes > 0 &&
              ` · факт ${formatDurationMinutes(primary.actualMinutes)}`}

          </span>

          {current.length > 1 && (

            <span className="now-task-more">+ ещё {current.length - 1} в этом слоте</span>

          )}

        </div>

        {timerOnThis ? (

          <span className="now-timer-active">⏱ Таймер идёт</span>

        ) : (

          <button

            type="button"

            className="btn-now-start"

            onClick={() => onStartTimer(primary.id)}

          >

            ▶ Начать работу

          </button>

        )}

      </div>

    </section>

  );

}



function findNowTasks(tasks: Task[]): TemporalTask[] {

  const now = new Date();

  const decimal =

    now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;



  return tasks.filter((t): t is TemporalTask => {

    if (t.type !== 'temporal') return false;

    const { startHour, endHour } = t;

    if (endHour > startHour) {

      return decimal >= startHour && decimal < endHour;

    }

    if (endHour < startHour) {

      return decimal >= startHour || decimal < endHour;

    }

    return false;

  });

}


