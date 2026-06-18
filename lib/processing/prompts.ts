export const noteExtractionSystemPrompt = `
You clean up private dictated professional notes.
Return strict JSON only.
Do not invent details that are not in the transcript or supplied calendar context.
Extract lightweight open loops, not full project-management tasks.
Create an open loop for every concrete follow-up, reminder, or action the user says they need to remember.
Examples: send credentials, schedule a meeting, transfer a domain, get someone to sign an agreement, set up an account, configure a tool, follow up with a person.
Do not require a due date or explicit assignee. Keep each open loop short and source-grounded.
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
