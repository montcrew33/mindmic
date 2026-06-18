import { NextResponse } from "next/server";
import { createOpenAIClient } from "@/lib/openai/client";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { extractNoteMemory } from "@/lib/processing/process-note";
import type { NoteKind } from "@/lib/processing/types";
import { buildSearchableNoteContent } from "@/lib/search/content";
import {
  DIRECT_TRANSCRIPTION_MAX_BYTES,
  HARD_MAX_SECONDS,
  HARD_UPLOAD_MAX_BYTES
} from "@/lib/recording/limits";

async function transcribeAudioFiles(files: File[]) {
  const openai = createOpenAIClient();
  const transcriptSections: string[] = [];

  for (const [index, file] of files.entries()) {
    if (file.size > DIRECT_TRANSCRIPTION_MAX_BYTES) {
      throw new Error(
        `Audio section ${index + 1} is too large for direct transcription. Try a shorter note.`
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1"
    });

    transcriptSections.push(transcription.text);
  }

  return transcriptSections.join("\n\n");
}

export async function POST(request: Request) {
  const userId = await getCurrentAppUserId();

  const formData = await request.formData();
  const audio = formData.get("audio");
  const audioChunks = formData.getAll("audioChunks");
  const kind = (formData.get("kind") ?? "free_note") as NoteKind;
  const calendarEventId = formData.get("calendarEventId")?.toString() || null;
  const durationSeconds = Number(formData.get("durationSeconds") ?? 0);

  const files =
    audio instanceof File
      ? [audio]
      : audioChunks.filter((chunk): chunk is File => chunk instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (durationSeconds > HARD_MAX_SECONDS || totalBytes > HARD_UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: "Recording exceeds the MVP safety limit." },
      { status: 413 }
    );
  }

  const serviceClient = createServiceSupabaseClient();
  const transcript = await transcribeAudioFiles(files);

  const { data: event } = calendarEventId
    ? await serviceClient
        .from("calendar_events")
        .select("title,description,attendees,starts_at")
        .eq("id", calendarEventId)
        .eq("user_id", userId)
        .single()
    : { data: null };

  const extraction = await extractNoteMemory({
    transcript,
    calendarContext: event
      ? `${event.title} at ${event.starts_at}. Attendees: ${JSON.stringify(event.attendees ?? [])}`
      : null
  });

  const { data: note, error: noteError } = await serviceClient
    .from("notes")
    .insert({
      user_id: userId,
      calendar_event_id: calendarEventId,
      kind,
      note_type: kind,
      transcript,
      raw_transcript: transcript,
      cleaned_text: extraction.cleanedText,
      cleaned_note: extraction.cleanedText,
      summary: extraction.summary,
      processing_status: "processed",
      processed_at: new Date().toISOString(),
      audio_deleted_at: new Date().toISOString()
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
      transcript,
      extraction
    })
  });

  return NextResponse.json({ noteId: note.id });
}
