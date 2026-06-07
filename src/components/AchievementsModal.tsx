import { AchievementsList } from './AchievementsList';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AchievementsModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="close-day-overlay achievements-modal-overlay" onClick={onClose}>
      <div className="achievements-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="close-day-header">
          <h2>Достижения</h2>
          <button type="button" className="btn-chip" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <AchievementsList active={open} />
      </div>
    </div>
  );
}
