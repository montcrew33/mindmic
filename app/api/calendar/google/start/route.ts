import { NextResponse } from "next/server";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { buildGoogleCalendarAuthUrl, isGoogleCalendarConfigured } from "@/lib/calendar/google";

export async function GET(request: Request) {
  const userId = await getCurrentAppUserId();

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(new URL("/settings?calendar=not_configured", request.url));
  }

  const url = buildGoogleCalendarAuthUrl(userId);
  return NextResponse.redirect(url);
}
