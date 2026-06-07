import { useCallback, useEffect, useRef, useState } from 'react';

import type { DayState, AppSettings, Task } from '../../electron/types';

import { todayKey } from '../../electron/types';

import type { StatePayload } from '../../electron/preload';

import { calculateTotalPercent } from '../lib/calculations';



export interface AppState extends StatePayload {

  loading: boolean;

}



export function useAppState() {

  const [state, setState] = useState<AppState | null>(null);

  const savePendingRef = useRef(false);



  const applyPayload = useCallback((payload: StatePayload) => {

    if (savePendingRef.current) return;

    setState({ ...payload, loading: false });

  }, []);



  useEffect(() => {

    if (!window.electronAPI) return;

    window.electronAPI.getState().then(applyPayload);

    const unsub = window.electronAPI.onStateUpdate(applyPayload);

    return unsub;

  }, [applyPayload]);



  const saveDay = useCallback(async (day: DayState): Promise<StatePayload> => {

    return window.electronAPI.saveDay(day);

  }, []);



  const updateTasks = useCallback(

    async (tasks: Task[]): Promise<StatePayload> => {

      const day: DayState = {
        ...(state?.day ?? { date: todayKey(), tasks }),
        tasks,
      };

      savePendingRef.current = true;

      try {

        const payload = await saveDay(day);

        setState({ ...payload, loading: false });

        return payload;

      } finally {

        savePendingRef.current = false;

      }

    },

    [saveDay, state?.day],

  );



  const resetDay = useCallback(async () => {

    await window.electronAPI.resetDay();

  }, []);



  const resetDayFull = useCallback(async () => {

    await window.electronAPI.resetDayFull();

  }, []);



  const saveSettings = useCallback(async (partial: Partial<AppSettings>) => {

    await window.electronAPI.saveSettings(partial);

  }, []);



  const saveTemplate = useCallback(async (name: string) => {

    return window.electronAPI.saveTemplate(name);

  }, []);



  const applyTemplate = useCallback(async (templateId: string) => {

    return window.electronAPI.applyTemplate(templateId);

  }, []);



  const deleteTemplate = useCallback(async (templateId: string) => {

    return window.electronAPI.deleteTemplate(templateId);

  }, []);



  const percent =

    state?.percent ?? (state ? calculateTotalPercent(state.day.tasks) : 0);



  return {

    state,

    percent,

    saveDay,

    updateTasks,

    resetDay,

    resetDayFull,

    saveSettings,

    saveTemplate,

    applyTemplate,

    deleteTemplate,

    savePendingRef,

    setLocalState: setState as React.Dispatch<React.SetStateAction<AppState | null>>,

  };

}

