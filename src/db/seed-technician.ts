import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { users, technicians } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding test technician...");

  const email = "tech@coolairservices.com";

  // Upsert user
  await db.delete(users).where(eq(users.email, email));

  const [user] = await db
    .insert(users)
    .values({
      name: "Juan dela Cruz",
      email,
      passwordHash: await bcrypt.hash("Password1", 12),
      role: "technician",
      phone: "+63 917 111 2222",
      emailVerified: true,
    })
    .returning({ id: users.id });

  await db.insert(technicians).values({
    userId: user.id,
    status: "active",
    bio: "5 years experience. Carrier & Daikin certified.",
    specializations: ["cleaning", "repair", "installation", "inspection"],
    // Mon–Sat, 8AM–6PM, 60-min slots
    weeklySchedule: {
      "0": null, // Sunday — off
      "1": { startTime: "08:00", endTime: "18:00", slotDurationMinutes: 60 },
      "2": { startTime: "08:00", endTime: "18:00", slotDurationMinutes: 60 },
      "3": { startTime: "08:00", endTime: "18:00", slotDurationMinutes: 60 },
      "4": { startTime: "08:00", endTime: "18:00", slotDurationMinutes: 60 },
      "5": { startTime: "08:00", endTime: "18:00", slotDurationMinutes: 60 },
      "6": { startTime: "08:00", endTime: "14:00", slotDurationMinutes: 60 }, // Saturday half-day
    },
  });

  console.log(`  ✓ Technician created: ${email} / Password1`);
  console.log("✅ Done.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
