import { NextResponse } from "next/server";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { buildGoogleCalendarAuthUrl, isGoogleCalendarConfigured } from "@/lib/calendar/google";

export async function GET() {
  const userId = await getCurrentAppUserId();

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar OAuth environment variables are not configured." },
      { status: 500 }
    );
  }

  const url = buildGoogleCalendarAuthUrl(userId);
  return NextResponse.redirect(url);
}
