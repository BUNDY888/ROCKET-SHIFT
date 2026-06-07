interface Props {
  onDismiss: () => void;
}

export function WidgetSetupBanner({ onDismiss }: Props) {
  return (
    <div className="widget-setup-banner" role="status">
      <div className="widget-setup-banner-text">
        <strong>Виджет уже на экране</strong>
        <span>
          Маленькая плитка с % поверх окон — перетащи в удобное место. Иконку меняют в
          Настройках → Виджеты.
        </span>
      </div>
      <button type="button" className="btn-secondary widget-setup-banner-btn" onClick={onDismiss}>
        Понятно
      </button>
    </div>
  );
}
