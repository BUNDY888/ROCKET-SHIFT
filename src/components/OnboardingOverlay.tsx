import { useState } from 'react';

const STEPS = [
  {
    title: 'Добро пожаловать в Rocket Shift',
    body: (
      <>
        <p>
          Одна главная метрика — <strong>честный % дня</strong>. Не «сколько галочек», а сколько
          времени ты реально отдал себе.
        </p>
        <p>
          Данные только на этом компьютере. Никаких облаков — резервная копия в настройках, когда
          захочешь.
        </p>
      </>
    ),
  },
  {
    title: 'Процент и виджет',
    body: (
      <>
        <p>
          Большая цифра сверху — итог за сегодня. Цвет от красного к фиолетовому показывает, на
          каком ты уровне.
        </p>
        <p>
          <strong>Виджет</strong> — маленькая плитка поверх всех окон с тем же %. Перетащи её в
          удобное место — % всегда на виду.
        </p>
      </>
    ),
  },
  {
    title: 'Задачи',
    body: (
      <>
        <p>
          <strong>Временные</strong> — план в минутах и факт (поле или ▶ таймер).{' '}
          <strong>Фиксированные</strong> — вес в % и галочка «Выполнено».
        </p>
        <p>Гистограмма под процентом показывает, в какие часы накоплен факт.</p>
      </>
    ),
  },
  {
    title: 'Закрыть день',
    body: (
      <>
        <p>
          Вечером — <strong>«Закрыть день»</strong>: настроение, заметка, фиксация %. Так растёт{' '}
          <strong>streak</strong> 🔥 — серия честных дней подряд.
        </p>
        <p>
          Кнопка <strong>«Цели»</strong> в шапке — долгие марафоны на сотни часов. Остальное
          (неделя, месяц, фокус) — по мере привыкания.
        </p>
      </>
    ),
  },
  {
    title: 'Первый день',
    body: (
      <>
        <p>
          Сейчас загрузим <strong>пример дня</strong> — сразу увидишь % и гистограмму. Потом
          замени задачи на свои или начни с пустого листа.
        </p>
        <p className="onboarding-sample-preview">
          «Глубокая работа» 2 ч (факт 45 мин) · «Почта» 1 ч · «Зарядка» 5%
        </p>
        <p className="onboarding-tip">
          Обучение снова: Настройки → Обучение → «Показать обучение снова».
        </p>
      </>
    ),
  },
] as const;

interface Props {
  hasTasks: boolean;
  onComplete: (loadSample: boolean) => void;
  onSkip: () => void;
}

export function OnboardingOverlay({ hasTasks, onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-panel">
        <div className="onboarding-progress" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={i <= step ? 'onboarding-dot active' : 'onboarding-dot'} />
          ))}
        </div>

        <p className="onboarding-step-label">
          Шаг {step + 1} из {STEPS.length}
        </p>

        <h2 id="onboarding-title" className="onboarding-title">
          {current.title}
        </h2>
        <div className="onboarding-body">{current.body}</div>

        <div className="onboarding-actions">
          {step > 0 ? (
            <button type="button" className="btn-secondary onboarding-btn-back" onClick={() => setStep(step - 1)}>
              Назад
            </button>
          ) : (
            <button type="button" className="btn-secondary onboarding-btn-back" onClick={onSkip}>
              Пропустить
            </button>
          )}

          {!isLast ? (
            <button type="button" className="onboarding-btn-next" onClick={() => setStep(step + 1)}>
              Дальше
            </button>
          ) : (
            <div className="onboarding-finish-group">
              {!hasTasks ? (
                <>
                  <button type="button" className="onboarding-btn-next" onClick={() => onComplete(true)}>
                    Начать с примером
                  </button>
                  <button type="button" className="onboarding-btn-sample" onClick={() => onComplete(false)}>
                    Пустой день
                  </button>
                </>
              ) : (
                <button type="button" className="onboarding-btn-next" onClick={() => onComplete(false)}>
                  Понятно
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
