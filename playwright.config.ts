import { defineConfig, devices } from "@playwright/test";

/**
 * Builds the static site and serves ./out the way GitHub Pages would (plain
 * files, 404.html for unknown URLs). Set PW_CHROMIUM_PATH to use an installed
 * Chromium instead of downloading one.
 */
const PORT = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npx serve out -l ${PORT} --no-clipboard`,
    url: `http://localhost:${PORT}/`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
