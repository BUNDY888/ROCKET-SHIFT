import type { Task } from '../../electron/types';

/** Пример дня для первого запуска */
export function createOnboardingSampleTasks(): Task[] {
  return [
    {
      id: crypto.randomUUID(),
      type: 'temporal',
      name: 'Глубокая работа',
      plannedMinutes: 120,
      actualMinutes: 45,
      startHour: 9,
      endHour: 11,
    },
    {
      id: crypto.randomUUID(),
      type: 'temporal',
      name: 'Почта и созвоны',
      plannedMinutes: 60,
      actualMinutes: 0,
      startHour: 14,
      endHour: 15,
    },
    {
      id: crypto.randomUUID(),
      type: 'fixed',
      name: 'Зарядка',
      weightPercent: 5,
      completed: false,
      completedHour: null,
    },
  ];
}
