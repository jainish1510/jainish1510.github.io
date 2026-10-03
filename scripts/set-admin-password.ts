// Change the admin password without touching any content:
//   npm run admin:password -- "my new long password"
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db/client";

const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
let password = process.argv[2];
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question(`New password for ${email} (12+ characters): `);
  rl.close();
}
if (!password || password.length < 12) {
  console.error("The password must be at least 12 characters.");
  process.exit(1);
}
const user = await db.user.findUnique({ where: { email } });
if (!user) {
  console.error(`No admin account for ${email}. Check ADMIN_EMAIL in .env, or run: npm run db:seed`);
  process.exit(1);
}
await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
await db.session.deleteMany({ where: { userId: user.id } }); // sign out everywhere
console.log(`Password updated for ${email}. You can sign in at /admin now.`);
await db.$disconnect();
