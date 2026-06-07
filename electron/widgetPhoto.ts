import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { AppSettings } from './types';

export const WIDGET_ICON_CUSTOM_ID = 'photo:custom';

const PHOTOS_DIR_NAME = 'widget-photos';
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const STORED_BASENAME = 'custom';

export function getWidgetPhotosDir(dataDir: string): string {
  return path.join(dataDir, PHOTOS_DIR_NAME);
}

export function resolveWidgetPhotoPath(
  dataDir: string,
  fileName: string | null | undefined,
): string | null {
  if (!fileName) return null;
  const safe = path.basename(fileName);
  if (safe !== fileName) return null;
  const full = path.join(getWidgetPhotosDir(dataDir), safe);
  if (!fs.existsSync(full)) return null;
  return full;
}

export function getWidgetCustomPhotoMediaUrl(
  dataDir: string,
  settings: AppSettings,
): string | null {
  const full = resolveWidgetPhotoPath(dataDir, settings.widgetCustomPhotoFile);
  if (!full) return null;
  return pathToFileURL(full).href;
}

export function storeWidgetPhotoFromPicker(
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

    const photosDir = getWidgetPhotosDir(dataDir);
    fs.mkdirSync(photosDir, { recursive: true });
    clearStoredWidgetPhotos(photosDir);

    const fileName = `${STORED_BASENAME}${ext}`;
    const dest = path.join(photosDir, fileName);
    fs.copyFileSync(sourcePath, dest);
    return { ok: true, fileName };
  } catch {
    return { ok: false, error: 'read_failed' };
  }
}

function clearStoredWidgetPhotos(photosDir: string): void {
  if (!fs.existsSync(photosDir)) return;
  for (const name of fs.readdirSync(photosDir)) {
    if (name.startsWith(`${STORED_BASENAME}.`)) {
      try {
        fs.unlinkSync(path.join(photosDir, name));
      } catch {
        /* ignore */
      }
    }
  }
}

export function clearWidgetPhotoFile(
  dataDir: string,
  fileName: string | null | undefined,
): void {
  const full = resolveWidgetPhotoPath(dataDir, fileName);
  if (full) {
    try {
      fs.unlinkSync(full);
    } catch {
      /* ignore */
    }
  }
}
