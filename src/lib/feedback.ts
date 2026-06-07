import packageJson from '../../package.json';

export const FEEDBACK_EMAIL = 'rocketshiftapp@gmail.com';

export function buildFeedbackMailtoUrl(appVersion = packageJson.version): string {
  const params = new URLSearchParams({
    subject: 'Rocket Shift — обратная связь',
    body: [
      'Опишите проблему или предложение:',
      '',
      '',
      '---',
      `Версия: ${appVersion}`,
      'ОС: Windows',
    ].join('\n'),
  });

  return `mailto:${FEEDBACK_EMAIL}?${params.toString()}`;
}
