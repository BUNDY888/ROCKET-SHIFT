import { computeDailyGoalState } from '../../electron/dayClose';

interface Props {
  percent: number;
  enabled: boolean;
  goalPercent: number;
  celebrate?: boolean;
}

export function DailyGoalBar({ percent, enabled, goalPercent, celebrate = false }: Props) {
  const goal = computeDailyGoalState(percent, enabled, goalPercent);
  if (!goal.dailyGoalEnabled) return null;

  return (
    <div
      className={`daily-goal ${goal.goalReached ? 'daily-goal-reached' : ''}${celebrate ? ' goal-celebrate-pop' : ''}`}
    >
      <div className="daily-goal-header">
        <span className="daily-goal-label">Цель дня: {goal.dailyGoalPercent}%</span>
        {goal.goalReached ? (
          <span className="daily-goal-badge">✓ достигнута</span>
        ) : (
          <span className="daily-goal-remaining">ещё {goal.goalRemaining}%</span>
        )}
      </div>
      <div className="daily-goal-track" aria-hidden>
        <div className="daily-goal-fill" style={{ width: `${goal.goalProgress}%` }} />
      </div>
    </div>
  );
}
