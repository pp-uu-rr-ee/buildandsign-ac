import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  const email = "admin@coolairservices.com";
  await db.delete(users).where(eq(users.email, email));
  await db.insert(users).values({
    name: "Admin User",
    email,
    passwordHash: await bcrypt.hash("Admin1234", 12),
    role: "admin",
    emailVerified: true,
  });
  console.log("✅ Admin created:", email, "/ Admin1234");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
