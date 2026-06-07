import type { UnlockedAchievement } from '../../electron/types';
import { ACHIEVEMENT_DISPLAY } from '../lib/achievementDisplay';

interface Props {
  items: UnlockedAchievement[];
}

export function AchievementUnlockBanner({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="achievement-unlock-banner" role="status">
      <p className="achievement-unlock-title">Новое достижение!</p>
      <ul className="achievement-unlock-list">
        {items.map((item) => {
          const def = ACHIEVEMENT_DISPLAY[item.id];
          return (
            <li key={item.id} className="achievement-unlock-item">
              <span className="achievement-unlock-emoji">{def.emoji}</span>
              <span>
                <strong>{def.title}</strong>
                <span className="achievement-unlock-desc"> — {def.description}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
