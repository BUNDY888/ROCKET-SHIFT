import { useEffect, useRef, useState } from 'react';
import {
  defaultDurationUnit,
  formatMinutesAsHoursInput,
  HOURS_INPUT_HINT,
  inputValueToMinutes,
  isPartialHoursDurationInput,
  minutesToInputValue,
  sanitizeDurationDraft,
  type DurationInputUnit,
} from '../lib/durationFormat';

interface Props {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
  /** При открытии дня подтянуть конец из плана (только для поля «План»). */
  syncOnMount?: boolean;
}

export function DurationField({ label, minutes, onChange, disabled, syncOnMount }: Props) {
  const [unit, setUnit] = useState<DurationInputUnit>(() => defaultDurationUnit(minutes));
  const [draft, setDraft] = useState<string | null>(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (syncOnMount) onChange(minutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при смене плана
  }, [syncOnMount, minutes]);

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(null);
    }
  }, [minutes, unit]);

  const committedDisplay = String(minutesToInputValue(minutes, unit));
  const displayValue = draft ?? committedDisplay;

  const commitDraft = (raw: string) => {
    const next = inputValueToMinutes(raw, unit);
    onChange(next);
    if (unit === 'h') {
      setDraft(formatMinutesAsHoursInput(next));
    } else {
      setDraft(null);
    }
  };

  return (
    <label>
      {label}
      <div className="duration-input-row">
        <input
          type="text"
          inputMode={unit === 'h' ? 'decimal' : 'numeric'}
          disabled={disabled}
          value={displayValue}
          title={unit === 'h' ? HOURS_INPUT_HINT : undefined}
          onFocus={() => {
            focusedRef.current = true;
            setDraft(committedDisplay);
          }}
          onChange={(e) => {
            const raw = sanitizeDurationDraft(e.target.value, unit);
            setDraft(raw);
            if (unit === 'h' && isPartialHoursDurationInput(raw)) {
              return;
            }
            onChange(inputValueToMinutes(raw, unit));
          }}
          onBlur={() => {
            focusedRef.current = false;
            const raw = draft ?? committedDisplay;
            commitDraft(raw);
            setDraft(null);
          }}
        />
        <div className="duration-unit-toggle" role="group" aria-label={`${label}: единица`}>
          <button
            type="button"
            className={unit === 'h' ? 'duration-unit-btn active' : 'duration-unit-btn'}
            disabled={disabled}
            onClick={() => {
              setUnit('h');
              focusedRef.current = false;
              setDraft(null);
              onChange(minutes);
            }}
          >
            ч
          </button>
          <button
            type="button"
            className={unit === 'min' ? 'duration-unit-btn active' : 'duration-unit-btn'}
            disabled={disabled}
            onClick={() => {
              setUnit('min');
              focusedRef.current = false;
              setDraft(null);
              onChange(minutes);
            }}
          >
            мин
          </button>
        </div>
      </div>
    </label>
  );
}
