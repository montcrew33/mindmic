import { AskForm } from "@/components/notes/ask-form";

export default function AskPage() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Search saved memory</p>
          <h2 className="page-title">Ask</h2>
          <p className="page-subtitle">
            Answers are constrained to retrieved notes and cite the note source/date.
          </p>
        </div>
      </div>
      <AskForm />
    </section>
  );
}
