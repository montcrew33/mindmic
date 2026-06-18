import { NextResponse } from "next/server";
import {
  exchangeGoogleCodeForTokens,
  syncPrimaryGoogleCalendar
} from "@/lib/calendar/sync";

export async function handleGoogleCalendarCallback(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/settings?calendar=error&reason=${error}`, request.url));
  }

  if (!code || !userId) {
    return NextResponse.redirect(new URL("/settings?calendar=missing_code", request.url));
  }

  try {
    const tokens = await exchangeGoogleCodeForTokens(code);
    const result = await syncPrimaryGoogleCalendar({ userId, tokens });
    return NextResponse.redirect(
      new URL(`/today?calendar=synced&events=${result.synced}`, request.url)
    );
  } catch (syncError) {
    console.error(syncError);
    return NextResponse.redirect(new URL("/settings?calendar=error", request.url));
  }
}
