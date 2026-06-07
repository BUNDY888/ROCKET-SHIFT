import { app } from 'electron';

import { registerWindowsTaskbarIdentity } from './winTaskbarIdentity';

/** Must match package.json build.appId (electron-builder shortcut / toast identity). */
export const APP_ID = 'com.rocketshift.app';

export const APP_DISPLAY_NAME = 'Rocket Shift';

/** Call before app.ready — fixes "Electron" in Windows toast / tray balloons. */
export function configureAppIdentity(): void {
  app.setName(APP_DISPLAY_NAME);
  if (process.platform === 'win32') {
    app.setAppUserModelId(APP_ID);
    registerWindowsTaskbarIdentity();
  }
}
