import type { AppSettings, MacroGoal, RecurringTaskDefinition, AppTheme } from '../../electron/types';
import { MacroGoalsSettings } from './MacroGoalsSettings';
import { AboutAppPanel } from './AboutAppPanel';
import { formatRecurringRuleLabel } from '../lib/recurrence';
import { buildFeedbackMailtoUrl, FEEDBACK_EMAIL } from '../lib/feedback';
import { useEffect, useState } from 'react';

import { WIDGET_ICON_OPTIONS, WIDGET_ICON_CUSTOM } from '../lib/widgetIcons';
import {
  formatCelebrationDurationHint,
  setCelebrationSoundPlayingListener,
  stopCelebrationSound,
  toggleCelebrationSoundPreview,
} from '../lib/goalCelebration';
interface Props {

  settings: AppSettings;

  celebrationSoundUrl: string | null;

  widgetCustomPhotoUrl: string | null;

  recurringTasks: RecurringTaskDefinition[];

  onSave: (partial: Partial<AppSettings>) => void;

  onRecurringEnabled: (recurringId: string, enabled: boolean) => void;

  onRecurringDelete: (recurringId: string) => void;

  macroGoals: MacroGoal[];

  onMacroGoalsChanged: () => void;

}



export function SettingsPanel({
  settings,
  celebrationSoundUrl,
  widgetCustomPhotoUrl,
  recurringTasks,
  onSave,
  onRecurringEnabled,
  onRecurringDelete,
  macroGoals,
  onMacroGoalsChanged,
}: Props) {

  const selectIcon = (id: string) => onSave({ widgetIcon: id });
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [trackPreviewing, setTrackPreviewing] = useState(false);
  const trackDurationSec = settings.celebrationSoundDurationSec ?? 10;
  const trackDurationHint = formatCelebrationDurationHint(trackDurationSec);

  useEffect(() => {
    setCelebrationSoundPlayingListener(setTrackPreviewing);
    return () => {
      setCelebrationSoundPlayingListener(null);
      stopCelebrationSound();
    };
  }, []);

  const formatPath = (filePath: string) => {
    const parts = filePath.split(/[/\\]/);
    return parts.length > 2 ? `…/${parts.slice(-2).join('/')}` : filePath;
  };

  const handleExportJson = async () => {
    setExportMessage(null);
    const result = await window.electronAPI.exportBackupJson();
    if (result.canceled) return;
    if (result.ok && result.filePath) {
      setExportMessage(`JSON сохранён: ${formatPath(result.filePath)}`);
      return;
    }
    setExportMessage('Не удалось сохранить JSON.');
  };

  const handleExportCsv = async () => {
    setExportMessage(null);
    const result = await window.electronAPI.exportDaysCsv();
    if (result.canceled) return;
    if (result.ok && result.filePath) {
      setExportMessage(`CSV сохранён: ${formatPath(result.filePath)}`);
      return;
    }
    setExportMessage('Не удалось сохранить CSV.');
  };

  const handleImportJson = async () => {
    if (
      !confirm(
        'Восстановить данные из файла? Текущие данные будут заменены. Перед этим создаётся копия data.json.bak.',
      )
    ) {
      return;
    }
    setExportMessage(null);
    const result = await window.electronAPI.importBackupJson();
    if (result.canceled) return;
    if (result.ok) {
      setExportMessage('Данные восстановлены из резервной копии.');
      return;
    }
    if (result.error === 'invalid_file') {
      setExportMessage('Файл не похож на резервную копию Rocket Shift.');
      return;
    }
    setExportMessage('Не удалось прочитать файл.');
  };

  const handleFeedback = async () => {
    setExportMessage(null);
    const result = await window.electronAPI.openExternal(buildFeedbackMailtoUrl());
    if (result.ok) return;
    try {
      await navigator.clipboard.writeText(FEEDBACK_EMAIL);
      setExportMessage(`Не удалось открыть почту. Адрес скопирован: ${FEEDBACK_EMAIL}`);
    } catch {
      setExportMessage(`Напишите на ${FEEDBACK_EMAIL}`);
    }
  };



  return (

    <details className="settings-panel">

      <summary>Настройки</summary>

      <div className="settings-body">

        <AboutAppPanel />

        <fieldset className="theme-fieldset">
          <legend>Оформление</legend>
          <label className="reminder-interval-label">
            Тема
            <select
              value={settings.theme}
              onChange={(e) => onSave({ theme: e.target.value as AppTheme })}
            >
              <option value="light">Светлая</option>
              <option value="dark">Тёмная</option>
              <option value="system">Как в системе</option>
            </select>
          </label>
        </fieldset>

        <MacroGoalsSettings goals={macroGoals} onChanged={onMacroGoalsChanged} />

        <fieldset>

          <legend>Виджеты</legend>

          <p className="settings-icons-hint">
            Иконка на виджете — эмодзи, фото из списка или своё изображение:
          </p>

          <div className="icon-picker">

            {widgetCustomPhotoUrl && (
              <button
                type="button"
                className={[
                  'icon-btn',
                  'icon-btn-photo',
                  settings.widgetIcon === WIDGET_ICON_CUSTOM ? 'active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title="Своё фото"
                onClick={() => selectIcon(WIDGET_ICON_CUSTOM)}
              >
                <img
                  src={widgetCustomPhotoUrl}
                  alt=""
                  className="icon-btn-img"
                  draggable={false}
                />
              </button>
            )}

            {WIDGET_ICON_OPTIONS.map((opt) => (

              <button

                key={opt.id}

                type="button"

                className={[
                  'icon-btn',
                  opt.imageSrc ? 'icon-btn-photo' : '',
                  settings.widgetIcon === opt.id ? 'active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}

                title={opt.label}

                onClick={() => selectIcon(opt.id)}

              >
                {opt.imageSrc ? (
                  <img src={opt.imageSrc} alt="" className="icon-btn-img" draggable={false} />
                ) : (
                  opt.emoji
                )}
              </button>

            ))}

          </div>

          <div className="widget-custom-photo-block">
            <span className="widget-custom-photo-label">Своё фото</span>
            <div className="widget-custom-photo-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  const result = await window.electronAPI.pickWidgetPhoto();
                  if (result.canceled) return;
                  if (!result.ok) {
                    const msg =
                      result.error === 'too_large'
                        ? 'Файл слишком большой (макс. 4 МБ).'
                        : result.error === 'unsupported'
                          ? 'Формат не поддерживается (PNG, JPG, WebP).'
                          : 'Не удалось загрузить файл.';
                    alert(msg);
                  }
                }}
              >
                Выбрать файл
              </button>
              {settings.widgetCustomPhotoFile && widgetCustomPhotoUrl && (
                <button
                  type="button"
                  className="btn-chip btn-chip-danger"
                  title="Убрать фото"
                  onClick={() => {
                    void window.electronAPI.clearWidgetPhoto();
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            {settings.widgetCustomPhotoFile && (
              <p className="hint widget-custom-photo-name">{settings.widgetCustomPhotoFile}</p>
            )}
            <p className="hint">
              Фото сохраняется в папке Rocket Shift. PNG, JPG или WebP, до 4 МБ.
            </p>
          </div>

        </fieldset>

        <fieldset>
          <legend>Обучение</legend>
          <p className="settings-icons-hint">Краткий тур по приложению — ~1 минута, 5 шагов.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onSave({ onboardingCompleted: false })}
          >
            Показать обучение снова
          </button>
        </fieldset>

        <label className="checkbox-label">

          <input

            type="checkbox"

            checked={settings.autostart}

            onChange={(e) => onSave({ autostart: e.target.checked })}

          />

          Автозапуск с Windows

        </label>



        <fieldset className="reminder-fieldset">

          <legend>Напоминания</legend>

          <label className="checkbox-label">

            <input

              type="checkbox"

              checked={settings.reminderEnabled}

              onChange={(e) => onSave({ reminderEnabled: e.target.checked })}

            />

            Мягкие напоминания из трея

          </label>

          <label className="reminder-interval-label">

            Интервал

            <select

              value={settings.reminderIntervalMinutes}

              disabled={!settings.reminderEnabled}

              onChange={(e) =>

                onSave({ reminderIntervalMinutes: Number(e.target.value) })

              }

            >

              <option value={15}>каждые 15 мин</option>

              <option value={30}>каждые 30 мин</option>

              <option value={60}>каждый час</option>

            </select>

          </label>

          <p className="hint">
            Если в текущем временном слоте нет прогресса — подсказка у иконки в трее
          </p>

          <label className="checkbox-label reminder-close-day-toggle">
            <input
              type="checkbox"
              checked={settings.closeDayReminderEnabled}
              onChange={(e) => onSave({ closeDayReminderEnabled: e.target.checked })}
            />
            Напоминание закрыть день
          </label>

          <label className="reminder-interval-label">
            Время напоминания
            <input
              type="time"
              step={60}
              disabled={!settings.closeDayReminderEnabled}
              value={`${String(settings.closeDayReminderHour).padStart(2, '0')}:${String(settings.closeDayReminderMinute).padStart(2, '0')}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':');
                onSave({
                  closeDayReminderHour: parseInt(h, 10) || 21,
                  closeDayReminderMinute: parseInt(m, 10) || 0,
                });
              }}
            />
          </label>

          <p className="hint">
            Раз в день, если день ещё не закрыт и есть задачи. Клик по уведомлению откроет «Закрыть день».
          </p>
        </fieldset>

        <fieldset className="zone-hints-fieldset">
          <legend>Подсказки по дню</legend>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.zoneHintsEnabled !== false}
              onChange={(e) => onSave({ zoneHintsEnabled: e.target.checked })}
            />
            Мягкие подсказки из истории
          </label>
          <p className="hint">
            Сравнивает ваш % с прошлыми днями в это же время — например, «к полудню обычно ~40%, сейчас 20%».
          </p>
        </fieldset>

        <fieldset className="recurring-fieldset">
          <legend>Повторяющиеся задачи</legend>
          {recurringTasks.length > 0 ? (
            <ul className="recurring-list">
              {recurringTasks.map((rule) => (
                <li key={rule.id} className={rule.enabled ? '' : 'recurring-list-disabled'}>
                  <div className="recurring-list-main">
                    <span className="recurring-list-name">{rule.item.name}</span>
                    <span className="recurring-list-pattern">
                      {formatRecurringRuleLabel(rule)}
                    </span>
                  </div>
                  <div className="recurring-list-actions">
                    <label className="recurring-toggle" title={rule.enabled ? 'Выключить' : 'Включить'}>
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => onRecurringEnabled(rule.id, e.target.checked)}
                      />
                      вкл
                    </label>
                    <button
                      type="button"
                      className="btn-chip recurring-delete-btn"
                      onClick={() => {
                        if (confirm(`Удалить повтор «${rule.item.name}»?`)) {
                          onRecurringDelete(rule.id);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">
              В карточке задачи выберите «Повтор» — каждый день, будни или раз в неделю.
            </p>
          )}
        </fieldset>

        <fieldset className="daily-goal-fieldset">
          <legend>Цель на день</legend>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.dailyGoalEnabled}
              onChange={(e) => onSave({ dailyGoalEnabled: e.target.checked })}
            />
            Показывать цель по проценту
          </label>
          <label className="reminder-interval-label">
            Цель, %
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              disabled={!settings.dailyGoalEnabled}
              value={settings.dailyGoalPercent}
              onChange={(e) => {
                const next = Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 70));
                onSave({ dailyGoalPercent: next });
              }}
            />
          </label>
          <p className="hint">
            Полоска прогресса под процентом дня. При закрытии — отметка, если цель достигнута.
          </p>
          <label className="checkbox-label daily-goal-celebration-toggle">
            <input
              type="checkbox"
              checked={settings.goalCelebrationEnabled !== false}
              disabled={!settings.dailyGoalEnabled}
              onChange={(e) => onSave({ goalCelebrationEnabled: e.target.checked })}
            />
            Звук и анимация при цели
          </label>
          <p className="hint">
            Короткий сигнал и вспышка, когда % достигает цели. При закрытии с 🏆 — отдельный звук.
          </p>

          <div className="celebration-sound-block">
            <span className="celebration-sound-label">Свой трек</span>
            <div className="celebration-sound-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  stopCelebrationSound();
                  const result = await window.electronAPI.pickCelebrationSound();
                  if (result.canceled) return;
                  if (!result.ok) {
                    const msg =
                      result.error === 'too_large'
                        ? 'Файл слишком большой (макс. 12 МБ).'
                        : result.error === 'unsupported'
                          ? 'Формат не поддерживается (mp3, wav, ogg, m4a…).'
                          : 'Не удалось загрузить файл.';
                    alert(msg);
                  }
                }}
              >
                Выбрать файл
              </button>
              {settings.celebrationSoundFile && celebrationSoundUrl && (
                <>
                  <button
                    type="button"
                    className={
                      trackPreviewing ? 'btn-chip celebration-preview-active' : 'btn-chip'
                    }
                    title={
                      trackPreviewing ? 'Остановить' : `Прослушать (${trackDurationHint})`
                    }
                    onClick={() =>
                      toggleCelebrationSoundPreview(celebrationSoundUrl, trackDurationSec)
                    }
                  >
                    {trackPreviewing ? '⏹' : '▶'}
                  </button>
                  <button
                    type="button"
                    className="btn-chip btn-chip-danger"
                    title="Убрать трек"
                    onClick={() => {
                      stopCelebrationSound();
                      void window.electronAPI.clearCelebrationSound();
                    }}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
            {settings.celebrationSoundFile && (
              <p className="hint celebration-sound-name">{settings.celebrationSoundFile}</p>
            )}
            <label>
              Длительность трека (сек)
              <input
                type="number"
                min={0}
                max={600}
                step={1}
                disabled={!settings.celebrationSoundFile}
                value={trackDurationSec}
                onChange={(e) => {
                  const raw = parseInt(e.target.value, 10);
                  const next = Number.isFinite(raw)
                    ? Math.min(600, Math.max(0, raw))
                    : 10;
                  onSave({ celebrationSoundDurationSec: next });
                }}
              />
            </label>
            <p className="hint">
              Сколько играет при 100%, при цели дня и в предпрослушивании.{' '}
              <strong>0</strong> — до конца файла; сейчас: <strong>{trackDurationHint}</strong>.
            </p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.celebrationSoundAt100 !== false}
                disabled={!settings.celebrationSoundFile}
                onChange={(e) => onSave({ celebrationSoundAt100: e.target.checked })}
              />
              Играть при 100%
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.celebrationSoundAtGoal === true}
                disabled={!settings.celebrationSoundFile || !settings.dailyGoalEnabled}
                onChange={(e) => onSave({ celebrationSoundAtGoal: e.target.checked })}
              />
              Играть при цели дня (вместо стандартного)
            </label>
            <p className="hint">Трек в папке Rocket Shift. MP3, WAV, OGG и др., до 12 МБ.</p>
          </div>
        </fieldset>

        <fieldset className="export-fieldset">
          <legend>Экспорт и резервная копия</legend>
          <div className="export-actions">
            <button type="button" className="btn-secondary" onClick={handleExportJson}>
              Сохранить JSON
            </button>
            <button type="button" className="btn-secondary" onClick={handleExportCsv}>
              Экспорт CSV
            </button>
            <button type="button" className="btn-secondary" onClick={handleImportJson}>
              Восстановить JSON
            </button>
          </div>
          <p className="hint">
            JSON — полная копия (задачи, история, настройки, шаблоны). CSV — таблица дней для Excel.
          </p>
          {exportMessage && <p className="export-status">{exportMessage}</p>}
        </fieldset>

        <fieldset className="export-fieldset">
          <legend>Обратная связь</legend>
          <p className="settings-icons-hint">
            Нашли баг или есть идея? Напишите — это beta, нам важен каждый отзыв.
          </p>
          <div className="export-actions">
            <button type="button" className="btn-secondary" onClick={handleFeedback}>
              Написать на {FEEDBACK_EMAIL}
            </button>
          </div>
        </fieldset>

        <fieldset className="hotkeys-fieldset">
          <legend>Горячие клавиши</legend>
          <ul className="hotkeys-list">
            <li><kbd>Space</kbd> — старт / пауза таймера</li>
            <li><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> — режим фокуса</li>
            <li><kbd>Esc</kbd> — выйти из фокуса</li>
            <li><kbd>Ctrl</kbd> + <kbd>N</kbd> — новая временная задача</li>
            <li><kbd>Ctrl</kbd> + <kbd>D</kbd> — закрыть день</li>
          </ul>
        </fieldset>

      </div>

    </details>

  );

}


