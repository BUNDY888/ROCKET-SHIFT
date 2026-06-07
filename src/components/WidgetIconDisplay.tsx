import { getWidgetIconOption, WIDGET_ICON_CUSTOM } from '../lib/widgetIcons';
import { ROCKET_LOGO_SRC } from './RocketLogo';

interface Props {
  iconId: string;
  className?: string;
  customPhotoUrl?: string | null;
}

export function WidgetIconDisplay({ iconId, className, customPhotoUrl }: Props) {
  if (iconId === WIDGET_ICON_CUSTOM && customPhotoUrl) {
    return (
      <img
        src={customPhotoUrl}
        alt=""
        aria-hidden
        className={[className, 'widget-photo-img'].filter(Boolean).join(' ')}
        draggable={false}
      />
    );
  }

  const opt = getWidgetIconOption(iconId);
  const imageSrc = iconId === '🚀' ? ROCKET_LOGO_SRC : opt?.imageSrc;

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt=""
        aria-hidden
        className={[className, 'widget-photo-img'].filter(Boolean).join(' ')}
        draggable={false}
      />
    );
  }

  return <span className={className}>{opt?.emoji ?? '🚀'}</span>;
}
