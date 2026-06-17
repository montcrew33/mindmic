import Link from "next/link";
import { Mic } from "lucide-react";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export default async function TodayPage() {
  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("id,title,starts_at,ends_at,attendees,meeting_url")
    .eq("user_id", userId)
    .gte("starts_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString())
    .order("starts_at", { ascending: true })
    .limit(12);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{today}</p>
          <h2 className="page-title">Today</h2>
          <p className="page-subtitle">
            Meetings are optional context. A note can be attached to one, used as prep,
            or saved as a free thought.
          </p>
        </div>
        <Link className="button" href="/record">
          <Mic size={18} aria-hidden="true" />
          Record note
        </Link>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3>Calendar context</h3>
          <div style={{ marginTop: 16 }}>
            {(events ?? []).length === 0 ? (
              <div className="empty-state">
                <Mic size={28} aria-hidden="true" />
                <strong>No calendar yet</strong>
                <p className="muted">
                  Record free notes now. Calendar context can be connected later.
                </p>
              </div>
            ) : (
              events?.map((event) => (
                <article className="card" key={event.id}>
                  <strong>{event.title}</strong>
                  <p className="muted">
                    {new Date(event.starts_at).toLocaleString()} ·{" "}
                    {Array.isArray(event.attendees) ? event.attendees.length : 0} people
                  </p>
                  <Link className="button secondary" href={`/record?eventId=${event.id}`}>
                    Dictate private note
                  </Link>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="panel">
          <h3>Fast capture</h3>
          <p className="muted">
            The MVP is optimized for short dictated thoughts. Long meeting recordings and
            team collaboration stay out of scope.
          </p>
          <div className="status" style={{ marginTop: 16 }}>
            <strong>Pipeline</strong>
            <p className="muted">
              Audio to transcript to cleaned memory to open loops to searchable source.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
