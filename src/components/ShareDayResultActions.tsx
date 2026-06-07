import { useState } from 'react';
import type { DayMood } from '../../electron/types';
import {
  shareDayResultDefaultFilename,
  shareDayResultToDataUrl,
  type ShareDayResultInput,
} from '../lib/shareDayResult';

interface Props {
  percent: number;
  mood: DayMood;
  investedMinutes: number;
  streak: number;
  percentDelta: number | null;
  goalReached?: boolean;
  dailyGoalPercent?: number;
  dateKey: string;
}

export function ShareDayResultActions({
  percent,
  mood,
  investedMinutes,
  streak,
  percentDelta,
  goalReached,
  dailyGoalPercent,
  dateKey,
}: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const buildInput = (): ShareDayResultInput => ({
    percent,
    mood,
    investedMinutes,
    streak,
    percentDelta,
    goalReached,
    dailyGoalPercent,
    dateKey,
  });

  const handleCopy = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const dataUrl = shareDayResultToDataUrl(buildInput());
      const result = await window.electronAPI.shareCopyImage(dataUrl);
      if (result.ok) {
        setMessage('Скопировано — вставьте в чат (Ctrl+V)');
      } else {
        setMessage('Не удалось скопировать');
      }
    } catch {
      setMessage('Не удалось скопировать');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const dataUrl = shareDayResultToDataUrl(buildInput());
      const result = await window.electronAPI.shareSaveImage(
        dataUrl,
        shareDayResultDefaultFilename(dateKey),
      );
      if (result.canceled) return;
      if (result.ok && result.filePath) {
        setMessage('Карточка сохранена');
      } else {
        setMessage('Не удалось сохранить');
      }
    } catch {
      setMessage('Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="share-day-result">
      <p className="share-day-result-hint">Поделиться результатом с коллегами</p>
      <div className="share-day-result-actions">
        <button type="button" className="btn-secondary" disabled={busy} onClick={handleCopy}>
          Скопировать картинку
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={handleSave}>
          Сохранить PNG
        </button>
      </div>
      {message && <p className="share-day-result-message">{message}</p>}
    </div>
  );
}
