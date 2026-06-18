import { env, requireEnv } from "@/lib/env";

const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";

export function googleCalendarCallbackUrl(requestUrl: string) {
  return new URL("/api/calendar/google/callback", requestUrl).toString();
}

export function buildGoogleCalendarAuthUrl(input: { state: string; redirectUri: string }) {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.readonly"
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state: input.state
  });

  return `${googleAuthUrl}?${params.toString()}`;
}

export function isGoogleCalendarConfigured() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
