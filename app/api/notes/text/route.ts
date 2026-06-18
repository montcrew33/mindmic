import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { extractNoteMemory } from "@/lib/processing/process-note";
import type { NoteKind } from "@/lib/processing/types";
import { buildSearchableNoteContent } from "@/lib/search/content";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  text: z.string().min(1).max(20000),
  kind: z.enum(["meeting_note", "meeting_prep", "free_note"]).default("free_note"),
  calendarEventId: z.string().uuid().nullable().optional()
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Note text is required." }, { status: 400 });
  }

  const userId = await getCurrentAppUserId();
  const serviceClient = createServiceSupabaseClient();
  const { text, calendarEventId } = parsed.data;
  const kind = parsed.data.kind as NoteKind;

  const { data: event } = calendarEventId
    ? await serviceClient
        .from("calendar_events")
        .select("title,description,attendees,starts_at")
        .eq("id", calendarEventId)
        .eq("user_id", userId)
        .single()
    : { data: null };

  const extraction = await extractNoteMemory({
    transcript: text,
    calendarContext: event
      ? `${event.title} at ${event.starts_at}. Attendees: ${JSON.stringify(event.attendees ?? [])}`
      : null
  });

  const { data: note, error: noteError } = await serviceClient
    .from("notes")
    .insert({
      user_id: userId,
      calendar_event_id: calendarEventId ?? null,
      kind,
      note_type: kind,
      transcript: text,
      raw_transcript: text,
      cleaned_text: extraction.cleanedText,
      cleaned_note: extraction.cleanedText,
      summary: extraction.summary,
      processing_status: "processed",
      processed_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (noteError || !note) {
    return NextResponse.json(
      { error: noteError?.message ?? "Could not save note." },
      { status: 500 }
    );
  }

  const entityRows = [
    ...extraction.people.map((value) => ({ entity_type: "person", value })),
    ...extraction.companies.map((value) => ({ entity_type: "company", value })),
    ...extraction.projects.map((value) => ({ entity_type: "project", value })),
    ...extraction.topics.map((value) => ({ entity_type: "topic", value }))
  ].map((entity) => ({
    user_id: userId,
    note_id: note.id,
    ...entity
  }));

  if (entityRows.length > 0) {
    await serviceClient.from("note_entities").insert(entityRows);
  }

  if (extraction.openLoops.length > 0) {
    await serviceClient.from("open_loops").insert(
      extraction.openLoops.map((loop) => ({
        user_id: userId,
        note_id: note.id,
        source_note_id: note.id,
        description: loop.description,
        assignee: loop.assignee ?? null,
        due_hint: loop.dueHint ?? null,
        status: "open"
      }))
    );
  }

  await serviceClient.from("note_chunks").insert({
    user_id: userId,
    note_id: note.id,
    content: buildSearchableNoteContent({
      summary: extraction.summary,
      cleanedText: extraction.cleanedText,
      transcript: text,
      extraction
    })
  });

  return NextResponse.json({ noteId: note.id });
}
