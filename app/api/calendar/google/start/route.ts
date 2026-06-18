import { NextResponse } from "next/server";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import {
  buildGoogleCalendarAuthUrl,
  googleCalendarCallbackUrl,
  isGoogleCalendarConfigured
} from "@/lib/calendar/google";

export async function GET(request: Request) {
  const userId = await getCurrentAppUserId();

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(new URL("/settings?calendar=not_configured", request.url));
  }

  const url = buildGoogleCalendarAuthUrl({
    state: userId,
    redirectUri: googleCalendarCallbackUrl(request.url)
  });
  return NextResponse.redirect(url);
}
