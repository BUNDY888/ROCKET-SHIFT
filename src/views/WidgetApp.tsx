import { useRef, useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { useAppState } from '../hooks/useAppState';

import { getZoneColor } from '../lib/calculations';
import { formatPercentForWidget } from '../lib/percentFormat';

import { WidgetIconDisplay } from '../components/WidgetIconDisplay';

export function WidgetApp() {
  const { state, percent } = useAppState();

  const dragging = useRef(false);
  const interactive = useRef(false);

  const lastPos = useRef({ x: 0, y: 0 });
  const lastClient = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const setPassthrough = useCallback((ignore: boolean) => {
    interactive.current = !ignore;
    window.electronAPI.widgetSetMousePassthrough(ignore);
  }, []);

  useLayoutEffect(() => {
    setMenuOpen(false);
    void window.electronAPI.widgetResize(false);
  }, []);

  useLayoutEffect(() => {
    window.electronAPI.widgetResize(menuOpen);
  }, [menuOpen]);

  useEffect(() => {
    setPassthrough(!menuOpen);
  }, [menuOpen, setPassthrough]);

  const onInteractiveEnter = useCallback(() => {
    setPassthrough(false);
  }, [setPassthrough]);

  const onInteractiveLeave = useCallback(() => {
    if (!dragging.current && !menuOpen) {
      setPassthrough(true);
    }
  }, [setPassthrough, menuOpen]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      moved.current = false;
      lastPos.current = { x: e.screenX, y: e.screenY };
      lastClient.current = { x: e.clientX, y: e.clientY };
      setPassthrough(false);
      e.preventDefault();
    },
    [setPassthrough],
  );

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;

    const dx = e.screenX - lastPos.current.x;
    const dy = e.screenY - lastPos.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved.current = true;
    lastPos.current = { x: e.screenX, y: e.screenY };
    lastClient.current = { x: e.clientX, y: e.clientY };
    window.electronAPI.widgetDrag(dx, dy);
  }, []);

  const endDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    window.electronAPI.widgetDragEnd();
    setPassthrough(true);
    const { x, y } = lastClient.current;
    const hit = document.elementFromPoint(x, y)?.closest('.widget-root, .widget-menu');
    if (hit) {
      setPassthrough(false);
    }
  }, [setPassthrough]);

  useEffect(() => {
    window.addEventListener('mouseup', endDrag);
    return () => window.removeEventListener('mouseup', endDrag);
  }, [endDrag]);

  const onRootClick = useCallback(() => {
    if (moved.current) return;
    setMenuOpen((open) => !open);
  }, []);

  const displayPercent = state ? percent : 0;
  const bg = getZoneColor(displayPercent);
  const tilePercent = formatPercentForWidget(displayPercent);
  const iconId = state?.settings.widgetIcon ?? 'photo:new-rocket';

  const mainOpen = state?.mainWindowVisible === true;

  const toggleApp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPassthrough(false);
      void window.electronAPI.toggleMain();
    },
    [setPassthrough],
  );

  const interactiveHandlers = {
    onMouseEnter: onInteractiveEnter,
    onMouseLeave: onInteractiveLeave,
  };

  return (
    <div className={menuOpen ? 'widget-shell widget-shell-menu-open' : 'widget-shell'}>
      {menuOpen && (
        <div
          className="widget-menu"
          onClick={(e) => e.stopPropagation()}
          {...interactiveHandlers}
        >
          <button
            type="button"
            className="widget-menu-btn widget-menu-wide widget-menu-open"
            onMouseDown={toggleApp}
          >
            {mainOpen ? 'Скрыть приложение' : 'Открыть приложение'}
          </button>
        </div>
      )}

      <div
        className="widget-root"
        style={{ background: bg }}
        onClick={onRootClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        {...interactiveHandlers}
        role="button"
        tabIndex={0}
        aria-label={`Rocket Shift, ${tilePercent}%`}
        aria-busy={!state}
      >
        <span className="widget-percent">{tilePercent}%</span>
        <WidgetIconDisplay
          iconId={iconId}
          customPhotoUrl={state?.widgetCustomPhotoUrl}
          className="widget-icon"
        />
      </div>
    </div>
  );
}
