export type NoteKind = "meeting_note" | "meeting_prep" | "free_note";

export type ExtractedEntity = {
  type: "person" | "company" | "project" | "topic";
  value: string;
};

export type ExtractedOpenLoop = {
  description: string;
  assignee?: string | null;
  dueHint?: string | null;
};

export type NoteExtraction = {
  summary: string;
  cleanedText: string;
  people: string[];
  companies: string[];
  projects: string[];
  topics: string[];
  openLoops: ExtractedOpenLoop[];
  rememberNextTime: string[];
};
