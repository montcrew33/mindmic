import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { searchTokens } from "@/lib/search/content";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { answerFromSources } from "@/lib/search/ask";

type OpenLoopSearchRow = {
  description: string;
  note_id: string | null;
  source_note_id: string | null;
};

type NoteSearchRow = {
  id: string;
  summary: string | null;
  created_at: string;
};

type NoteChunkRow = {
  note_id: string;
  content: string;
};

const bodySchema = z.object({
  question: z.string().min(1).max(1000)
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const userId = await getCurrentAppUserId();
  const supabase = createServiceSupabaseClient();

  const query = parsed.data.question;
  const { data: chunks } = await supabase
    .from("note_chunks")
    .select("content,notes(id,summary,created_at)")
    .eq("user_id", userId)
    .textSearch("content_tsv", query, { type: "websearch" })
    .limit(6);

  const sources = new Map<
    string,
    { noteId: string; noteDate: string; title: string; content: string }
  >();

  chunks?.forEach((chunk) => {
      const note = Array.isArray(chunk.notes) ? chunk.notes[0] : chunk.notes;
      const noteId = note?.id ?? "unknown";
      sources.set(noteId, {
        noteId,
        noteDate: note?.created_at ?? "unknown date",
        title: note?.summary ?? "Saved note",
        content: chunk.content
      });
    });

  const tokens = searchTokens(query);
  if (tokens.length > 0) {
    const chunkFallback = await supabase
      .from("note_chunks")
      .select("content,notes(id,summary,created_at)")
      .eq("user_id", userId)
      .or(tokens.map((token) => `content.ilike.%${token}%`).join(","))
      .limit(6);

    chunkFallback.data?.forEach((chunk) => {
      const note = Array.isArray(chunk.notes) ? chunk.notes[0] : chunk.notes;
      const noteId = note?.id ?? "unknown";
      if (sources.has(noteId)) {
        return;
      }

      sources.set(noteId, {
        noteId,
        noteDate: note?.created_at ?? "unknown date",
        title: note?.summary ?? "Saved note",
        content: chunk.content
      });
    });

    const entityFallback = await supabase
      .from("note_entities")
      .select("value,note_id,notes(id,summary,created_at,note_chunks(content))")
      .eq("user_id", userId)
      .or(tokens.map((token) => `value.ilike.%${token}%`).join(","))
      .limit(6);

    entityFallback.data?.forEach((entity) => {
      const note = Array.isArray(entity.notes) ? entity.notes[0] : entity.notes;
      if (!note?.id || sources.has(note.id)) {
        return;
      }

      const chunk = Array.isArray(note.note_chunks) ? note.note_chunks[0] : null;
      sources.set(note.id, {
        noteId: note.id,
        noteDate: note.created_at,
        title: note.summary ?? "Saved note",
        content: [`Matched entity: ${entity.value}`, chunk?.content].filter(Boolean).join("\n\n")
      });
    });
  }

  const asksAboutOpenLoops = /\b(task|tasks|todo|follow|follow-up|open loop|remember)\b/i.test(
    query
  );

  if (asksAboutOpenLoops || sources.size === 0) {
    let loopQuery = supabase
      .from("open_loops")
      .select("description,note_id,source_note_id")
      .eq("user_id", userId)
      .limit(6);

    if (tokens.length > 0) {
      loopQuery = loopQuery.or(
        tokens.map((token) => `description.ilike.%${token}%`).join(",")
      );
    }

    const { data: loops } = await loopQuery.returns<OpenLoopSearchRow[]>();
    const noteIds = Array.from(
      new Set((loops ?? []).map((loop) => loop.note_id ?? loop.source_note_id).filter(Boolean))
    ) as string[];

    if (noteIds.length > 0) {
      const [{ data: notes }, { data: noteChunks }] = await Promise.all([
        supabase
          .from("notes")
          .select("id,summary,created_at")
          .in("id", noteIds)
          .returns<NoteSearchRow[]>(),
        supabase
          .from("note_chunks")
          .select("note_id,content")
          .in("note_id", noteIds)
          .returns<NoteChunkRow[]>()
      ]);

      const notesById = new Map((notes ?? []).map((note) => [note.id, note]));
      const chunksByNoteId = new Map((noteChunks ?? []).map((chunk) => [chunk.note_id, chunk]));

      loops?.forEach((loop) => {
        const noteId = loop.note_id ?? loop.source_note_id;
        const note = noteId ? notesById.get(noteId) : null;
        if (!note?.id || sources.has(note.id)) {
          return;
        }

        const chunk = chunksByNoteId.get(note.id);
        sources.set(note.id, {
          noteId: note.id,
          noteDate: note.created_at,
          title: note.summary ?? "Saved note",
          content: [`Open loop: ${loop.description}`, chunk?.content].filter(Boolean).join("\n\n")
        });
      });
    }
  }

  const sourceList = Array.from(sources.values()).slice(0, 6);

  if (sourceList.length === 0) {
    return NextResponse.json({
      answer: "I could not find that in your saved notes.",
      sources: []
    });
  }

  const answer = await answerFromSources({
    question: query,
    sources: sourceList
  });

  return NextResponse.json({ answer, sources: sourceList });
}
