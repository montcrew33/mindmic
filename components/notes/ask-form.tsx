"use client";

import { useState } from "react";
import { Search } from "lucide-react";

type AskSource = {
  noteId: string;
  noteDate: string;
  title: string;
  content: string;
};

export function AskForm() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<AskSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setAnswer("");
    setSources([]);

    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question })
    });

    const body = await response.json();
    setAnswer(body.answer ?? body.error ?? "No answer returned.");
    setSources(body.sources ?? []);
    setIsLoading(false);
  }

  return (
    <form className="panel stack" onSubmit={submitQuestion}>
      <label className="field">
        <span>Question</span>
        <textarea
          className="textarea"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What did I promise Alex about the pricing follow-up?"
        />
      </label>
      <button className="button" type="submit" disabled={isLoading || !question.trim()}>
        <Search size={18} aria-hidden="true" />
        {isLoading ? "Searching" : "Ask saved notes"}
      </button>
      {answer ? (
        <div className="card">
          <strong>Answer</strong>
          <p>{answer}</p>
          {sources.length > 0 ? (
            <div className="stack">
              <strong>Sources</strong>
              {sources.map((source) => (
                <a className="pill" href={`/notes/${source.noteId}`} key={source.noteId}>
                  {source.title} · {new Date(source.noteDate).toLocaleDateString()}
                </a>
              ))}
            </div>
          ) : (
            <p className="muted">No source notes were retrieved.</p>
          )}
        </div>
      ) : null}
    </form>
  );
}
