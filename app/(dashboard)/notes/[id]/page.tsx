import { notFound } from "next/navigation";
import Link from "next/link";
import { Mic } from "lucide-react";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const noteTypeLabels: Record<string, string> = {
  meeting_note: "Meeting note",
  meeting_prep: "Prep note",
  free_note: "Free note"
};

export default async function NoteDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  const [{ data: note }, { data: entities }, { data: loops }] = await Promise.all([
    supabase
      .from("notes")
      .select("*,calendar_events(title,starts_at,ends_at,attendees,meeting_url)")
      .eq("id", id)
      .eq("user_id", userId)
      .single(),
    supabase.from("note_entities").select("*").eq("note_id", id).eq("user_id", userId),
    supabase.from("open_loops").select("*").eq("note_id", id).eq("user_id", userId)
  ]);

  if (!note) {
    notFound();
  }

  const noteType = note.note_type ?? note.kind;
  const calendarEvent = Array.isArray(note.calendar_events)
    ? note.calendar_events[0]
    : note.calendar_events;
  const cleanedNote = note.cleaned_note ?? note.cleaned_text;
  const rawTranscript = note.raw_transcript ?? note.transcript;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{new Date(note.created_at).toLocaleString()}</p>
          <h2 className="page-title">{note.summary ?? "Untitled note"}</h2>
          <p className="page-subtitle">
            {noteTypeLabels[noteType] ?? "Note"}
            {calendarEvent ? ` · ${calendarEvent.title}` : ""}
          </p>
        </div>
        <div className="pill-row">
          <Link className="button secondary" href="/notes">
            All notes
          </Link>
          <Link className="button" href="/record">
            <Mic size={18} aria-hidden="true" />
            Record another
          </Link>
        </div>
      </div>

      <div className="grid two">
        <article className="panel stack">
          <h3>Summary</h3>
          <p>{note.summary ?? "Processing has not completed."}</p>

          <h3>Cleaned note</h3>
          <p>{cleanedNote ?? "Processing has not completed."}</p>

          <details className="transcript-block">
            <summary>Raw transcript</summary>
            <p className="muted">{rawTranscript ?? "No transcript yet."}</p>
          </details>
        </article>
        <aside className="panel stack">
          <h3>Source</h3>
          <div className="card">
            <strong>{noteTypeLabels[noteType] ?? "Note"}</strong>
            <p className="muted">Created {new Date(note.created_at).toLocaleString()}</p>
            {calendarEvent ? (
              <p className="muted">
                Related meeting: {calendarEvent.title} ·{" "}
                {new Date(calendarEvent.starts_at).toLocaleString()}
              </p>
            ) : (
              <p className="muted">No calendar event attached.</p>
            )}
          </div>

          <h3>Entities</h3>
          <div className="pill-row">
            {(entities ?? []).length === 0 ? <p className="muted">No tags extracted.</p> : null}
            {entities?.map((entity) => (
              <span className="pill" key={entity.id}>
                {entity.entity_type}: {entity.value}
              </span>
            ))}
          </div>
          <h3>Open loops</h3>
          {(loops ?? []).length === 0 ? (
            <p className="muted">No follow-ups extracted.</p>
          ) : (
            loops?.map((loop) => (
              <div className="card note-card" key={loop.id}>
                <strong>{loop.description}</strong>
                <p className="muted">
                  {loop.status}
                  {loop.due_hint ? ` · ${loop.due_hint}` : ""}
                </p>
              </div>
            ))
          )}
        </aside>
      </div>
    </section>
  );
}
