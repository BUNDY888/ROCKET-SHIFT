import { useEffect, useState } from 'react';
import type { AchievementStatus } from '../../electron/types';

interface Props {
  /** Перезагрузка при открытии модалки */
  active?: boolean;
}

export function AchievementsList({ active = true }: Props) {
  const [items, setItems] = useState<AchievementStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    window.electronAPI.getAchievementsList().then((list) => {
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  const unlockedCount = items.filter((item) => item.unlocked).length;

  if (loading) {
    return <p className="achievements-loading">Загрузка…</p>;
  }

  return (
    <>
      <p className="achievements-summary">
        Открыто <strong>{unlockedCount}</strong> из {items.length}
      </p>
      <ul className="achievements-grid">
        {items.map((item) => (
          <li
            key={item.id}
            className={item.unlocked ? 'achievement-card unlocked' : 'achievement-card locked'}
          >
            <span className="achievement-card-emoji">{item.unlocked ? item.emoji : '🔒'}</span>
            <div className="achievement-card-body">
              <span className="achievement-card-title">{item.title}</span>
              <span className="achievement-card-desc">{item.description}</span>
              {!item.unlocked && item.progressText && (
                <span className="achievement-card-progress">{item.progressText}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
