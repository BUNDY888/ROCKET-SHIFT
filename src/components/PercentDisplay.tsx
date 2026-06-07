import { getZoneColor, type PercentBreakdown } from '../lib/calculations';
import { formatPercentDisplay } from '../lib/percentFormat';



interface Props {

  percent: number;

  breakdown?: PercentBreakdown;

  size?: 'large' | 'medium' | 'small';

  celebrate?: boolean;

}



export function PercentDisplay({ percent, breakdown, size = 'large', celebrate = false }: Props) {

  const bg = getZoneColor(percent);

  const fontSize =

    size === 'large' ? '4rem' : size === 'medium' ? '2.5rem' : '1.25rem';

  const padding =

    size === 'large' ? '1.5rem 2rem' : size === 'medium' ? '1rem' : '0.5rem';



  return (

    <div className="percent-block">

      <div

        className={celebrate ? 'percent-display goal-celebrate' : 'percent-display'}

        style={{

          background: bg,

          color: '#fff',

          fontSize,

          fontWeight: 700,

          padding,

          borderRadius: 12,

          textAlign: 'center',

          textShadow: '0 1px 2px rgba(0,0,0,0.25)',

          transition: 'background 0.35s ease',

        }}

      >

        {formatPercentDisplay(percent)}%

      </div>

      {breakdown && size === 'large' && (

        <p className="percent-breakdown">

          Временные: <strong>{formatPercentDisplay(breakdown.temporal)}%</strong>

          {' · '}

          Фиксированные: <strong>+{formatPercentDisplay(breakdown.fixed)}%</strong>

          {' · '}

          Итого: <strong>{formatPercentDisplay(breakdown.total)}%</strong>

        </p>

      )}

    </div>

  );

}


