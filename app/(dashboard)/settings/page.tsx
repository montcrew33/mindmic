import Link from "next/link";
import { CalendarPlus } from "lucide-react";

export default function SettingsPage() {
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
          <Link className="button" href="/api/calendar/google/start">
            <CalendarPlus size={18} aria-hidden="true" />
            Connect Google Calendar
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
