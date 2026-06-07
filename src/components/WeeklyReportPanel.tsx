import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { WeeklyReportSummary } from '../../electron/types';
import { getZoneColor } from '../lib/calculations';
import { formatInvestedDuration, formatPercentDelta } from '../lib/dayClose';

interface Props {
  report: WeeklyReportSummary;
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
  onSelectDay: (date: string) => void;
  selectedDate: string | null;
}

export function WeeklyReportPanel({
  report,
  weekOffset,
  onWeekOffsetChange,
  onSelectDay,
  selectedDate,
}: Props) {
  const chartData = report.days.map((day) => ({
    ...day,
    fill: day.taskCount > 0 ? getZoneColor(day.percent) : '#e0e4ec',
  }));

  const weekCompare = formatPercentDelta(report.weekDelta);

  return (
    <section className="weekly-report-panel">
      <div className="weekly-report-header">
        <div className="weekly-report-nav">
          <button
            type="button"
            className="btn-chip weekly-report-nav-btn"
            onClick={() => onWeekOffsetChange(weekOffset - 1)}
            aria-label="Предыдущая неделя"
          >
            ←
          </button>
          <div className="weekly-report-title-wrap">
            <h2 className="weekly-report-title">{report.title}</h2>
            <p className="weekly-report-subtitle">
              {report.isCurrentWeek ? 'Текущая неделя · пн–вс' : 'пн–вс'}
            </p>
          </div>
          <button
            type="button"
            className="btn-chip weekly-report-nav-btn"
            onClick={() => onWeekOffsetChange(weekOffset + 1)}
            disabled={weekOffset >= 0}
            aria-label="Следующая неделя"
          >
            →
          </button>
        </div>
      </div>

      <div className="weekly-report-stats">
        <div className="weekly-report-stat">
          <span className="weekly-report-stat-value">{report.averagePercent}%</span>
          <span className="weekly-report-stat-label">средний %</span>
          {weekCompare && (
            <span className="weekly-report-stat-sub">{weekCompare} к прошлой</span>
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

      <ResponsiveContainer width="100%" height={168}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#5c5c6e' }}
            interval={0}
          />
          <YAxis
            domain={[0, 150]}
            ticks={[0, 50, 100, 150]}
            tick={{ fontSize: 10, fill: '#8a8a9a' }}
            width={36}
          />
          <Tooltip
            formatter={(value: number, _name, item) => {
              const row = item.payload as (typeof chartData)[number];
              if (row.taskCount === 0) return ['—', 'Нет задач'];
              const hours = formatInvestedDuration(row.investedMinutes);
              return [`${value}% · ${hours}`, row.closed ? 'Закрыт' : 'Итого'];
            }}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as (typeof chartData)[number] | undefined;
              if (!row) return '';
              const mood = row.mood ? ` ${row.mood}` : '';
              const goal = row.goalReached ? ' · ✓ цель' : '';
              return `${row.label}${mood}${goal} · ${row.taskCount} задач`;
            }}
          />
          <Bar
            dataKey="percent"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
            onClick={(data) => {
              const row = data as unknown as (typeof chartData)[number];
              if (row?.date && row.taskCount > 0) onSelectDay(row.date);
            }}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.date}
                fill={entry.fill}
                opacity={entry.taskCount === 0 ? 0.45 : selectedDate === entry.date ? 1 : 0.88}
                stroke={selectedDate === entry.date ? '#1a1a2e' : undefined}
                strokeWidth={selectedDate === entry.date ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="hint weekly-report-hint">Нажмите на день с задачами, чтобы открыть детали</p>
    </section>
  );
}
