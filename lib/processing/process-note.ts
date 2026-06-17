import { z } from "zod";
import { createOpenAIClient } from "@/lib/openai/client";
import { buildNoteExtractionPrompt, noteExtractionSystemPrompt } from "@/lib/processing/prompts";
import type { NoteExtraction } from "@/lib/processing/types";

const extractionSchema = z.object({
  summary: z.string(),
  cleanedText: z.string(),
  people: z.array(z.string()).default([]),
  companies: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  openLoops: z
    .array(
      z.object({
        description: z.string(),
        assignee: z.string().nullable().optional(),
        dueHint: z.string().nullable().optional()
      })
    )
    .default([]),
  rememberNextTime: z.array(z.string()).default([])
});

export async function extractNoteMemory(input: {
  transcript: string;
  calendarContext?: string | null;
}): Promise<NoteExtraction> {
  const openai = createOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: noteExtractionSystemPrompt },
      { role: "user", content: buildNoteExtractionPrompt(input) }
    ]
  });

  const content = response.choices[0]?.message.content;
  if (!content) {
    throw new Error("OpenAI returned an empty extraction response.");
  }

  return extractionSchema.parse(JSON.parse(content));
}
