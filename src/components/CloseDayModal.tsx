import { useEffect, useState } from 'react';
import type { CloseDayPreview, DayMood, Task, MacroGoal } from '../../electron/types';
import { DAY_MOODS, DAY_MOOD_LABELS } from '../../electron/types';
import { PercentDisplay } from './PercentDisplay';
import {
  CLOSE_DAY_NOTE_MAX,
  formatInvestedDuration,
  formatInvestedHoursDecimal,
  normalizeCloseDayNote,
} from '../lib/dayClose';
import { buildCloseDayVictorySummary } from '../lib/closeDaySummary';
import { CloseDayYesterdayCompare } from './CloseDayYesterdayCompare';
import { ShareDayResultActions } from './ShareDayResultActions';
import { AchievementUnlockBanner } from './AchievementUnlockBanner';
import type { UnlockedAchievement } from '../../electron/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (mood: DayMood, note: string) => Promise<void>;
  loading?: boolean;
  targetDate?: string;
  yesterdayLabel?: string;
  onDismissPending?: () => void;
  newlyUnlocked?: UnlockedAchievement[];
  tasks?: Task[];
  macroGoals?: MacroGoal[];
}

export function CloseDayModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  targetDate,
  yesterdayLabel,
  onDismissPending,
  newlyUnlocked = [],
  tasks = [],
  macroGoals = [],
}: Props) {
  const [preview, setPreview] = useState<CloseDayPreview | null>(null);
  const [mood, setMood] = useState<DayMood | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const isYesterdayClose = Boolean(targetDate);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setMood(null);
      setNote('');
      setDone(false);
      return;
    }
    window.electronAPI.getCloseDayPreview(targetDate).then((p) => {
      setPreview(p);
      setMood(p.previousMood ?? null);
      setNote(p.previousNote ?? '');
    });
  }, [open, targetDate]);

  if (!open || !preview) return null;

  const breakdown = {
    temporal: preview.temporalPercent,
    fixed: preview.fixedPercent,
    total: preview.percent,
  };

  const handleConfirm = async () => {
    if (!mood) return;
    await onConfirm(mood, normalizeCloseDayNote(note));
    setDone(true);
  };

  const streakLabel =
    preview.alreadyClosed || done ? preview.streakCurrent : preview.streakAfterClose;

  const savedNote = normalizeCloseDayNote(note);
  const shareMood = mood ?? preview.previousMood;
  const canShare = Boolean(shareMood) && (done || preview.alreadyClosed);

  const shareBlock =
    canShare && shareMood ? (
      <ShareDayResultActions
        percent={preview.percent}
        mood={shareMood}
        investedMinutes={preview.investedMinutes}
        streak={streakLabel}
        percentDelta={preview.percentDelta}
        goalReached={preview.goalReached}
        dailyGoalPercent={preview.dailyGoalEnabled ? preview.dailyGoalPercent : undefined}
        dateKey={preview.date}
      />
    ) : null;

  const victory =
    done && mood
      ? buildCloseDayVictorySummary(preview, tasks, macroGoals, streakLabel)
      : null;

  return (
    <div className="close-day-overlay" onClick={onClose}>
      <div className="close-day-panel" onClick={(e) => e.stopPropagation()}>
        <div className="close-day-header">
          <div>
            <h2>
              {done
                ? isYesterdayClose
                  ? 'Вчера сохранено'
                  : 'День сохранён'
                : isYesterdayClose
                  ? 'Закрыть вчера'
                  : preview.alreadyClosed
                    ? 'Итог дня'
                    : 'Закрыть день'}
            </h2>
            {isYesterdayClose && yesterdayLabel && !done && (
              <p className="close-day-yesterday-hint">
                {yesterdayLabel} — день не был закрыт
              </p>
            )}
          </div>
          <button type="button" className="btn-chip" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        {done ? (
          <div className="close-day-success">
            {victory && (
              <div className="close-day-victory">
                <p className="close-day-victory-headline">{victory.headline}</p>
                {victory.lines.map((line) => (
                  <p key={line} className="close-day-victory-line">
                    {line}
                  </p>
                ))}
              </div>
            )}
            {savedNote && <p className="close-day-success-note">«{savedNote}»</p>}
            <AchievementUnlockBanner items={newlyUnlocked} />
            {shareBlock}
            <button type="button" className="close-day-submit" onClick={onClose}>
              Готово
            </button>
          </div>
        ) : (
          <>
            <PercentDisplay percent={preview.percent} breakdown={breakdown} size="medium" />

            {preview.dailyGoalEnabled && (
              <div
                className={`close-day-goal ${preview.goalReached ? 'close-day-goal-reached' : ''}`}
              >
                {preview.goalReached ? (
                  <span>✓ Цель дня {preview.dailyGoalPercent}% достигнута</span>
                ) : (
                  <span>
                    Цель {preview.dailyGoalPercent}% — осталось {preview.goalRemaining}%
                  </span>
                )}
              </div>
            )}

            <CloseDayYesterdayCompare preview={preview} />

            <div className="close-day-stats">
              <div className="close-day-stat">
                <span className="close-day-stat-value">
                  {formatInvestedHoursDecimal(preview.investedMinutes)}
                </span>
                <span className="close-day-stat-label">инвестировано</span>
                <span className="close-day-stat-sub">{formatInvestedDuration(preview.investedMinutes)}</span>
              </div>
              <div className="close-day-stat">
                <span className="close-day-stat-value">
                  {preview.tasksCompleted}/{preview.tasksTotal}
                </span>
                <span className="close-day-stat-label">с прогрессом</span>
              </div>
              <div className="close-day-stat">
                <span className="close-day-stat-value">{streakLabel}</span>
                <span className="close-day-stat-label">streak</span>
                {!preview.alreadyClosed && preview.streakAfterClose > preview.streakCurrent && (
                  <span className="close-day-stat-sub">+1 сегодня</span>
                )}
              </div>
            </div>

            <fieldset className="close-day-mood-fieldset">
              <legend>Как прошёл день?</legend>
              <div className="close-day-mood-row">
                {DAY_MOODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={mood === m ? 'close-day-mood-btn active' : 'close-day-mood-btn'}
                    title={DAY_MOOD_LABELS[m]}
                    onClick={() => setMood(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="close-day-note-label">
              Заметка <span className="close-day-note-optional">(необязательно)</span>
              <textarea
                className="close-day-note-input"
                rows={2}
                maxLength={CLOSE_DAY_NOTE_MAX}
                placeholder="Например: завтра меньше встреч"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <span className="close-day-note-counter">
                {note.trim().length}/{CLOSE_DAY_NOTE_MAX}
              </span>
            </label>

            <button
              type="button"
              className="close-day-submit"
              disabled={!mood || loading}
              onClick={handleConfirm}
            >
              {preview.alreadyClosed
                ? 'Обновить итог'
                : isYesterdayClose
                  ? 'Закрыть вчера'
                  : 'Закрыть и сохранить'}
            </button>

            {isYesterdayClose && onDismissPending && (
              <button
                type="button"
                className="close-day-later btn-secondary"
                disabled={loading}
                onClick={onDismissPending}
              >
                Позже
              </button>
            )}

            {shareBlock}
          </>
        )}
      </div>
    </div>
  );
}
