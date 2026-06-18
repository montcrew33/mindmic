import Link from "next/link";
import { Search } from "lucide-react";
import { setOpenLoopStatus } from "@/app/actions";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { normalizeSearchTerm } from "@/lib/search/content";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type OpenLoopRow = {
  id: string;
  status: string;
  description: string;
  note_id: string | null;
  source_note_id: string | null;
  created_at: string;
};

type SourceNoteRow = {
  id: string;
  summary: string | null;
  created_at: string;
};

export default async function OpenLoopsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const searchTerm = normalizeSearchTerm(q ?? "");
  const statusFilter = status === "done" ? "done" : status === "all" ? "all" : "open";
  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("open_loops")
    .select("id,status,description,note_id,source_note_id,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (searchTerm) {
    query = query.ilike("description", `%${searchTerm}%`);
  }

  const { data: loops } = await query.returns<OpenLoopRow[]>();
  const sourceNoteIds = Array.from(
    new Set((loops ?? []).map((loop) => loop.note_id ?? loop.source_note_id).filter(Boolean))
  ) as string[];
  const { data: sourceNotes } =
    sourceNoteIds.length > 0
      ? await supabase
          .from("notes")
          .select("id,summary,created_at")
          .in("id", sourceNoteIds)
          .returns<SourceNoteRow[]>()
      : { data: [] };
  const notesById = new Map((sourceNotes ?? []).map((note) => [note.id, note]));

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Extracted follow-ups</p>
          <h2 className="page-title">Open Loops</h2>
          <p className="page-subtitle">
            A lightweight list of things to remember. This is deliberately not a task
            manager.
          </p>
        </div>
      </div>

      <form className="search-bar" action="/open-loops">
        <Search size={18} aria-hidden="true" />
        <input
          className="search-input"
          defaultValue={searchTerm}
          name="q"
          placeholder="Search follow-ups..."
        />
        <input name="status" type="hidden" value={statusFilter} />
        <button className="button secondary" type="submit">
          Search
        </button>
      </form>

      <div className="pill-row">
        <Link className={`pill ${statusFilter === "open" ? "active" : ""}`} href="/open-loops">
          Open
        </Link>
        <Link className={`pill ${statusFilter === "done" ? "active" : ""}`} href="/open-loops?status=done">
          Done
        </Link>
        <Link className={`pill ${statusFilter === "all" ? "active" : ""}`} href="/open-loops?status=all">
          All
        </Link>
      </div>

      <div className="panel">
        {(loops ?? []).length === 0 ? (
          <p className="muted">
            {searchTerm ? "No open loops matched that search." : "No open loops yet."}
          </p>
        ) : (
          loops?.map((loop) => {
            const noteId = loop.note_id ?? loop.source_note_id;
            const sourceNote = noteId ? notesById.get(noteId) : null;

            return (
              <article className="card note-card" key={loop.id}>
                <strong>{loop.description}</strong>
                <p className="muted">
                  {loop.status} · {new Date(loop.created_at).toLocaleDateString()}
                </p>
                {sourceNote?.summary ? <p>{sourceNote.summary}</p> : null}
                <div className="pill-row">
                  {noteId ? (
                    <Link className="button secondary" href={`/notes/${noteId}`}>
                      View source note
                    </Link>
                  ) : null}
                  <form action={setOpenLoopStatus}>
                    <input name="loopId" type="hidden" value={loop.id} />
                    <input name="noteId" type="hidden" value={noteId ?? ""} />
                    <input
                      name="status"
                      type="hidden"
                      value={loop.status === "done" ? "open" : "done"}
                    />
                    <button className="button ghost" type="submit">
                      {loop.status === "done" ? "Reopen" : "Mark done"}
                    </button>
                  </form>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
