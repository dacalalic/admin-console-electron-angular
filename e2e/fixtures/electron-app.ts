import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  _electron as electron,
  expect,
  type ElectronApplication,
  type Page,
  test as base,
} from '@playwright/test';

type ElectronFixtures = {
  electronApp: ElectronApplication;
  appWindow: Page;
};

export const test = base.extend<ElectronFixtures>({
  electronApp: async (_fixtures, use) => {
    const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'admin-console-e2e-'));
    const launchEnv = { ...process.env, E2E_USER_DATA_DIR: userDataDir };
    delete launchEnv.ELECTRON_RUN_AS_NODE;

    const electronApp = await electron.launch({
      args: ['.'],
      env: launchEnv,
    });

    try {
      await use(electronApp);
    } finally {
      await electronApp.close();
      await fs.rm(userDataDir, { recursive: true, force: true });
    }
  },

  appWindow: async ({ electronApp }, use) => {
    const appWindow = await electronApp.firstWindow();
    await appWindow.waitForLoadState('domcontentloaded');
    await use(appWindow);
  },
});

export { expect };
