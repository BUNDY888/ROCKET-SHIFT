import type { MonthlyReportSummary } from '../../electron/types';
import { MONTH_WEEKDAY_HEADERS } from '../lib/monthCalendar';
import { getZoneColor } from '../lib/calculations';
import { formatInvestedDuration, formatPercentDelta } from '../lib/dayClose';

interface Props {
  report: MonthlyReportSummary;
  monthOffset: number;
  onMonthOffsetChange: (offset: number) => void;
  onSelectDay: (date: string) => void;
  selectedDate: string | null;
}

type MonthCell = MonthlyReportSummary['weeks'][number][number];

function cellFill(cell: MonthCell): string {
  if (!cell.inMonth) return 'transparent';
  if (cell.taskCount === 0) return 'var(--rs-month-empty)';
  return getZoneColor(cell.percent);
}

function cellTitle(cell: MonthCell): string {
  if (!cell.inMonth) return '';
  if (cell.taskCount === 0) return `${cell.dayOfMonth} — нет задач`;
  const mood = cell.mood ? ` ${cell.mood}` : '';
  const closed = cell.closed ? ' · закрыт' : '';
  const goal = cell.goalReached ? ' · ✓ цель' : '';
  return `${cell.dayOfMonth}: ${cell.percent}% · ${formatInvestedDuration(cell.investedMinutes)}${mood}${closed}${goal}`;
}

export function MonthlyReportPanel({
  report,
  monthOffset,
  onMonthOffsetChange,
  onSelectDay,
  selectedDate,
}: Props) {
  const monthCompare = formatPercentDelta(report.monthDelta);

  return (
    <section className="monthly-report-panel">
      <div className="weekly-report-header">
        <div className="weekly-report-nav">
          <button
            type="button"
            className="btn-chip weekly-report-nav-btn"
            onClick={() => onMonthOffsetChange(monthOffset - 1)}
            aria-label="Предыдущий месяц"
          >
            ←
          </button>
          <div className="weekly-report-title-wrap">
            <h2 className="weekly-report-title">{report.title}</h2>
            <p className="weekly-report-subtitle">
              {report.isCurrentMonth ? 'Текущий месяц' : 'Календарь месяца'}
            </p>
          </div>
          <button
            type="button"
            className="btn-chip weekly-report-nav-btn"
            onClick={() => onMonthOffsetChange(monthOffset + 1)}
            disabled={monthOffset >= 0}
            aria-label="Следующий месяц"
          >
            →
          </button>
        </div>
      </div>

      <div className="weekly-report-stats">
        <div className="weekly-report-stat">
          <span className="weekly-report-stat-value">{report.averagePercent}%</span>
          <span className="weekly-report-stat-label">средний %</span>
          {monthCompare && (
            <span className="weekly-report-stat-sub">{monthCompare} к прошлому</span>
          )}
        </div>
        <div className="weekly-report-stat">
          <span className="weekly-report-stat-value">
            {formatInvestedDuration(report.totalInvestedMinutes)}
          </span>
          <span className="weekly-report-stat-label">инвестировано</span>
        </div>
        <div className="weekly-report-stat">
          <span className="weekly-report-stat-value">
            {report.closedDays}/{report.activeDays}
          </span>
          <span className="weekly-report-stat-label">закрыто дней</span>
        </div>
        {report.goalsReached > 0 && (
          <div className="weekly-report-stat">
            <span className="weekly-report-stat-value">{report.goalsReached}</span>
            <span className="weekly-report-stat-label">целей достигнуто</span>
          </div>
        )}
      </div>

      {report.bestDay && report.activeDays > 1 && (
        <p className="weekly-report-best">
          Лучший день: <strong>{report.bestDay.label}</strong> — {report.bestDay.percent}%
        </p>
      )}

      <div className="monthly-calendar" role="grid" aria-label={`Календарь ${report.title}`}>
        <div className="monthly-calendar-head" role="row">
          {MONTH_WEEKDAY_HEADERS.map((label) => (
            <span key={label} className="monthly-calendar-weekday" role="columnheader">
              {label}
            </span>
          ))}
        </div>
        {report.weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="monthly-calendar-row" role="row">
            {week.map((cell) => {
              const clickable = cell.inMonth && cell.taskCount > 0;
              const selected = selectedDate === cell.date;
              return (
                <button
                  key={cell.date}
                  type="button"
                  role="gridcell"
                  className={[
                    'monthly-calendar-cell',
                    !cell.inMonth ? 'outside' : '',
                    cell.isToday ? 'today' : '',
                    cell.taskCount === 0 && cell.inMonth ? 'empty' : '',
                    selected ? 'selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ background: cellFill(cell) }}
                  title={cellTitle(cell)}
                  disabled={!clickable}
                  onClick={() => clickable && onSelectDay(cell.date)}
                  aria-label={cellTitle(cell) || undefined}
                >
                  {cell.inMonth && (
                    <>
                      <span className="monthly-calendar-day">{cell.dayOfMonth}</span>
                      {cell.taskCount > 0 && (
                        <span className="monthly-calendar-percent">{Math.round(cell.percent)}%</span>
                      )}
                      {cell.closed && cell.mood && (
                        <span className="monthly-calendar-mood">{cell.mood}</span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="monthly-calendar-legend" aria-hidden="true">
        <span className="monthly-legend-item">
          <span className="monthly-legend-swatch" style={{ background: getZoneColor(10) }} /> &lt;15%
        </span>
        <span className="monthly-legend-item">
          <span className="monthly-legend-swatch" style={{ background: getZoneColor(40) }} /> 15–52%
        </span>
        <span className="monthly-legend-item">
          <span className="monthly-legend-swatch" style={{ background: getZoneColor(60) }} /> 52–72%
        </span>
        <span className="monthly-legend-item">
          <span className="monthly-legend-swatch" style={{ background: getZoneColor(85) }} /> 72%+
        </span>
      </div>

      <p className="hint weekly-report-hint">Нажмите на день с задачами, чтобы открыть детали</p>
    </section>
  );
}
