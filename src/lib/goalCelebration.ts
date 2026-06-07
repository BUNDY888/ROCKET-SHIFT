let audioContext: AudioContext | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentStopTimer: ReturnType<typeof setTimeout> | null = null;
let playingListener: ((playing: boolean) => void) | null = null;

/** По умолчанию, если в настройках не задано */
export const DEFAULT_CELEBRATION_TRACK_DURATION_SEC = 10;

/** 0 = весь трек; иначе лимит в миллисекундах (макс. 10 мин). */
export function celebrationDurationToMaxMs(durationSec: number): number | null {
  const sec = Math.round(durationSec);
  if (sec <= 0) return null;
  return Math.min(600, Math.max(1, sec)) * 1000;
}

function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

function notifyPlaying(playing: boolean): void {
  playingListener?.(playing);
}

function stopCurrentAudio(): void {
  if (currentStopTimer) {
    clearTimeout(currentStopTimer);
    currentStopTimer = null;
  }
  if (!currentAudio) {
    notifyPlaying(false);
    return;
  }
  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio.onended = null;
  currentAudio.onerror = null;
  currentAudio = null;
  notifyPlaying(false);
}

export function setCelebrationSoundPlayingListener(
  listener: ((playing: boolean) => void) | null,
): void {
  playingListener = listener;
}

export function isCelebrationSoundPlaying(): boolean {
  return currentAudio !== null;
}

export function stopCelebrationSound(): void {
  stopCurrentAudio();
}

function playCustomTrack(
  soundUrl: string,
  fallback: () => void,
  durationSec = DEFAULT_CELEBRATION_TRACK_DURATION_SEC,
): void {
  stopCurrentAudio();
  const audio = new Audio(soundUrl);
  currentAudio = audio;
  audio.volume = 0.88;
  const maxMs = celebrationDurationToMaxMs(durationSec);

  const finish = () => {
    if (currentAudio === audio) {
      stopCurrentAudio();
    }
  };

  audio.onended = finish;
  audio.onerror = () => {
    if (currentAudio === audio) {
      stopCurrentAudio();
      fallback();
    }
  };

  void audio.play().then(() => {
    if (currentAudio !== audio) return;
    notifyPlaying(true);
    if (maxMs != null) {
      currentStopTimer = setTimeout(finish, maxMs);
    }
  }).catch(() => {
    if (currentAudio === audio) {
      stopCurrentAudio();
      fallback();
    }
  });
}

export function playCelebrationSound(
  soundUrl: string | null,
  fallback: () => void,
  durationSec = DEFAULT_CELEBRATION_TRACK_DURATION_SEC,
): void {
  if (!soundUrl) {
    fallback();
    return;
  }
  playCustomTrack(soundUrl, fallback, durationSec);
}

export function playGoalReachSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(ctx, 523.25, t, 0.32, 0.1);
  playTone(ctx, 659.25, t + 0.1, 0.32, 0.1);
  playTone(ctx, 783.99, t + 0.2, 0.4, 0.11);
}

export function playTrophyCloseSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [392, 523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, t + i * 0.09, 0.38, 0.09);
  });
}

export function previewCelebrationSound(
  soundUrl: string,
  durationSec = DEFAULT_CELEBRATION_TRACK_DURATION_SEC,
): void {
  playCustomTrack(soundUrl, () => playGoalReachSound(), durationSec);
}

export function toggleCelebrationSoundPreview(
  soundUrl: string,
  durationSec = DEFAULT_CELEBRATION_TRACK_DURATION_SEC,
): void {
  if (isCelebrationSoundPlaying()) {
    stopCelebrationSound();
    return;
  }
  previewCelebrationSound(soundUrl, durationSec);
}

export function formatCelebrationDurationHint(durationSec: number): string {
  if (durationSec <= 0) return 'до конца файла';
  if (durationSec >= 60) {
    const m = Math.floor(durationSec / 60);
    const s = durationSec % 60;
    return s === 0 ? `${m} мин` : `${m} мин ${s} с`;
  }
  return `${durationSec} с`;
}
