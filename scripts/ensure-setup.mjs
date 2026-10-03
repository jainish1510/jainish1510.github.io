// Runs automatically before `npm run dev` and `npm start` (see "predev"/"prestart").
// Makes a fresh checkout start with one command: checks Node, creates .env with
// random secrets, creates the SQLite database and fills it with starter content.
// Everything is skipped (in about a second) once it has been done.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 12)) {
  console.error(`\n  Node.js ${process.versions.node} is too old. This site needs Node.js 22.12 or newer.\n  Install the "LTS" version from https://nodejs.org, then open a NEW terminal and try again.\n`);
  process.exit(1);
}

const run = (cmd, args, quiet = false) => {
  const r = spawnSync(cmd, args, { stdio: quiet ? "pipe" : "inherit", shell: true, env: process.env });
  if (r.status !== 0) {
    if (quiet) process.stderr.write(String(r.stdout ?? "") + String(r.stderr ?? ""));
    console.error(`\n  Setup step failed: ${cmd} ${args.join(" ")}\n  See the Troubleshooting section of README.md.\n`);
    process.exit(r.status ?? 1);
  }
};

// 1. .env with generated secrets
let createdPassword = null;
if (!existsSync(".env")) {
  createdPassword = randomBytes(9).toString("base64url"); // 12 chars
  const example = readFileSync(".env.example", "utf8")
    .replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${randomBytes(32).toString("hex")}"`)
    .replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD="${createdPassword}"`);
  writeFileSync(".env", example);
  console.log("  Created .env with fresh random secrets.");
}

// 1b. A hand-made .env may leave secrets blank — fill them in rather than failing.
{
  let env = readFileSync(".env", "utf8");
  const blank = (key) => new RegExp(`^${key}=\\s*(""|'')?\\s*$`, "m").test(env);
  if (blank("SESSION_SECRET")) env = env.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${randomBytes(32).toString("hex")}"`);
  if (blank("ADMIN_PASSWORD") && !existsSync(path.resolve(root, "data/portfolio.db"))) {
    createdPassword = randomBytes(9).toString("base64url");
    env = env.replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD="${createdPassword}"`);
  }
  writeFileSync(".env", env);
}

// 2. Load .env into this process so the child commands see it
for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}
const dbUrl = process.env.DATABASE_URL ?? "file:./data/portfolio.db";
const dbFile = path.resolve(root, dbUrl.replace(/^file:/, ""));
const isNewDb = !existsSync(dbFile);
mkdirSync(path.dirname(dbFile), { recursive: true });

// 3. Database client + migrations (cheap no-ops when already up to date)
if (!existsSync("src/generated/prisma/client.ts")) run("npx", ["prisma", "generate"], true);
run("npx", ["prisma", "migrate", "deploy"], true);

// 4. Starter content on first run only
if (isNewDb) {
  console.log("  Creating the database and starter content (about 10 seconds)…");
  run("npx", ["tsx", "prisma/seed.ts"], true);
}

if (createdPassword) {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const line = (s) => `  │ ${s.padEnd(50)} │`;
  console.log(["", "  ┌" + "─".repeat(52) + "┐", line("YOUR ADMIN LOGIN  (shown once — save it)"), line(""), line(`Address:   http://localhost:3000/admin`), line(`Email:     ${email}`), line(`Password:  ${createdPassword}`), line(""), line("Saved in the .env file if you forget it."), "  └" + "─".repeat(52) + "┘", ""].join("\n"));
}
