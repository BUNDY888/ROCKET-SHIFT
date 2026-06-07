import type { MacroGoalCompletion } from '../../electron/types';

interface Props {
  items: MacroGoalCompletion[];
}

export function MacroGoalUnlockBanner({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="macro-goal-unlock-banner" role="status">
      <p className="achievement-unlock-title">Цель достигнута!</p>
      <ul className="achievement-unlock-list">
        {items.map((item) => (
          <li key={item.goalId} className="achievement-unlock-item">
            <span className="achievement-unlock-emoji">🏆</span>
            <span>
              <strong>{item.name}</strong>
              <span className="achievement-unlock-desc"> — {item.milestoneLabel}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
