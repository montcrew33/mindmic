import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUserId } from "@/lib/auth/current-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { answerFromSources } from "@/lib/search/ask";

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

  const sources =
    chunks?.map((chunk) => {
      const note = Array.isArray(chunk.notes) ? chunk.notes[0] : chunk.notes;
      return {
        noteId: note?.id ?? "unknown",
        noteDate: note?.created_at ?? "unknown date",
        title: note?.summary ?? "Saved note",
        content: chunk.content
      };
    }) ?? [];

  if (sources.length === 0) {
    return NextResponse.json({
      answer: "I could not find that in your saved notes.",
      sources: []
    });
  }

  const answer = await answerFromSources({
    question: query,
    sources
  });

  return NextResponse.json({ answer, sources });
}
