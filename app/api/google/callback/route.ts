import { handleGoogleCalendarCallback } from "@/lib/calendar/callback";

export async function GET(request: Request) {
  return handleGoogleCalendarCallback(request);
}
