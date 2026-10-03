import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against an isolated SQLite database (data/e2e.db), migrated and
 * seeded from scratch, on port 3100 so it never touches your dev data.
 * Set PW_CHROMIUM_PATH to use a preinstalled Chromium instead of downloading.
 */
const PORT = 3100;
const env = {
  DATABASE_URL: "file:./data/e2e.db",
  UPLOAD_DIR: "data/e2e-uploads",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-0000",
  ADMIN_EMAIL: "e2e@example.com",
  ADMIN_PASSWORD: "e2e-password-123456",
  NEXT_DIST_DIR: ".next-e2e",
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /public\.spec\.ts/ },
  ],
  webServer: {
    command: `rm -f data/e2e.db && npx prisma migrate deploy && npx tsx prisma/seed.ts && npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env,
  },
});
