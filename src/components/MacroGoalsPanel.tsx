import type { MacroGoal } from '../../electron/types';
import {
  macroGoalEtaWeeks,
  macroGoalLinkHint,
  macroGoalPriorHint,
  macroGoalProgressLine,
  macroGoalProgressPercent,
} from '../lib/macroGoals';

interface Props {
  goals: MacroGoal[];
  /** main — на главном экране; settings — только карточки внутри настроек */
  variant?: 'main' | 'settings';
  /** Компактные карточки для раскрывающейся панели на главном */
  compact?: boolean;
}

export function MacroGoalsPanel({ goals, variant = 'main', compact = false }: Props) {
  if (goals.length === 0 && variant === 'settings') return null;
  if (goals.length === 0) return null;

  const panelClass = [
    'macro-goals-panel',
    variant === 'settings' ? 'macro-goals-panel-settings' : '',
    compact ? 'macro-goals-panel-compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const gridClass = compact ? 'macro-goals-grid macro-goals-grid-compact' : 'macro-goals-grid';

  return (
    <section className={panelClass} aria-label="Цели">
      {variant === 'main' && !compact && <h2 className="macro-goals-title">Цели</h2>}
      <div className={gridClass}>
        {goals.map((goal) => {
          const pct = macroGoalProgressPercent(goal);
          const eta = macroGoalEtaWeeks(goal);
          const priorHint = macroGoalPriorHint(goal);
          const done = Boolean(goal.completedAt);

          if (compact) {
            return (
              <article
                key={goal.id}
                className={
                  done
                    ? 'macro-goal-card macro-goal-card-compact macro-goal-card-done'
                    : 'macro-goal-card macro-goal-card-compact'
                }
                title={goal.milestoneLabel}
              >
                <div className="macro-goal-compact-row">
                  <span className="macro-goal-emoji" aria-hidden>
                    {goal.emoji}
                  </span>
                  <span className="macro-goal-name">{goal.name}</span>
                  <span className="macro-goal-progress-line">{macroGoalProgressLine(goal)}</span>
                </div>
                <div className="macro-goal-progress-track" aria-hidden>
                  <div className="macro-goal-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                {(eta || priorHint) && (
                  <p className="macro-goal-compact-meta">
                    {[priorHint, eta].filter(Boolean).join(' · ')}
                  </p>
                )}
              </article>
            );
          }

          return (
            <article
              key={goal.id}
              className={done ? 'macro-goal-card macro-goal-card-done' : 'macro-goal-card'}
            >
              <div className="macro-goal-card-head">
                <span className="macro-goal-emoji" aria-hidden>
                  {goal.emoji}
                </span>
                <div>
                  <h3 className="macro-goal-name">{goal.name}</h3>
                  <p className="macro-goal-milestone">{goal.milestoneLabel}</p>
                </div>
              </div>
              <p className="macro-goal-progress-line">{macroGoalProgressLine(goal)}</p>
              <div className="macro-goal-progress-track" aria-hidden>
                <div className="macro-goal-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              {eta && <p className="macro-goal-eta">{eta}</p>}
              {priorHint && <p className="macro-goal-prior-hint">{priorHint}</p>}
              <p className="macro-goal-link-hint">{macroGoalLinkHint(goal)}</p>
              {done && <p className="macro-goal-done-badge">Веха пройдена</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
