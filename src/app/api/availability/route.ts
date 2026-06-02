import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/queries/availability";
import { servicesConfig } from "@/config/services";
import type { ServiceId } from "@/config/services";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const serviceType = searchParams.get("serviceType") as ServiceId | null;
  const date = searchParams.get("date");
  const duration = searchParams.get("duration");

  const validServiceIds = servicesConfig.map((s) => s.id);

  if (!serviceType || !validServiceIds.includes(serviceType) || !date || !duration) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  // Basic date format guard
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const slots = await getAvailableSlots(
    serviceType,
    Number(duration),
    date
  );

  return NextResponse.json({ slots });
}
