import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { AppSettings } from './types';

const SOUNDS_DIR_NAME = 'sounds';
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_EXT = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm', '.flac']);

export function getSoundsDir(dataDir: string): string {
  return path.join(dataDir, SOUNDS_DIR_NAME);
}

export function resolveCelebrationSoundPath(
  dataDir: string,
  fileName: string | null | undefined,
): string | null {
  if (!fileName) return null;
  const safe = path.basename(fileName);
  if (safe !== fileName) return null;
  const full = path.join(getSoundsDir(dataDir), safe);
  if (!fs.existsSync(full)) return null;
  return full;
}

export function getCelebrationSoundMediaUrl(
  dataDir: string,
  settings: AppSettings,
): string | null {
  const full = resolveCelebrationSoundPath(dataDir, settings.celebrationSoundFile);
  if (!full) return null;
  return pathToFileURL(full).href;
}

export function storeCelebrationSoundFromPicker(
  dataDir: string,
  sourcePath: string,
): { ok: true; fileName: string } | { ok: false; error: 'unsupported' | 'too_large' | 'read_failed' } {
  const ext = path.extname(sourcePath).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, error: 'unsupported' };
  }

  try {
    const stat = fs.statSync(sourcePath);
    if (stat.size > MAX_BYTES) {
      return { ok: false, error: 'too_large' };
    }

    const soundsDir = getSoundsDir(dataDir);
    fs.mkdirSync(soundsDir, { recursive: true });
    clearStoredSounds(soundsDir);

    const fileName = `celebration${ext}`;
    const dest = path.join(soundsDir, fileName);
    fs.copyFileSync(sourcePath, dest);
    return { ok: true, fileName };
  } catch {
    return { ok: false, error: 'read_failed' };
  }
}

function clearStoredSounds(soundsDir: string): void {
  if (!fs.existsSync(soundsDir)) return;
  for (const name of fs.readdirSync(soundsDir)) {
    if (name.startsWith('celebration.')) {
      try {
        fs.unlinkSync(path.join(soundsDir, name));
      } catch {
        /* ignore */
      }
    }
  }
}

export function clearCelebrationSoundFile(
  dataDir: string,
  fileName: string | null | undefined,
): void {
  const full = resolveCelebrationSoundPath(dataDir, fileName);
  if (full) {
    try {
      fs.unlinkSync(full);
    } catch {
      /* ignore */
    }
  }
}
