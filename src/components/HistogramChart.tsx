import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import {
  calculateHistogramForSleepSchedule,
  HISTOGRAM_MAX_PERCENT,
  getSleepChartRange,
} from '../lib/calculations';
import type { Task } from '../../electron/types';

interface Props {
  tasks: Task[];
  wakeHour: number;
  bedHour: number;
}

export function HistogramChart({ tasks, wakeHour, bedHour }: Props) {
  const { axisLabel, title } = getSleepChartRange(wakeHour, bedHour);
  const data = calculateHistogramForSleepSchedule(tasks, wakeHour, bedHour);
  const chartTitle = `${title} — факт`;
  const manyHours = data.length > 12;

  return (
    <div className="histogram-block">
      <h3 className="histogram-title">{chartTitle}</h3>
      <ResponsiveContainer width="100%" height={manyHours ? 360 : 320}>
        <BarChart
          data={data}
          margin={{
            top: 28,
            right: 16,
            left: 8,
            bottom: manyHours ? 36 : 8,
          }}
        >
          <XAxis
            dataKey="label"
            interval={0}
            minTickGap={0}
            tick={{ fontSize: 9, fill: '#0d0d0d', fontWeight: 600 }}
            angle={manyHours ? -45 : 0}
            textAnchor={manyHours ? 'end' : 'middle'}
            height={manyHours ? 48 : 28}
          />
          <YAxis
            domain={[0, HISTOGRAM_MAX_PERCENT]}
            ticks={[0, 50, 100, 150]}
            tick={{ fontSize: 11, fill: '#5c5c6e' }}
            tickFormatter={(v) => `${v}%`}
            width={48}
          />
          <Tooltip
            formatter={(value: number, _name, item) => {
              const row = item?.payload as { percent?: number; showIdleBar?: boolean } | undefined;
              const p = row?.percent ?? value ?? 0;
              const label = row?.showIdleBar ? 'Простой (час прошёл)' : 'Выполнение в этот час';
              return [`${p}%`, label];
            }}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as { label?: string } | undefined;
              return row?.label ? `Час ${row.label}` : '';
            }}
          />
          <Bar dataKey="barValue" radius={[4, 4, 0, 0]} maxBarSize={36} minPointSize={6}>
            {data.map((entry) => (
              <Cell key={entry.slot} fill={entry.color} />
            ))}
            <LabelList
              dataKey="percent"
              position="top"
              formatter={(v: number, _l, entry) => {
                const row = entry as { showIdleBar?: boolean; percent?: number };
                const p = row?.percent ?? v;
                if (p > 0) return `${p}%`;
                if (row?.showIdleBar) return '0%';
                return '';
              }}
              style={{ fontSize: 9, fill: '#1a1a2e', fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="hint histogram-hint">
        Ось X: {axisLabel}. Ось Y: до 150% за час. Факт — с начала задачи по прошедшим часам;
        будущие часы окна пустые. Общий % — вверху.
      </p>
    </div>
  );
}
