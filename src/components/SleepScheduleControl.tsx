import { decimalHourToTimeValue, timeValueToDecimalHour } from '../lib/timeInput';

interface Props {
  wakeHour: number;
  bedHour: number;
  onChange: (patch: { sleepWakeHour?: number; sleepBedHour?: number }) => void;
}

export function SleepScheduleControl({ wakeHour, bedHour, onChange }: Props) {
  return (
    <div className="sleep-schedule-control" role="group" aria-label="Режим сна">
      <span className="sleep-schedule-title">Режим сна</span>
      <label className="sleep-schedule-field">
        Просыпаюсь
        <input
          type="time"
          step={900}
          value={decimalHourToTimeValue(wakeHour)}
          onChange={(e) =>
            onChange({ sleepWakeHour: timeValueToDecimalHour(e.target.value) })
          }
        />
      </label>
      <label className="sleep-schedule-field">
        Ложусь
        <input
          type="time"
          step={900}
          value={decimalHourToTimeValue(bedHour)}
          onChange={(e) =>
            onChange({ sleepBedHour: timeValueToDecimalHour(e.target.value) })
          }
        />
      </label>
    </div>
  );
}
