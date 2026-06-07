import type { DayZoneHint as DayZoneHintType } from '../../electron/types';

interface Props {
  hint: DayZoneHintType | null;
}

export function DayZoneHint({ hint }: Props) {
  if (!hint) return null;

  return (
    <p
      className={
        hint.tone === 'catch-up'
          ? 'day-zone-hint day-zone-hint-catch-up'
          : 'day-zone-hint'
      }
      role="status"
    >
      {hint.text}
    </p>
  );
}
