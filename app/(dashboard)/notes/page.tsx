import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { normalizeSearchTerm } from "@/lib/search/content";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const noteTypeLabels: Record<string, string> = {
  meeting_note: "Meeting note",
  meeting_prep: "Prep note",
  free_note: "Free note"
};

export default async function NotesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const searchTerm = normalizeSearchTerm(q ?? "");
  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("notes")
    .select("id,summary,note_type,kind,created_at,calendar_events(title,starts_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (searchTerm) {
    query = query.or(
      `summary.ilike.%${searchTerm}%,cleaned_note.ilike.%${searchTerm}%,raw_transcript.ilike.%${searchTerm}%`
    );
  }

  const { data: notes } = await query;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Source of truth</p>
          <h2 className="page-title">Notes</h2>
          <p className="page-subtitle">
            Search recent dictated notes by summary, cleaned note, or transcript.
          </p>
        </div>
      </div>

      <form className="search-bar" action="/notes">
        <Search size={18} aria-hidden="true" />
        <input
          className="search-input"
          defaultValue={searchTerm}
          name="q"
          placeholder="Search notes, people, projects..."
        />
        <button className="button secondary" type="submit">
          Search
        </button>
      </form>

      <div className="panel">
        {(notes ?? []).length === 0 ? (
          <p className="muted">
            {searchTerm ? "No notes matched that search." : "No notes yet. Record one to create the first source note."}
          </p>
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
