import { execFileSync } from 'child_process';
import path from 'path';

import { APP_DISPLAY_NAME, APP_ID } from './appIdentity';

function regAdd(key: string, valueName: string | null, data: string): void {
  const args = ['add', key, '/f'];
  if (valueName === null) {
    args.push('/ve', '/d', data, '/t', 'REG_SZ');
  } else {
    args.push('/v', valueName, '/d', data, '/t', 'REG_SZ');
  }
  try {
    execFileSync('reg.exe', args, { stdio: 'ignore', windowsHide: true });
  } catch {
    /* ignore — policy or permissions */
  }
}

/** Links Rocket Shift.exe to com.rocketshift.app so pinned and running icons merge. */
export function registerWindowsTaskbarIdentity(): void {
  if (process.platform !== 'win32') return;

  const exePath = process.execPath;
  const exeName = path.basename(exePath);
  const appsKey = `HKCU\\Software\\Classes\\Applications\\${exeName}`;
  const appIdKey = `HKCU\\Software\\Classes\\AppUserModelId\\${APP_ID}`;

  regAdd(appIdKey, null, APP_DISPLAY_NAME);
  regAdd(`${appIdKey}\\Application`, null, APP_DISPLAY_NAME);
  regAdd(appsKey, 'AppUserModelId', APP_ID);
  regAdd(appsKey, 'ApplicationName', APP_DISPLAY_NAME);
  regAdd(appsKey, 'ApplicationDescription', APP_DISPLAY_NAME);
  regAdd(appsKey, 'ApplicationIcon', `${exePath},0`);
}
