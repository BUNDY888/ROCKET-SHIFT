import { useState } from 'react';
import type { MacroGoal } from '../../electron/types';
import { MacroGoalsPanel } from './MacroGoalsPanel';

interface Props {
  goals: MacroGoal[];
  onAchievements: () => void;
}

/** Кнопки для вставки в header-actions (в одну строку с Фокусом). */
export function MacroGoalsHeaderButtons({
  goals,
  onAchievements,
  open,
  onToggle,
}: Props & { open: boolean; onToggle: () => void }) {
  const count = goals.length;

  return (
    <>
      <button
        type="button"
        className={open ? 'btn-secondary header-chip main-macro-toggle active' : 'btn-secondary header-chip main-macro-toggle'}
        onClick={onToggle}
        aria-expanded={open}
        title={count > 0 ? 'Показать или скрыть цели' : 'Добавьте цели в настройках'}
      >
        🎯 Цели{count > 0 ? ` (${count})` : ''}
      </button>
      <button
        type="button"
        className="btn-secondary header-chip achievements-header-btn"
        onClick={onAchievements}
        title="Все достижения"
      >
        🏆 Достижения
      </button>
    </>
  );
}

export function MacroGoalsHeaderPanel({ goals, open }: { goals: MacroGoal[]; open: boolean }) {
  if (!open) return null;
  const count = goals.length;

  return (
    <div className="main-macro-goals-drop">
      {count > 0 ? (
        <MacroGoalsPanel goals={goals} variant="main" compact />
      ) : (
        <p className="main-macro-goals-empty hint">
          Пока нет целей. Настройки → «Цели» → + Цель
        </p>
      )}
    </div>
  );
}

export function useMacroGoalsHeaderState() {
  return useState(false);
}
