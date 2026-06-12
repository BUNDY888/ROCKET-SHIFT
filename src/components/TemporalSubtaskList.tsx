import { useState } from 'react';
import type { TemporalSubtask } from '../../electron/types';
import { createTemporalSubtask } from '../lib/temporalSubtasks';

interface Props {
  subtasks: TemporalSubtask[];
  onChange: (subtasks: TemporalSubtask[]) => void;
}

export function TemporalSubtaskList({ subtasks, onChange }: Props) {
  const [draft, setDraft] = useState('');

  const addSubtask = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    onChange([...subtasks, createTemporalSubtask(text)]);
    setDraft('');
  };

  const updateSubtask = (id: string, patch: Partial<TemporalSubtask>) => {
    onChange(subtasks.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeSubtask = (id: string) => {
    onChange(subtasks.filter((item) => item.id !== id));
  };

  const doneCount = subtasks.filter((item) => item.completed).length;

  return (
    <div className="temporal-subtasks">
      <div className="temporal-subtasks-head">
        <span className="temporal-subtasks-title">Дела в слоте</span>
        {subtasks.length > 0 && (
          <span className="temporal-subtasks-progress">
            {doneCount}/{subtasks.length}
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <ul className="temporal-subtasks-list">
          {subtasks.map((item) => (
            <li key={item.id} className={item.completed ? 'temporal-subtask-done' : undefined}>
              <label className="temporal-subtask-row">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => updateSubtask(item.id, { completed: e.target.checked })}
                />
                <input
                  type="text"
                  className="temporal-subtask-text"
                  value={item.text}
                  placeholder="Дело"
                  onChange={(e) => updateSubtask(item.id, { text: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="btn-chip temporal-subtask-remove"
                aria-label="Удалить"
                onClick={() => removeSubtask(item.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="temporal-subtasks-add"
        onSubmit={(e) => {
          e.preventDefault();
          addSubtask(draft);
        }}
      >
        <input
          type="text"
          value={draft}
          placeholder="+ Добавить дело"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn-secondary" disabled={!draft.trim()}>
          Добавить
        </button>
      </form>
    </div>
  );
}
