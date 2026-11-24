import { defineConfig, devices } from '@playwright/test'

// An Electron-based editor can pass its own crash reporter pipe to the shell.
// The test browser must initialize its own crash reporter instead of using it.
const browserEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key, value]) =>
    key.toUpperCase() !== 'CHROME_CRASHPAD_PIPE_NAME' && value !== undefined,
  ),
) as Record<string, string>

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: 2,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4183',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    launchOptions: { env: browserEnv, timeout: 30_000 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: process.env.E2E_USE_PREVIEW === '1'
      ? 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4183 --strictPort --outDir output/playwright/e2e-build'
      : 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4183 --strictPort',
    timeout: 180_000,
    url: 'http://127.0.0.1:4183',
    env: {
      VITE_API_BASE_URL: 'http://127.0.0.1:4179',
      VITE_PUBLIC_BASE_URL: 'http://127.0.0.1:4183',
    },
    reuseExistingServer: false,
  },
})
