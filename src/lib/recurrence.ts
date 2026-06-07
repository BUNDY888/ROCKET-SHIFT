import type {
  RecurrencePattern,
  RecurringTaskDefinition,
  Task,
} from '../../electron/types';
import { RECURRENCE_LABELS } from '../../electron/types';

export { RECURRENCE_LABELS };

const WEEKDAY_SHORT = ['', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'] as const;

export type RecurrenceSelectValue = RecurrencePattern | 'none';

export function formatRecurrenceLabel(
  pattern: RecurrencePattern,
  weekday = 1,
): string {
  const base = RECURRENCE_LABELS[pattern];
  if (pattern === 'weekly') {
    return `${base} (${WEEKDAY_SHORT[weekday] ?? 'пн'})`;
  }
  return base;
}

export function formatRecurringRuleLabel(
  rule: RecurringTaskDefinition,
): string {
  return formatRecurrenceLabel(rule.pattern, rule.weekday);
}

export function getTaskRecurrencePattern(
  task: Task,
  defs: RecurringTaskDefinition[],
): RecurrencePattern | null {
  if (!task.recurringId) return null;
  const def = defs.find((d) => d.id === task.recurringId);
  if (!def?.enabled) return null;
  return def.pattern;
}

export function recurrenceSelectValue(
  task: Task,
  defs: RecurringTaskDefinition[],
): RecurrenceSelectValue {
  return getTaskRecurrencePattern(task, defs) ?? 'none';
}
