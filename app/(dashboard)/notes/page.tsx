import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const noteTypeLabels: Record<string, string> = {
  meeting_note: "Meeting note",
  meeting_prep: "Prep note",
  free_note: "Free note"
};

export default async function NotesPage() {
  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("id,summary,note_type,kind,created_at,calendar_events(title,starts_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Source of truth</p>
          <h2 className="page-title">Notes</h2>
          <p className="page-subtitle">
            Recent dictated notes. Search and filters come later; for now this is the
            source record behind open loops and Ask.
          </p>
        </div>
        <button className="button secondary" type="button" disabled>
          <Search size={18} aria-hidden="true" />
          Search later
        </button>
      </div>

      <div className="panel">
        {(notes ?? []).length === 0 ? (
          <p className="muted">No notes yet. Record one to create the first source note.</p>
        ) : (
          notes?.map((note) => {
            const calendarEvent = Array.isArray(note.calendar_events)
              ? note.calendar_events[0]
              : note.calendar_events;
            const noteType = note.note_type ?? note.kind;

            return (
              <Link className="card note-card" href={`/notes/${note.id}`} key={note.id}>
                <article>
                  <strong>{note.summary ?? "Untitled note"}</strong>
                  <p className="muted">
                    {noteTypeLabels[noteType] ?? "Note"} ·{" "}
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                  {calendarEvent ? (
                    <p className="muted">
                      Related meeting: {calendarEvent.title} ·{" "}
                      {new Date(calendarEvent.starts_at).toLocaleString()}
                    </p>
                  ) : null}
                </article>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
