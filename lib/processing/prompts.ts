export const noteExtractionSystemPrompt = `
You clean up private dictated professional notes.
Return strict JSON only.
Do not invent details that are not in the transcript or supplied calendar context.
Extract lightweight open loops, not full project-management tasks.
`;

export function buildNoteExtractionPrompt(input: {
  transcript: string;
  calendarContext?: string | null;
}) {
  return `
Calendar context:
${input.calendarContext ?? "None"}

Transcript:
${input.transcript}

Return JSON with:
- summary: concise source-grounded summary
- cleanedText: readable first-person note
- people: string[]
- companies: string[]
- projects: string[]
- topics: string[]
- openLoops: { description, assignee, dueHint }[]
- rememberNextTime: string[]
`;
}
