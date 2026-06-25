import "dotenv/config";
import { db } from "./index";
import { technicians } from "./schema";

/**
 * Brings existing technicians in line with the current booking hours:
 * open every day (Sun–Sat) 09:00–18:00 with 60-minute slots.
 *
 * Run once after changing the default schedule:
 *   npx tsx src/db/update-tech-schedule.ts
 */
const SCHEDULE = {
  "0": { startTime: "09:00", endTime: "18:00", slotDurationMinutes: 60 },
  "1": { startTime: "09:00", endTime: "18:00", slotDurationMinutes: 60 },
  "2": { startTime: "09:00", endTime: "18:00", slotDurationMinutes: 60 },
  "3": { startTime: "09:00", endTime: "18:00", slotDurationMinutes: 60 },
  "4": { startTime: "09:00", endTime: "18:00", slotDurationMinutes: 60 },
  "5": { startTime: "09:00", endTime: "18:00", slotDurationMinutes: 60 },
  "6": { startTime: "09:00", endTime: "18:00", slotDurationMinutes: 60 },
};

async function main() {
  const updated = await db
    .update(technicians)
    .set({ weeklySchedule: SCHEDULE, updatedAt: new Date() })
    .returning({ id: technicians.id });

  console.log(`✅ Updated ${updated.length} technician(s) to 09:00–18:00, every day.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed to update schedules:", err);
  process.exit(1);
});
