import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

/** Fresh SQLite database for every test run, migrated with the real migrations. */
export default function setup() {
  for (const f of ["data/test.db", "data/test.db-journal"]) rmSync(f, { force: true });
  rmSync("data/test-uploads", { recursive: true, force: true });
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: "file:./data/test.db" }, stdio: "pipe" });
  return () => {
    rmSync("data/test-uploads", { recursive: true, force: true });
  };
}
