import { requireEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  hangoutLink?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
};

type GoogleEventsResponse = {
  items?: GoogleCalendarEvent[];
};

export async function exchangeGoogleCodeForTokens(input: { code: string; redirectUri: string }) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${await response.text()}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function syncPrimaryGoogleCalendar(input: {
  userId: string;
  tokens: GoogleTokenResponse;
}) {
  const supabase = createServiceSupabaseClient();
  const expiresAt = input.tokens.expires_in
    ? new Date(Date.now() + input.tokens.expires_in * 1000).toISOString()
    : null;

  await supabase.from("calendar_connections").upsert(
    {
      user_id: input.userId,
      provider: "google",
      access_token_ciphertext: input.tokens.access_token,
      refresh_token_ciphertext: input.tokens.refresh_token ?? null,
      scopes: input.tokens.scope?.split(" ") ?? [],
      expires_at: expiresAt,
      sync_status: "syncing",
      last_synced_at: new Date().toISOString()
    },
    { onConflict: "user_id,provider" }
  );

  const now = new Date();
  const timeMin = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString();
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "100");

  const eventsResponse = await fetch(url, {
    headers: {
      authorization: `Bearer ${input.tokens.access_token}`
    }
  });

  if (!eventsResponse.ok) {
    await supabase
      .from("calendar_connections")
      .update({ sync_status: "failed" })
      .eq("user_id", input.userId)
      .eq("provider", "google");
    throw new Error(`Google Calendar sync failed: ${await eventsResponse.text()}`);
  }

  const payload = (await eventsResponse.json()) as GoogleEventsResponse;
  const rows = (payload.items ?? [])
    .filter((event) => event.id && event.start && (event.start.dateTime || event.start.date))
    .map((event) => {
      const startsAt = event.start?.dateTime ?? `${event.start?.date}T00:00:00.000Z`;
      const endsAt = event.end?.dateTime ?? (event.end?.date ? `${event.end.date}T00:00:00.000Z` : null);
      const videoEntry = event.conferenceData?.entryPoints?.find(
        (entry) => entry.entryPointType === "video"
      );

      return {
        user_id: input.userId,
        provider: "google",
        provider_event_id: event.id,
        title: event.summary ?? "Untitled event",
        description: event.description ?? null,
        location: event.location ?? null,
        meeting_url: event.hangoutLink ?? videoEntry?.uri ?? null,
        attendees: event.attendees ?? [],
        starts_at: startsAt,
        ends_at: endsAt,
        raw_payload: event
      };
    });

  if (rows.length > 0) {
    const { error } = await supabase
      .from("calendar_events")
      .upsert(rows, { onConflict: "user_id,provider,provider_event_id" });

    if (error) {
      throw error;
    }
  }

  await supabase
    .from("calendar_connections")
    .update({
      sync_status: "synced",
      last_synced_at: new Date().toISOString()
    })
    .eq("user_id", input.userId)
    .eq("provider", "google");

  return { synced: rows.length };
}
