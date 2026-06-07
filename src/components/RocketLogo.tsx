import rocketLogoUrl from '../assets/rocket-logo.png';

interface Props {
  className?: string;
  invertOnLight?: boolean;
}

export function RocketLogo({ className = 'app-logo', invertOnLight = true }: Props) {
  return (
    <img
      src={rocketLogoUrl}
      alt=""
      aria-hidden
      className={[className, invertOnLight ? 'app-logo-adaptive' : ''].filter(Boolean).join(' ')}
      draggable={false}
    />
  );
}

export const ROCKET_LOGO_SRC = rocketLogoUrl;
