import { createOpenAIClient } from "@/lib/openai/client";

export type RetrievedSource = {
  noteId: string;
  noteDate: string;
  title: string;
  content: string;
};

export async function answerFromSources(input: {
  question: string;
  sources: RetrievedSource[];
}) {
  const openai = createOpenAIClient();
  const sourceBlock = input.sources
    .map(
      (source, index) =>
        `[${index + 1}] ${source.title} (${source.noteDate}) note_id=${source.noteId}\n${source.content}`
    )
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Answer only from the provided sources. If the answer is not present, say you cannot find it in saved notes. Include source numbers in the answer."
      },
      {
        role: "user",
        content: `Question: ${input.question}\n\nSources:\n${sourceBlock || "No sources retrieved."}`
      }
    ]
  });

  return response.choices[0]?.message.content ?? "I could not find that in saved notes.";
}
