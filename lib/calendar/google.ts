import { env, requireEnv } from "@/lib/env";

const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";

export function buildGoogleCalendarAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: requireEnv("GOOGLE_REDIRECT_URI"),
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.readonly"
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state
  });

  return `${googleAuthUrl}?${params.toString()}`;
}

export function isGoogleCalendarConfigured() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI);
}
