import { formatInvestedDelta, formatPercentDelta } from '../lib/dayClose';
import type { CloseDayPreview } from '../../electron/types';

interface Props {
  preview: CloseDayPreview;
}

export function CloseDayYesterdayCompare({ preview }: Props) {
  const percentText = formatPercentDelta(preview.percentDelta);
  const investedText = formatInvestedDelta(preview.investedDeltaMinutes);

  if (preview.yesterdayPercent == null) {
    return (
      <p className="close-day-yesterday close-day-yesterday-empty">
        Вчера нет данных для сравнения
      </p>
    );
  }

  const percentClass =
    preview.percentDelta == null || preview.percentDelta === 0
      ? 'neutral'
      : preview.percentDelta > 0
        ? 'up'
        : 'down';

  const investedClass =
    preview.investedDeltaMinutes == null || preview.investedDeltaMinutes === 0
      ? 'neutral'
      : preview.investedDeltaMinutes > 0
        ? 'up'
        : 'down';

  return (
    <div className="close-day-yesterday">
      <p className="close-day-yesterday-title">Сравнение с вчера</p>
      <p className={`close-day-yesterday-line ${percentClass}`}>
        {percentText}
        <span className="close-day-yesterday-ref"> (вчера {preview.yesterdayPercent}%)</span>
      </p>
      {investedText && (
        <p className={`close-day-yesterday-line ${investedClass}`}>{investedText}</p>
      )}
    </div>
  );
}
