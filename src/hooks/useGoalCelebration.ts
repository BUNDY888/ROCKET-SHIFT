import { useEffect, useRef, useState } from 'react';
import { computeDailyGoalState } from '../../electron/dayClose';
import { playCelebrationSound, playGoalReachSound } from '../lib/goalCelebration';

interface Options {
  percent: number;
  goalEnabled: boolean;
  goalPercent: number;
  celebrationEnabled: boolean;
  celebrationSoundUrl: string | null;
  celebrationSoundAt100: boolean;
  celebrationSoundAtGoal: boolean;
  celebrationSoundDurationSec: number;
}

export function useGoalCelebration({
  percent,
  goalEnabled,
  goalPercent,
  celebrationEnabled,
  celebrationSoundUrl,
  celebrationSoundAt100,
  celebrationSoundAtGoal,
  celebrationSoundDurationSec,
}: Options): boolean {
  const [animating, setAnimating] = useState(false);
  const wasReached = useRef<boolean | null>(null);
  const was100 = useRef<boolean | null>(null);

  const goal = computeDailyGoalState(percent, goalEnabled, goalPercent);
  const is100 = percent >= 100;
  const hasCustom = Boolean(celebrationSoundUrl);

  const pulse = () => {
    setAnimating(true);
    window.setTimeout(() => setAnimating(false), 1200);
  };

  const playBuiltInGoal = () => playGoalReachSound();

  const playFor100 = () => {
    if (hasCustom && celebrationSoundAt100) {
      playCelebrationSound(celebrationSoundUrl, playBuiltInGoal, celebrationSoundDurationSec);
    } else if (celebrationEnabled) {
      playBuiltInGoal();
    }
  };

  const playForGoal = () => {
    if (hasCustom && celebrationSoundAtGoal) {
      playCelebrationSound(celebrationSoundUrl, playBuiltInGoal, celebrationSoundDurationSec);
    } else if (celebrationEnabled) {
      playBuiltInGoal();
    }
  };

  useEffect(() => {
    const can100 =
      celebrationEnabled || (hasCustom && celebrationSoundAt100);

    if (!can100) {
      was100.current = is100;
      return;
    }

    if (was100.current === null) {
      was100.current = is100;
      return;
    }

    if (is100 && !was100.current) {
      playFor100();
      pulse();
      was100.current = true;
      return;
    }

    if (!is100) {
      was100.current = false;
    } else {
      was100.current = true;
    }
  }, [
    celebrationEnabled,
    celebrationSoundAt100,
    celebrationSoundUrl,
    celebrationSoundDurationSec,
    hasCustom,
    is100,
  ]);

  useEffect(() => {
    if (!celebrationEnabled || !goal.dailyGoalEnabled) {
      wasReached.current = goal.goalReached;
      return;
    }

    if (wasReached.current === null) {
      wasReached.current = goal.goalReached;
      return;
    }

    if (goal.goalReached && !wasReached.current) {
      if (is100 && hasCustom && celebrationSoundAt100) {
        wasReached.current = true;
        return;
      }
      playForGoal();
      pulse();
      wasReached.current = true;
      return;
    }

    if (!goal.goalReached) {
      wasReached.current = false;
    }
  }, [
    celebrationEnabled,
    celebrationSoundAtGoal,
    celebrationSoundAt100,
    celebrationSoundUrl,
    goal.dailyGoalEnabled,
    goal.goalReached,
    celebrationSoundDurationSec,
    hasCustom,
    is100,
  ]);

  return animating;
}
