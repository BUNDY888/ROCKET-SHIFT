import type { DayTemplate } from '../../electron/types';

export function resolveMorningTemplate(
  templates: DayTemplate[],
  defaultTemplateId: string | null,
): DayTemplate | null {
  if (defaultTemplateId) {
    const chosen = templates.find((t) => t.id === defaultTemplateId);
    if (chosen) return chosen;
  }
  if (templates.length === 1) return templates[0];
  return null;
}
