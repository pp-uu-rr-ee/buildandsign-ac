import { db } from "@/db";
import { technicians, bookings, technicianUnavailabilities, users } from "@/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { ServiceId } from "@/config/services";
import type { TimeSlot } from "@/types";

// Generate every slot for a given technician's day given their schedule config
function buildDaySlots(
  date: string, // "YYYY-MM-DD"
  startTime: string, // "08:00"
  endTime: string, // "18:00"
  slotDurationMinutes: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const endTotal = eh * 60 + em;

  let cursor = sh * 60 + sm;
  while (cursor + slotDurationMinutes <= endTotal) {
    const startH = String(Math.floor(cursor / 60)).padStart(2, "0");
    const startM = String(cursor % 60).padStart(2, "0");
    const endMin = cursor + slotDurationMinutes;
    const endH = String(Math.floor(endMin / 60)).padStart(2, "0");
    const endMStr = String(endMin % 60).padStart(2, "0");
    slots.push({ start: `${startH}:${startM}`, end: `${endH}:${endMStr}` });
    cursor += slotDurationMinutes;
  }
  return slots;
}

export async function getAvailableSlots(
  serviceType: ServiceId,
  durationMinutes: number,
  dateStr: string // "YYYY-MM-DD"
): Promise<TimeSlot[]> {
  const date = new Date(dateStr);
  const dayOfWeek = String(date.getDay()); // 0=Sun … 6=Sat

  // 1. Get active technicians who can do this service type
  const activeTechs = await db
    .select({
      id: technicians.id,
      name: users.name,
      weeklySchedule: technicians.weeklySchedule,
    })
    .from(technicians)
    .innerJoin(users, eq(users.id, technicians.userId))
    .where(
      and(
        eq(technicians.status, "active"),
        sql`${technicians.specializations} @> ${JSON.stringify([serviceType])}::jsonb`
      )
    );

  if (activeTechs.length === 0) return [];

  // 2. Get bookings that overlap this date for these technicians
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59`);

  const existingBookings = await db
    .select({
      technicianId: bookings.technicianId,
      scheduledAt: bookings.scheduledAt,
      durationMinutes: bookings.durationMinutes,
    })
    .from(bookings)
    .where(
      and(
        gte(bookings.scheduledAt, dayStart),
        lte(bookings.scheduledAt, dayEnd),
        sql`${bookings.status} NOT IN ('cancelled', 'no_show')`
      )
    );

  // 3. Get unavailability blocks for this date
  const unavailabilities = await db
    .select({
      technicianId: technicianUnavailabilities.technicianId,
      startDate: technicianUnavailabilities.startDate,
      endDate: technicianUnavailabilities.endDate,
    })
    .from(technicianUnavailabilities)
    .where(
      and(
        lte(technicianUnavailabilities.startDate, dayEnd),
        gte(technicianUnavailabilities.endDate, dayStart)
      )
    );

  const slots: TimeSlot[] = [];

  for (const tech of activeTechs) {
    const schedule = tech.weeklySchedule as Record<
      string,
      { startTime: string; endTime: string; slotDurationMinutes: number } | null
    >;

    const daySchedule = schedule[dayOfWeek];
    if (!daySchedule) continue; // day off

    // Check if technician is on leave this whole day
    const isOnLeave = unavailabilities.some(
      (u) =>
        u.technicianId === tech.id &&
        u.startDate <= dayEnd &&
        u.endDate >= dayStart
    );
    if (isOnLeave) continue;

    const techBookings = existingBookings.filter(
      (b) => b.technicianId === tech.id
    );

    const daySlots = buildDaySlots(
      dateStr,
      daySchedule.startTime,
      daySchedule.endTime,
      durationMinutes
    );

    for (const slot of daySlots) {
      const slotStart = new Date(`${dateStr}T${slot.start}:00`);
      const slotEnd = new Date(`${dateStr}T${slot.end}:00`);

      // Check overlap with existing bookings
      const isBusy = techBookings.some((b) => {
        const bStart = new Date(b.scheduledAt);
        const bEnd = new Date(
          bStart.getTime() + b.durationMinutes * 60 * 1000
        );
        return slotStart < bEnd && slotEnd > bStart;
      });

      slots.push({
        technicianId: tech.id,
        technicianName: tech.name,
        date: dateStr,
        startTime: slot.start,
        endTime: slot.end,
        isAvailable: !isBusy,
      });
    }
  }

  // Sort by time, then available first within the same time
  return slots.sort((a, b) => {
    if (a.startTime !== b.startTime)
      return a.startTime.localeCompare(b.startTime);
    return Number(b.isAvailable) - Number(a.isAvailable);
  });
}
