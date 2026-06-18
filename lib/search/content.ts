import type { NoteExtraction } from "@/lib/processing/types";

export function buildSearchableNoteContent(input: {
  summary: string;
  cleanedText: string;
  transcript: string;
  extraction: NoteExtraction;
}) {
  const openLoops = input.extraction.openLoops
    .map((loop) => `Open loop: ${loop.description}`)
    .join("\n");
  const rememberNextTime = input.extraction.rememberNextTime
    .map((memory) => `Remember next time: ${memory}`)
    .join("\n");
  const entities = [
    ...input.extraction.people,
    ...input.extraction.companies,
    ...input.extraction.projects,
    ...input.extraction.topics
  ].join(", ");

  return [
    input.summary,
    input.cleanedText,
    openLoops,
    rememberNextTime,
    entities ? `Entities: ${entities}` : "",
    input.transcript
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function normalizeSearchTerm(term: string) {
  return term.replace(/[%,]/g, " ").trim();
}

export function searchTokens(term: string) {
  const ignored = new Set([
    "what",
    "were",
    "was",
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "today",
    "task",
    "tasks",
    "open",
    "loops",
    "loop"
  ]);

  return normalizeSearchTerm(term)
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 2 && !ignored.has(token))
    .slice(0, 5);
}
