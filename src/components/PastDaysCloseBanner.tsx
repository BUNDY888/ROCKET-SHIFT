interface Props {
  count: number;
  onCloseNext: () => void;
  onDismissAll: () => void;
}

export function PastDaysCloseBanner({ count, onCloseNext, onDismissAll }: Props) {
  if (count <= 0) return null;

  const label =
    count === 1
      ? '1 незакрытый день в истории'
      : `${count} незакрытых дня в истории`;

  return (
    <div className="past-days-banner" role="status">
      <p>{label}</p>
      <div className="past-days-banner-actions">
        <button type="button" className="btn-secondary" onClick={onDismissAll}>
          Позже
        </button>
        <button type="button" className="close-day-submit past-days-banner-close" onClick={onCloseNext}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
