export function AboutAppPanel() {
  return (
    <fieldset className="about-app-fieldset">
      <legend>О Rocket Shift</legend>
      <p className="about-app-lead">
        <strong>Один честный % твоего дня.</strong> Не список галочек — видишь, сколько дня ты
        реально отдал себе, а не просто прожил.
      </p>
      <ul className="about-app-list">
        <li>Большой % сверху — итог за сегодня</li>
        <li>Виджет поверх окон — % всегда на виду</li>
        <li>Факт по задачам и таймер — честная цифра</li>
        <li>Закрытие дня и streak — привычка подводить итог</li>
        <li>Долгие цели — связь «сегодня» и «марафон»</li>
      </ul>
    </fieldset>
  );
}
