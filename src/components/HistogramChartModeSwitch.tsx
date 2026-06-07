export type ChartSectionView = 'week' | 'month' | null;

interface Props {
  mode: ChartSectionView;
  onChange: (mode: ChartSectionView) => void;
}

export function HistogramChartModeSwitch({ mode, onChange }: Props) {
  const toggle = (view: 'week' | 'month') => {
    onChange(mode === view ? null : view);
  };

  return (
    <div className="histogram-mode-switch" role="group" aria-label="Раздел графика">
      <button
        type="button"
        className={mode === 'week' ? 'mode-btn active' : 'mode-btn'}
        onClick={() => toggle('week')}
        title="Отчёт за календарную неделю пн–вс"
      >
        📆 Неделя
      </button>
      <button
        type="button"
        className={mode === 'month' ? 'mode-btn active' : 'mode-btn'}
        onClick={() => toggle('month')}
        title="Календарь месяца с цветом по %"
      >
        🗓 Месяц
      </button>
    </div>
  );
}
