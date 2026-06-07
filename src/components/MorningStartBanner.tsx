import type { DayTemplate } from '../../electron/types';
import { resolveMorningTemplate } from '../lib/morningStart';

interface Props {
  templates: DayTemplate[];
  defaultTemplateId: string | null;
  yesterdayTaskCount: number;
  yesterdayLabel: string;
  onApplyTemplate: (templateId: string) => void;
  onCopyYesterday: () => void;
}

export function MorningStartBanner({
  templates,
  defaultTemplateId,
  yesterdayTaskCount,
  yesterdayLabel,
  onApplyTemplate,
  onCopyYesterday,
}: Props) {
  const primary = resolveMorningTemplate(templates, defaultTemplateId);
  const hasTemplates = templates.length > 0;
  const hasYesterday = yesterdayTaskCount > 0;

  if (!hasTemplates && !hasYesterday) {
    return (
      <section className="morning-start-banner morning-start-banner-empty">
        <h2 className="morning-start-title">☀️ Начать день</h2>
        <p className="morning-start-hint">
          Добавьте задачи вручную или сохраните вчерашний план в блоке «Шаблоны дня» — утром
          подставите одним кликом.
        </p>
      </section>
    );
  }

  return (
    <section className="morning-start-banner">
      <div className="morning-start-head">
        <h2 className="morning-start-title">☀️ Начать день</h2>
        <p className="morning-start-hint">Задач на сегодня пока нет — выберите быстрый старт</p>
      </div>

      <div className="morning-start-actions">
        {primary && (
          <button
            type="button"
            className="morning-start-btn-primary"
            onClick={() => onApplyTemplate(primary.id)}
          >
            Начать «{primary.name}»
            <span className="morning-start-btn-meta">{primary.tasks.length} задач</span>
          </button>
        )}

        {!primary &&
          hasTemplates &&
          templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="btn-secondary morning-start-template-btn"
              onClick={() => onApplyTemplate(tpl.id)}
            >
              {tpl.name}
              <span className="morning-start-btn-meta">({tpl.tasks.length})</span>
            </button>
          ))}

        {hasYesterday && (
          <button type="button" className="btn-secondary morning-start-yesterday-btn" onClick={onCopyYesterday}>
            Как вчера
            <span className="morning-start-btn-meta">
              {yesterdayLabel} · {yesterdayTaskCount} без прогресса
            </span>
          </button>
        )}
      </div>

      {hasTemplates && !defaultTemplateId && templates.length > 1 && (
        <p className="morning-start-foot">
          В «Шаблоны дня» нажмите ☀️ у шаблона — он станет кнопкой «Начать день» в один клик.
        </p>
      )}
    </section>
  );
}
