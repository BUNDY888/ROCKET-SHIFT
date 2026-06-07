import { useEffect, useRef } from 'react';
import { isEditableTarget } from '../lib/hotkeys';

export interface AppHotkeyHandlers {
  onToggleTimer: () => void | Promise<void>;
  onAddTask: () => void;
  onCloseDay: () => void;
}

export function useAppHotkeys(handlers: AppHotkeyHandlers, enabled: boolean) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || event.repeat) return;

      const { onToggleTimer, onAddTask, onCloseDay } = handlersRef.current;

      if (
        event.code === 'Space' &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        void onToggleTimer();
        return;
      }

      if (event.ctrlKey && !event.shiftKey && !event.altKey && event.key === 'n') {
        event.preventDefault();
        onAddTask();
        return;
      }

      if (event.ctrlKey && !event.shiftKey && !event.altKey && event.key === 'd') {
        event.preventDefault();
        onCloseDay();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
