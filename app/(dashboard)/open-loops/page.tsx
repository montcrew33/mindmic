import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { normalizeSearchTerm } from "@/lib/search/content";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export default async function OpenLoopsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const searchTerm = normalizeSearchTerm(q ?? "");
  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("open_loops")
    .select("id,status,description,note_id,source_note_id,created_at,notes(summary,created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (searchTerm) {
    query = query.ilike("description", `%${searchTerm}%`);
  }

  const { data: loops } = await query;

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
        <button className="button secondary" type="submit">
          Search
        </button>
      </form>

      <div className="panel">
        {(loops ?? []).length === 0 ? (
          <p className="muted">
            {searchTerm ? "No open loops matched that search." : "No open loops yet."}
          </p>
        ) : (
          loops?.map((loop) => (
            <article className="card note-card" key={loop.id}>
              <strong>{loop.description}</strong>
              <p className="muted">
                {loop.status} · {new Date(loop.created_at).toLocaleDateString()}
              </p>
              <Link className="button secondary" href={`/notes/${loop.note_id ?? loop.source_note_id}`}>
                View source note
              </Link>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
