import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ calendar?: string }>;
}) {
  const { calendar } = await searchParams;
  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  const { data: connection } = await supabase
    .from("calendar_connections")
    .select("sync_status,last_synced_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Privacy and integrations</p>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">
            Connect calendar context and choose whether raw audio is retained.
          </p>
        </div>
      </div>

      <div className="grid two">
        <div className="panel stack">
          <h3>Google Calendar</h3>
          <p className="muted">
            Calendar context helps the app attach notes to the right meeting, person,
            or project. Notes still work without it.
          </p>
          {calendar === "error" ? (
            <p className="muted">Google Calendar connection failed. Check your OAuth settings.</p>
          ) : null}
          {calendar === "not_configured" ? (
            <p className="muted">
              Google Calendar is not configured yet. Add the Google client ID, client
              secret, and redirect URI in your environment variables.
            </p>
          ) : null}
          {connection ? (
            <p className="muted">
              Status: {connection.sync_status}
              {connection.last_synced_at
                ? ` · Last synced ${new Date(connection.last_synced_at).toLocaleString()}`
                : ""}
            </p>
          ) : null}
          <Link className="button" href="/api/calendar/google/start">
            <CalendarPlus size={18} aria-hidden="true" />
            {connection ? "Reconnect Google Calendar" : "Connect Google Calendar"}
          </Link>
        </div>

        <div className="panel stack">
          <h3>Audio retention</h3>
          <label className="field">
            <span>Raw audio policy</span>
            <select className="select" defaultValue="delete">
              <option value="delete">Delete after transcription</option>
              <option value="keep">Keep raw audio</option>
            </select>
          </label>
          <p className="muted">
            The database remains the source of truth for searchable memory.
          </p>
        </div>
      </div>
    </section>
  );
}
