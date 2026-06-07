import type { FixedTask, TemporalTask } from '../../electron/types';
import { endHourFromStartAndPlanned } from './calculations';

function newId(): string {
  return crypto.randomUUID();
}

export function createTemporalTask(): TemporalTask {
  const startHour = 9;
  const plannedMinutes = 60;
  return {
    id: newId(),
    type: 'temporal',
    name: 'Новая задача',
    plannedMinutes,
    actualMinutes: 0,
    startHour,
    endHour: endHourFromStartAndPlanned(startHour, plannedMinutes),
    factStartHour: null,
    factEndHour: null,
    macroGoalId: null,
  };
}

export function createFixedTask(): FixedTask {
  return {
    id: newId(),
    type: 'fixed',
    name: 'Фиксированная задача',
    weightPercent: 2,
    completed: false,
    completedHour: null,
  };
}
