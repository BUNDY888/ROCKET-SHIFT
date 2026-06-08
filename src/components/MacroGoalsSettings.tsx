import { useState } from 'react';
import type { MacroGoal } from '../../electron/types';
import { formatMacroGoalHours, MAX_MACRO_GOALS } from '../lib/macroGoals';

interface GoalForm {
  name: string;
  emoji: string;
  linkTag: string;
  targetHours: string;
  priorHours: string;
  weeklyPaceHours: string;
  milestoneLabel: string;
}

interface Props {
  goals: MacroGoal[];
  onChanged: () => void;
}

const emptyForm = (): GoalForm => ({
  name: '',
  emoji: '🎯',
  linkTag: '',
  targetHours: '600',
  priorHours: '0',
  weeklyPaceHours: '11',
  milestoneLabel: 'B2',
});

function hoursFieldFromMinutes(minutes: number): string {
  if (minutes <= 0) return '0';
  const h = minutes / 60;
  if (Math.abs(h - Math.round(h)) < 0.001) return String(Math.round(h));
  return String(Math.round(h * 10) / 10);
}

function formFromGoal(goal: MacroGoal): GoalForm {
  return {
    name: goal.name,
    emoji: goal.emoji,
    linkTag: goal.linkTag,
    targetHours: String(Math.round(goal.targetMinutes / 60)),
    priorHours: hoursFieldFromMinutes(goal.priorMinutes ?? 0),
    weeklyPaceHours:
      goal.weeklyPaceMinutes != null ? String(Math.round(goal.weeklyPaceMinutes / 60)) : '',
    milestoneLabel: goal.milestoneLabel,
  };
}

function parseHoursField(raw: string, fallback = 0): number {
  const n = parseFloat(raw.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

function parseForm(form: GoalForm) {
  const weeklyRaw = form.weeklyPaceHours.trim();
  return {
    name: form.name,
    emoji: form.emoji,
    linkTag: form.linkTag,
    targetHours: parseHoursField(form.targetHours, 1),
    priorHours: parseHoursField(form.priorHours, 0),
    weeklyPaceHours: weeklyRaw ? parseHoursField(weeklyRaw) : null,
    milestoneLabel: form.milestoneLabel,
  };
}

export function MacroGoalsSettings({ goals, onChanged }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GoalForm>(emptyForm);
  const [busy, setBusy] = useState(false);

  const startCreate = () => {
    setEditingId('new');
    setForm(emptyForm());
  };

  const startEdit = (goal: MacroGoal) => {
    setEditingId(goal.id);
    setForm(formFromGoal(goal));
  };

  const cancelForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const submit = async () => {
    setBusy(true);
    try {
      const input = parseForm(form);
      if (editingId === 'new') {
        await window.electronAPI.createMacroGoal(input);
      } else if (editingId) {
        await window.electronAPI.updateMacroGoal(editingId, input);
      }
      cancelForm();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (goalId: string) => {
    if (!confirm('Удалить цель? Привязки в задачах сбросятся.')) return;
    setBusy(true);
    try {
      await window.electronAPI.deleteMacroGoal(goalId);
      if (editingId === goalId) cancelForm();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <fieldset className="macro-goals-settings">
      <legend>Цели (до {MAX_MACRO_GOALS})</legend>
      <p className="hint">
        Прогресс = «уже сделано до приложения» + факт по задачам, где в карточке выбрана эта цель
        (у повторяющихся — из шаблона серии). Название задачи не важно. В цель идёт «Факт», не
        «План».
      </p>

      {goals.length > 0 && (
        <ul className="macro-goals-settings-list">
          {goals.map((goal) => (
            <li key={goal.id}>
              <span>
                {goal.emoji} {goal.name} — {formatMacroGoalHours(goal.accumulatedMinutes)} /{' '}
                {formatMacroGoalHours(goal.targetMinutes)}
              </span>
              <span className="macro-goals-settings-actions">
                <button type="button" className="btn-chip" onClick={() => startEdit(goal)}>
                  Изменить
                </button>
                <button type="button" className="btn-chip btn-danger-soft" onClick={() => remove(goal.id)}>
                  Удалить
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {editingId && (
        <div className="macro-goal-form">
          <label>
            Название
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Английский"
            />
          </label>
          <label>
            Иконка (эмодзи)
            <input
              value={form.emoji}
              maxLength={4}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            />
          </label>
          <label>
            Заметка (необяз.)
            <input
              value={form.linkTag}
              onChange={(e) => setForm({ ...form, linkTag: e.target.value })}
              placeholder="для себя, на подсчёт не влияет"
            />
          </label>
          <label>
            Цель (часов)
            <input
              type="number"
              min={1}
              step={1}
              value={form.targetHours}
              onChange={(e) => setForm({ ...form, targetHours: e.target.value })}
            />
          </label>
          <label>
            Уже сделано до приложения (ч)
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.priorHours}
              onChange={(e) => setForm({ ...form, priorHours: e.target.value })}
              placeholder="0"
              title="Часы, которые вы накопили до создания этой цели в Rocket Shift"
            />
          </label>
          <label>
            Темп (ч/нед, необяз.)
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.weeklyPaceHours}
              onChange={(e) => setForm({ ...form, weeklyPaceHours: e.target.value })}
              placeholder="11"
            />
          </label>
          <label>
            Веха (подпись)
            <input
              value={form.milestoneLabel}
              onChange={(e) => setForm({ ...form, milestoneLabel: e.target.value })}
              placeholder="B2 — свободно говорю"
            />
          </label>
          <div className="macro-goal-form-actions">
            <button type="button" disabled={busy} onClick={() => void submit()}>
              {editingId === 'new' ? 'Добавить' : 'Сохранить'}
            </button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={cancelForm}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {!editingId && goals.length < MAX_MACRO_GOALS && (
        <button type="button" className="btn-secondary" onClick={startCreate}>
          + Цель
        </button>
      )}
    </fieldset>
  );
}
