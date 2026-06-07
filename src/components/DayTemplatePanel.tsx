import { useEffect, useState } from 'react';
import type { DayTemplate } from '../../electron/types';

interface Props {
  templates: DayTemplate[];
  hasTasks: boolean;
  defaultMorningTemplateId: string | null;
  onSave: (name: string) => void | Promise<void>;
  onApply: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onSetDefaultMorning: (templateId: string | null) => void;
}

export function DayTemplatePanel({
  templates,
  hasTasks,
  defaultMorningTemplateId,
  onSave,
  onApply,
  onDelete,
  onSetDefaultMorning,
}: Props) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('Мой день');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (status?.kind !== 'ok') return;
    const timer = window.setTimeout(() => setStatus(null), 4500);
    return () => window.clearTimeout(timer);
  }, [status]);

  const openSaveForm = () => {
    if (!hasTasks) {
      setStatus({ kind: 'err', text: 'Добавьте задачи на сегодня, чтобы сохранить шаблон' });
      setSaveOpen(false);
      return;
    }
    setStatus(null);
    setSaveName('Мой день');
    setSaveOpen(true);
  };

  const cancelSave = () => {
    if (saving) return;
    setSaveOpen(false);
  };

  const confirmSave = async () => {
    const name = saveName.trim() || 'Мой день';
    setSaving(true);
    try {
      await onSave(name);
      setSaveOpen(false);
      setStatus({ kind: 'ok', text: `Шаблон «${name}» сохранён — он в списке ниже` });
    } catch {
      setStatus({ kind: 'err', text: 'Не удалось сохранить шаблон. Попробуйте ещё раз' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="template-panel">
      <div className="template-panel-header">
        <h2 className="template-panel-title">Шаблоны дня</h2>
        <button type="button" className="btn-chip" onClick={openSaveForm} disabled={saving}>
          Сохранить текущий
        </button>
      </div>

      {status && (
        <p
          className={
            status.kind === 'ok' ? 'template-panel-status template-panel-status-ok' : 'template-panel-status template-panel-status-err'
          }
          role="status"
        >
          {status.text}
        </p>
      )}

      {saveOpen && (
        <form
          className="template-save-form"
          onSubmit={(e) => {
            e.preventDefault();
            void confirmSave();
          }}
        >
          <label className="template-save-label">
            Название шаблона
            <input
              type="text"
              className="template-save-input"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              maxLength={80}
              autoFocus
              disabled={saving}
            />
          </label>
          <div className="template-save-actions">
            <button type="submit" className="btn-chip" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
            <button type="button" className="btn-secondary" onClick={cancelSave} disabled={saving}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {templates.length === 0 ? (
        <p className="template-panel-hint">
          Сохраните набор задач как шаблон — утром применяйте одним кликом (☀️ в шапке дня)
        </p>
      ) : (
        <ul className="template-list">
          {templates.map((tpl) => {
            const isMorningDefault = defaultMorningTemplateId === tpl.id;
            return (
              <li key={tpl.id} className="template-item">
                <span className="template-name">
                  {tpl.name}{' '}
                  <span className="template-meta">({tpl.tasks.length} задач)</span>
                  {isMorningDefault && (
                    <span className="template-morning-badge" title="Утренний старт в один клик">
                      ☀️ утро
                    </span>
                  )}
                </span>
                <span className="template-actions">
                  <button
                    type="button"
                    className={
                      isMorningDefault
                        ? 'btn-chip template-morning-btn active'
                        : 'btn-chip template-morning-btn'
                    }
                    title={
                      isMorningDefault
                        ? 'Снять как шаблон утра'
                        : 'Использовать для «Начать день»'
                    }
                    onClick={() => onSetDefaultMorning(isMorningDefault ? null : tpl.id)}
                  >
                    {isMorningDefault ? '☀️' : '○'}
                  </button>
                  <button type="button" className="btn-chip" onClick={() => onApply(tpl.id)}>
                    Применить
                  </button>
                  <button
                    type="button"
                    className="btn-chip btn-chip-danger"
                    onClick={() => {
                      if (confirm(`Удалить шаблон «${tpl.name}»?`)) onDelete(tpl.id);
                    }}
                  >
                    ✕
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
